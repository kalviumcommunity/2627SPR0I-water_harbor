import io
import threading
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy.orm import Session

from app.cli.provision_staff import (
    provision_staff_account,
    rotate_staff_key,
    set_staff_active_state,
)
from app.core.config import Settings
from app.core.photos import process_photo_bytes
from app.core.storage import LocalStorageBackend, StorageError, validate_key


def _make_image_bytes(fmt: str = "PNG", color: tuple = (16, 36, 84)) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", (32, 32), color=color)
    img.save(buf, format=fmt)
    return buf.getvalue()


def test_staff_provisioning_three_accounts_unique_keys_and_activation(db: Session, client: TestClient):
    """Three independent staff accounts can be provisioned with Argon2id hashes and toggled."""
    a1 = provision_staff_account(db, "staff-alpha", "Staff Alpha", "alpha-secure-key-2026")
    a2 = provision_staff_account(db, "staff-beta", "Staff Beta", "beta-secure-key-2026")
    a3 = provision_staff_account(db, "staff-gamma", "Staff Gamma", "gamma-secure-key-2026")

    assert a1.access_key_hash.startswith("$argon2id$")
    assert a2.access_key_hash.startswith("$argon2id$")
    assert a3.access_key_hash.startswith("$argon2id$")

    # Duplicate key across accounts must be rejected
    with pytest.raises(ValueError, match="already in use"):
        provision_staff_account(db, "staff-delta", "Staff Delta", "alpha-secure-key-2026")

    # Deactivated account cannot log in
    set_staff_active_state(db, "staff-beta", False)
    res_disabled = client.post("/api/staff/login", json={"access_key": "beta-secure-key-2026"})
    assert res_disabled.status_code == 401

    # Reactivated account can log in
    set_staff_active_state(db, "staff-beta", True)
    res_enabled = client.post("/api/staff/login", json={"access_key": "beta-secure-key-2026"})
    assert res_enabled.status_code == 200
    assert res_enabled.json()["staff"]["identifier"] == "staff-beta"

    # Key rotation invalidates old key and accepts new key
    rotate_staff_key(db, "staff-gamma", "gamma-rotated-key-2026")
    assert client.post("/api/staff/login", json={"access_key": "gamma-secure-key-2026"}).status_code == 401
    assert client.post("/api/staff/login", json={"access_key": "gamma-rotated-key-2026"}).status_code == 200


def test_photo_validation_and_storage_security(tmp_path):
    """Validate MIME/content/size checks, path traversal prevention, and production S3 rule."""
    png_bytes = _make_image_bytes("PNG")
    processed = process_photo_bytes(png_bytes, "image/png")
    assert processed.extension == "png"
    assert processed.content_type == "image/png"

    # Mismatched MIME vs actual content must be rejected
    with pytest.raises(Exception):
        process_photo_bytes(png_bytes, "image/jpeg")

    # Non-image bytes must be rejected
    with pytest.raises(Exception):
        process_photo_bytes(b"not-an-image-payload", "image/jpeg")

    # Path traversal keys must be rejected
    storage = LocalStorageBackend(str(tmp_path))
    for bad_key in ("../etc/passwd", "/abs/path.jpg", "reports/../../x.png", "reports/evil.svg"):
        with pytest.raises(StorageError):
            validate_key(bad_key)
        with pytest.raises(StorageError):
            storage.load(bad_key)

    # Production requires S3 storage when photo uploads are enabled
    prod_local = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        SESSION_SECRET_KEY="P" * 40,
        STORAGE_BACKEND="local",
        PHOTO_UPLOADS_ENABLED=True,
    )
    with pytest.raises(ValueError, match="STORAGE_BACKEND=s3"):
        prod_local.validate_storage_configuration()

    prod_s3 = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        SESSION_SECRET_KEY="P" * 40,
        STORAGE_BACKEND="s3",
        S3_BUCKET="water-harbor-photos",
        S3_ACCESS_KEY_ID="test-access-key",
        S3_SECRET_ACCESS_KEY="test-secret-key",
        PHOTO_UPLOADS_ENABLED=True,
    )
    prod_s3.validate_storage_configuration()


