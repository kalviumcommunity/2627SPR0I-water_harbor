"""add_staff_accounts_table

Revision ID: 9b4e1c2f7a10
Revises: 79ca8cba1935
Create Date: 2026-11-25 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b4e1c2f7a10'
down_revision: Union[str, None] = '79ca8cba1935'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'staff_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('identifier', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=100), nullable=False),
        sa.Column('access_key_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_staff_accounts_id'), 'staff_accounts', ['id'], unique=False)
    op.create_index(op.f('ix_staff_accounts_identifier'), 'staff_accounts', ['identifier'], unique=True)
    op.create_index(op.f('ix_staff_accounts_is_active'), 'staff_accounts', ['is_active'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_staff_accounts_is_active'), table_name='staff_accounts')
    op.drop_index(op.f('ix_staff_accounts_identifier'), table_name='staff_accounts')
    op.drop_index(op.f('ix_staff_accounts_id'), table_name='staff_accounts')
    op.drop_table('staff_accounts')
