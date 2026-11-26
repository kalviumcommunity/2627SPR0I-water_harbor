"""add_staff_session_version

Adds ``session_version`` to ``staff_accounts`` so rotating a staff access key
immediately invalidates all previously issued session cookies.

Revision ID: d4f6b8c0e2a3
Revises: c3e5a7b9d1f2
Create Date: 2026-11-26 12:12:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4f6b8c0e2a3'
down_revision: Union[str, None] = 'c3e5a7b9d1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'staff_accounts',
        sa.Column('session_version', sa.Integer(), server_default=sa.text('1'), nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('staff_accounts', 'session_version')