def test_read_limited_enforces_byte_limit():
    import asyncio
    from fastapi import HTTPException
    from app.core import photos

    class FakeUpload:
        def __init__(self, content):
            self.content = content
            self.requested_sizes = []

        async def read(self, size):
            self.requested_sizes.append(size)
            chunk = self.content[:size]
            self.content = self.content[size:]
            return chunk

    exact = FakeUpload(b"12345")
    assert asyncio.run(photos.read_limited(exact, 5)) == b"12345"

    oversized = FakeUpload(b"123456")
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(photos.read_limited(oversized, 5))

    assert exc_info.value.status_code == 413
    assert max(oversized.requested_sizes) <= 6


def test_photo_pixel_limit_enforced_without_global_mutation(monkeypatch):
    """PHOTO_MAX_PIXELS is enforced strictly without mutating Image.MAX_IMAGE_PIXELS."""
    from fastapi import HTTPException
    from app.core import photos

    original_global_limit = Image.MAX_IMAGE_PIXELS
    monkeypatch.setattr(photos.settings, "PHOTO_MAX_PIXELS", 100)

    # 10x10 = 100 pixels -> allowed
    ok_buf = io.BytesIO()
    Image.new("RGB", (10, 10), color=(0, 128, 255)).save(ok_buf, format="PNG")
    processed = process_photo_bytes(ok_buf.getvalue(), "image/png")
    assert processed.extension == "png"

    # 11x10 = 110 pixels -> rejected before full decode
    big_buf = io.BytesIO()
    Image.new("RGB", (11, 10), color=(0, 128, 255)).save(big_buf, format="PNG")
    with pytest.raises(HTTPException) as exc_info:
        process_photo_bytes(big_buf.getvalue(), "image/png")
    assert exc_info.value.status_code == 400
    assert "pixels" in exc_info.value.detail.lower()

    # Global Image.MAX_IMAGE_PIXELS must remain untouched
    assert Image.MAX_IMAGE_PIXELS == original_global_limit


def test_concurrent_atomic_claim_allows_only_one_winner(db: Session):
    """Two threads racing to claim the same report result in exactly one winner."""
    from tests.conftest import TestingSessionLocal
    from app.models.water_point import WaterPoint
    from app.models.report import IssueReport
    from app.repositories.report_repository import report_repo

    s1 = provision_staff_account(db, "tech-1", "Technician 1", "tech-one-secure-2026")
    s2 = provision_staff_account(db, "tech-2", "Technician 2", "tech-two-secure-2026")

    wp = WaterPoint(name="Race Station", location="Corridor", type="dispenser")
    db.add(wp)
    db.commit()
    db.refresh(wp)

    rep = IssueReport(water_point_id=wp.id, description="No water flow")
    db.add(rep)
    db.commit()
    db.refresh(rep)

    results = []
    barrier = threading.Barrier(2)

    def attempt(staff_id: int):
        local_db = TestingSessionLocal()
        try:
            barrier.wait(timeout=5)
            won = report_repo.claim_atomic(local_db, report_id=rep.id, staff_id=staff_id)
            results.append(won)
        finally:
            local_db.close()

    t1 = threading.Thread(target=attempt, args=(s1.id,))
    t2 = threading.Thread(target=attempt, args=(s2.id,))
    t1.start()
    t2.start()
    t1.join(timeout=5)
    t2.join(timeout=5)

    assert sorted(results) == [False, True]


