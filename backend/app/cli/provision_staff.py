"""
Local-only CLI for provisioning and managing Water Harbor staff accounts.

Usage (from ``backend/``):
    python -m app.cli.provision_staff create --identifier <id> --display-name "<name>"
    python -m app.cli.provision_staff list
    python -m app.cli.provision_staff activate --identifier <id>
    python -m app.cli.provision_staff deactivate --identifier <id>
    python -m app.cli.provision_staff reassign-issues --from <source_id> --to <target_id>
    python -m app.cli.provision_staff rotate-key --identifier <id>

Security guarantees:
- Access keys are read from an interactive TTY prompt (hidden) or stdin, never CLI args.
- Only Argon2id hashes are persisted in PostgreSQL; plaintext keys are never stored or logged.
- Each staff account must have a unique access key.
- Rotating a key increments session_version so previously issued session cookies are invalidated.
"""
import argparse
import getpass
import sys
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.core.security import hash_access_key, verify_access_key
from app.db.session import SessionLocal
from app.models.report import IssueReport, ReportStatus
from app.models.staff_account import StaffAccount

MIN_KEY_LENGTH = 12


def _read_access_key(from_stdin: bool = False) -> str:
    if from_stdin:
        key = sys.stdin.readline().rstrip("\r\n")
    else:
        key = getpass.getpass("Enter staff access key (min 12 chars): ")
        confirm = getpass.getpass("Confirm staff access key: ")
        if key != confirm:
            raise ValueError("Access keys do not match.")

    if not key or len(key.strip()) < MIN_KEY_LENGTH:
        raise ValueError(f"Access key must be at least {MIN_KEY_LENGTH} characters long.")
    if key != key.strip():
        raise ValueError("Access key must not have leading or trailing whitespace.")
    return key


def _ensure_unique_key(db: Session, plain_key: str, exclude_id: Optional[int] = None) -> None:
    query = db.query(StaffAccount)
    if exclude_id is not None:
        query = query.filter(StaffAccount.id != exclude_id)
    for existing in query.all():
        if verify_access_key(plain_key, existing.access_key_hash):
            raise ValueError("Access key is already in use by another staff account.")


