"""phase_b_issue_assignment_confirmations_photos

Adds staff assignment / resolver attribution, anonymous confirmation counter
and photo reference columns to issue_reports, plus the report_confirmations
table with a unique (report_id, participant_hash) constraint.

All new issue_reports columns are nullable or carry server defaults so that
existing records are preserved unchanged.

Revision ID: c3e5a7b9d1f2
Revises: b2d4f6a8c0e1
Create Date: 2026-11-26 11:12:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3e5a7b9d1f2'
down_revision: Union[str, None] = 'b2d4f6a8c0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('issue_reports', sa.Column('assigned_staff_id', sa.Integer(), nullable=True))
    op.add_column('issue_reports', sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('issue_reports', sa.Column('resolved_by_staff_id', sa.Integer(), nullable=True))
    op.add_column(
        'issue_reports',
        sa.Column('confirmation_count', sa.Integer(), server_default=sa.text('0'), nullable=False),
    )
    op.add_column('issue_reports', sa.Column('photo_key', sa.String(length=255), nullable=True))
    op.add_column('issue_reports', sa.Column('photo_content_type', sa.String(length=50), nullable=True))
    op.create_foreign_key(
        'fk_issue_reports_assigned_staff_id',
        'issue_reports',
        'staff_accounts',
        ['assigned_staff_id'],
        ['id'],
        ondelete='RESTRICT',
    )
    op.create_foreign_key(
        'fk_issue_reports_resolved_by_staff_id',
        'issue_reports',
        'staff_accounts',
        ['resolved_by_staff_id'],
        ['id'],
        ondelete='RESTRICT',
    )
    op.create_index(op.f('ix_issue_reports_assigned_staff_id'), 'issue_reports', ['assigned_staff_id'], unique=False)
    op.create_index(op.f('ix_issue_reports_resolved_by_staff_id'), 'issue_reports', ['resolved_by_staff_id'], unique=False)

    op.create_table(
        'report_confirmations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('report_id', sa.Integer(), nullable=False),
        sa.Column('participant_hash', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['report_id'], ['issue_reports.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('report_id', 'participant_hash', name='uq_report_confirmation_participant'),
    )
    op.create_index(op.f('ix_report_confirmations_id'), 'report_confirmations', ['id'], unique=False)
    op.create_index(op.f('ix_report_confirmations_report_id'), 'report_confirmations', ['report_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_report_confirmations_report_id'), table_name='report_confirmations')
    op.drop_index(op.f('ix_report_confirmations_id'), table_name='report_confirmations')
    op.drop_table('report_confirmations')

    op.drop_index(op.f('ix_issue_reports_resolved_by_staff_id'), table_name='issue_reports')
    op.drop_index(op.f('ix_issue_reports_assigned_staff_id'), table_name='issue_reports')
    op.drop_constraint('fk_issue_reports_resolved_by_staff_id', 'issue_reports', type_='foreignkey')
    op.drop_constraint('fk_issue_reports_assigned_staff_id', 'issue_reports', type_='foreignkey')
    op.drop_column('issue_reports', 'photo_content_type')
    op.drop_column('issue_reports', 'photo_key')
    op.drop_column('issue_reports', 'confirmation_count')
    op.drop_column('issue_reports', 'resolved_by_staff_id')
    op.drop_column('issue_reports', 'assigned_at')
    op.drop_column('issue_reports', 'assigned_staff_id')