def test_staff_reassignment_and_deactivation_guard(db: Session):
    """Open issues must be reassigned before deactivating staff; resolved reports are untouched."""
    from app.cli.provision_staff import reassign_open_issues
    from app.models.report import IssueReport, ReportStatus
    from app.models.water_point import WaterPoint

    s1 = provision_staff_account(db, "lead-1", "Lead One", "lead-one-key-2026")
    s2 = provision_staff_account(db, "lead-2", "Lead Two", "lead-two-key-2026")
    s_inactive = provision_staff_account(
        db, "lead-off", "Lead Off", "lead-off-key-2026", is_active=False
    )

    wp1 = WaterPoint(name="WP 1", location="Hall 1")
    wp2 = WaterPoint(name="WP 2", location="Hall 2")
    db.add_all([wp1, wp2])
    db.commit()
    db.refresh(wp1)
    db.refresh(wp2)

    open_rep = IssueReport(
        water_point_id=wp1.id,
        description="Open issue",
        status=ReportStatus.REPORTED_UNAVAILABLE.value,
        assigned_staff_id=s1.id,
    )
    resolved_rep = IssueReport(
        water_point_id=wp2.id,
        description="Closed issue",
        status=ReportStatus.STAFF_CONFIRMED_RESOLVED.value,
        assigned_staff_id=s1.id,
        resolved_by=s1.display_name,
    )
    db.add_all([open_rep, resolved_rep])
    db.commit()

    # Deactivating s1 while open_rep is assigned must fail clearly
    with pytest.raises(ValueError, match="Reassign them first"):
        set_staff_active_state(db, "lead-1", False)

    # Reassigning to inactive or nonexistent target must fail
    with pytest.raises(ValueError, match="inactive"):
        reassign_open_issues(db, "lead-1", "lead-off")
    with pytest.raises(ValueError, match="not found"):
        reassign_open_issues(db, "lead-1", "nobody")

    # Reassign open issues from lead-1 to active lead-2
    moved = reassign_open_issues(db, "lead-1", "lead-2")
    assert moved == 1
    db.expire_all()
    assert db.get(IssueReport, open_rep.id).assigned_staff_id == s2.id
    assert db.get(IssueReport, open_rep.id).status == ReportStatus.REPORTED_UNAVAILABLE.value
    # Resolved report must remain attributed to s1
    assert db.get(IssueReport, resolved_rep.id).assigned_staff_id == s1.id

    # Now s1 can be deactivated safely
    disabled = set_staff_active_state(db, "lead-1", False)
    assert disabled.is_active is False


def test_true_two_transaction_confirmation_vs_resolution_race(db: Session):
    """Two-transaction race between confirmation and resolution yields one consistent outcome."""
    from tests.conftest import TestingSessionLocal
    from app.models.report import IssueReport, ReportConfirmation, ReportStatus
    from app.models.water_point import WaterPoint
    from app.repositories.report_repository import report_repo

    wp = WaterPoint(name="Concurrent WP", location="Lobby")
    db.add(wp)
    db.commit()
    db.refresh(wp)

    rep = IssueReport(water_point_id=wp.id, description="No pressure")
    db.add(rep)
    db.commit()
    db.refresh(rep)

    barrier = threading.Barrier(2)
    confirm_outcome = []

    def run_confirm():
        s = TestingSessionLocal()
        try:
            barrier.wait(timeout=5)
            outcome, _ = report_repo.add_confirmation(s, report_id=rep.id, participant_hash="b" * 64)
            confirm_outcome.append(outcome)
        finally:
            s.close()

    def run_resolve():
        s = TestingSessionLocal()
        try:
            row = report_repo.get_by_id(s, rep.id)
            barrier.wait(timeout=5)
            report_repo.update_status_resolved(s, row, resolved_by="Tech")
        finally:
            s.close()

    t1 = threading.Thread(target=run_confirm)
    t2 = threading.Thread(target=run_resolve)
    t1.start()
    t2.start()
    t1.join(timeout=5)
    t2.join(timeout=5)

    db.expire_all()
    final_rep = db.get(IssueReport, rep.id)
    conf_rows = db.query(ReportConfirmation).filter(ReportConfirmation.report_id == rep.id).count()
    assert final_rep.status == ReportStatus.STAFF_CONFIRMED_RESOLVED.value
    assert confirm_outcome[0] in ("created", "inactive")
    if confirm_outcome[0] == "created":
        assert final_rep.confirmation_count == 1
        assert conf_rows == 1
    else:
        assert final_rep.confirmation_count == 0
        assert conf_rows == 0


def test_add_confirmation_does_not_mask_fk_error_as_duplicate(db: Session):
    """Unrelated IntegrityError (such as nonexistent report_id FK) must not map to duplicate."""
    from sqlalchemy.exc import IntegrityError
    from app.repositories.report_repository import report_repo

    with pytest.raises(IntegrityError):
        report_repo.add_confirmation(db, report_id=999999, participant_hash="c" * 64)