def provision_staff_account(
    db: Session,
    identifier: str,
    display_name: str,
    plain_key: str,
    is_active: bool = True,
) -> StaffAccount:
    ident = identifier.strip().lower()
    name = display_name.strip()
    if not ident:
        raise ValueError("Identifier is required.")
    if not name:
        raise ValueError("Display name is required.")
    if len(plain_key.strip()) < MIN_KEY_LENGTH:
        raise ValueError(f"Access key must be at least {MIN_KEY_LENGTH} characters long.")

    if db.query(StaffAccount).filter(StaffAccount.identifier == ident).first():
        raise ValueError(f"Staff account '{ident}' already exists.")

    _ensure_unique_key(db, plain_key)
    account = StaffAccount(
        identifier=ident,
        display_name=name,
        access_key_hash=hash_access_key(plain_key),
        is_active=is_active,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def set_staff_active_state(db: Session, identifier: str, is_active: bool) -> StaffAccount:
    ident = identifier.strip().lower()
    account = db.query(StaffAccount).filter(StaffAccount.identifier == ident).first()
    if not account:
        raise ValueError(f"Staff account '{ident}' not found.")
    if not is_active:
        open_count = (
            db.query(IssueReport)
            .filter(
                IssueReport.assigned_staff_id == account.id,
                IssueReport.status == ReportStatus.REPORTED_UNAVAILABLE.value,
            )
            .count()
        )
        if open_count > 0:
            raise ValueError(
                f"Cannot deactivate '{account.identifier}': {open_count} unresolved issue(s) "
                f"are still assigned to this account. Reassign them first using "
                f"'reassign-issues --from {account.identifier} --to <target-identifier>'."
            )
    if account.is_active != is_active:
        account.is_active = is_active
        account.session_version = (account.session_version or 1) + 1
    db.commit()
    db.refresh(account)
    return account


def reassign_open_issues(db: Session, from_identifier: str, to_identifier: str) -> int:
    """
    Transactionally reassign all unresolved issues from ``from_identifier`` to
    an active ``to_identifier``. Never modifies resolved reports.
    """
    src_ident = from_identifier.strip().lower()
    dst_ident = to_identifier.strip().lower()
    if not src_ident or not dst_ident:
        raise ValueError("Both source and target staff identifiers are required.")
    if src_ident == dst_ident:
        raise ValueError("Source and target staff accounts must be different.")

    source = db.query(StaffAccount).filter(StaffAccount.identifier == src_ident).first()
    if not source:
        raise ValueError(f"Source staff account '{src_ident}' not found.")

    target = db.query(StaffAccount).filter(StaffAccount.identifier == dst_ident).first()
    if not target:
        raise ValueError(f"Target staff account '{dst_ident}' not found.")
    if not target.is_active:
        raise ValueError(f"Target staff account '{dst_ident}' is inactive and cannot receive issues.")

    stmt = (
        update(IssueReport)
        .where(
            IssueReport.assigned_staff_id == source.id,
            IssueReport.status == ReportStatus.REPORTED_UNAVAILABLE.value,
        )
        .values(
            assigned_staff_id=target.id,
            assigned_at=datetime.now(timezone.utc),
        )
    )
    result = db.execute(stmt)
    db.commit()
    return int(result.rowcount or 0)


def rotate_staff_key(db: Session, identifier: str, plain_key: str) -> StaffAccount:
    ident = identifier.strip().lower()
    account = db.query(StaffAccount).filter(StaffAccount.identifier == ident).first()
    if not account:
        raise ValueError(f"Staff account '{ident}' not found.")
    if len(plain_key.strip()) < MIN_KEY_LENGTH:
        raise ValueError(f"Access key must be at least {MIN_KEY_LENGTH} characters long.")
    _ensure_unique_key(db, plain_key, exclude_id=account.id)
    account.access_key_hash = hash_access_key(plain_key)
    account.session_version = (account.session_version or 1) + 1
    db.commit()
    db.refresh(account)
    return account


def main(argv: Optional[list] = None) -> int:
    parser = argparse.ArgumentParser(description="Manage Water Harbor staff accounts locally.")
    sub = parser.add_subparsers(dest="command", required=True)

    p_create = sub.add_parser("create", help="Provision a new staff account")
    p_create.add_argument("--identifier", required=True, help="Unique staff identifier (e.g. staff-1)")
    p_create.add_argument("--display-name", required=True, help="Display name shown to staff")
    p_create.add_argument("--inactive", action="store_true", help="Create account in inactive state")
    p_create.add_argument("--access-key-stdin", action="store_true", help="Read access key from stdin")

    sub.add_parser("list", help="List provisioned staff accounts (never displays keys or hashes)")

    p_act = sub.add_parser("activate", help="Activate a staff account")
    p_act.add_argument("--identifier", required=True)

    p_deact = sub.add_parser("deactivate", help="Deactivate a staff account")
    p_deact.add_argument("--identifier", required=True)

    p_reassign = sub.add_parser("reassign-issues", help="Reassign open issues to another active staff account")
    p_reassign.add_argument("--from", dest="from_identifier", required=True, help="Source staff identifier")
    p_reassign.add_argument("--to", dest="to_identifier", required=True, help="Target active staff identifier")

    p_rot = sub.add_parser("rotate-key", help="Rotate the Argon2id access key for a staff account")
    p_rot.add_argument("--identifier", required=True)
    p_rot.add_argument("--access-key-stdin", action="store_true", help="Read new access key from stdin")

    args = parser.parse_args(argv)
    db = SessionLocal()
    try:
        if args.command == "create":
            key = _read_access_key(from_stdin=args.access_key_stdin)
            acc = provision_staff_account(
                db,
                identifier=args.identifier,
                display_name=args.display_name,
                plain_key=key,
                is_active=not args.inactive,
            )
            print(f"Provisioned staff account #{acc.id} ({acc.identifier}, active={acc.is_active}).")
        elif args.command == "list":
            accounts = db.query(StaffAccount).order_by(StaffAccount.id.asc()).all()
            if not accounts:
                print("No staff accounts provisioned.")
            for acc in accounts:
                status_label = "active" if acc.is_active else "inactive"
                print(f"#{acc.id}\t{acc.identifier}\t{acc.display_name}\t[{status_label}]")
        elif args.command == "activate":
            acc = set_staff_active_state(db, args.identifier, True)
            print(f"Activated staff account '{acc.identifier}'.")
        elif args.command == "deactivate":
            acc = set_staff_active_state(db, args.identifier, False)
            print(f"Deactivated staff account '{acc.identifier}'.")
        elif args.command == "reassign-issues":
            moved = reassign_open_issues(db, args.from_identifier, args.to_identifier)
            print(f"Reassigned {moved} open issue(s) from '{args.from_identifier}' to '{args.to_identifier}'.")
        elif args.command == "rotate-key":
            key = _read_access_key(from_stdin=args.access_key_stdin)
            acc = rotate_staff_key(db, args.identifier, key)
            print(f"Rotated access key for '{acc.identifier}' (session_version={acc.session_version}).")
        return 0
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
