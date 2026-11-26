"""phase_b_campus_locations_and_water_point_fields

Adds the hierarchical campus_locations table and persists water-point type,
structured campus location, active status and updated_at on water_points.

All new water_points columns are nullable or carry server defaults so that
existing records are preserved unchanged.

Revision ID: b2d4f6a8c0e1
Revises: 9b4e1c2f7a10
Create Date: 2026-11-26 11:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2d4f6a8c0e1'
down_revision: Union[str, None] = '9b4e1c2f7a10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'campus_locations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('location_type', sa.String(length=30), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('display_order', sa.Integer(), server_default=sa.text('0'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['parent_id'], ['campus_locations.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_campus_locations_id'), 'campus_locations', ['id'], unique=False)
    op.create_index(op.f('ix_campus_locations_parent_id'), 'campus_locations', ['parent_id'], unique=False)
    op.create_index(op.f('ix_campus_locations_location_type'), 'campus_locations', ['location_type'], unique=False)
    op.create_index(op.f('ix_campus_locations_is_active'), 'campus_locations', ['is_active'], unique=False)
    op.create_index(
        'uq_campus_location_sibling_name',
        'campus_locations',
        [sa.text('coalesce(parent_id, 0)'), sa.text('lower(name)')],
        unique=True,
    )

    op.add_column('water_points', sa.Column('type', sa.String(length=50), nullable=True))
    op.add_column('water_points', sa.Column('campus_location_id', sa.Integer(), nullable=True))
    op.add_column(
        'water_points',
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
    )
    op.add_column(
        'water_points',
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_foreign_key(
        'fk_water_points_campus_location_id',
        'water_points',
        'campus_locations',
        ['campus_location_id'],
        ['id'],
        ondelete='RESTRICT',
    )
    op.create_index(op.f('ix_water_points_type'), 'water_points', ['type'], unique=False)
    op.create_index(op.f('ix_water_points_campus_location_id'), 'water_points', ['campus_location_id'], unique=False)
    op.create_index(op.f('ix_water_points_is_active'), 'water_points', ['is_active'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_water_points_is_active'), table_name='water_points')
    op.drop_index(op.f('ix_water_points_campus_location_id'), table_name='water_points')
    op.drop_index(op.f('ix_water_points_type'), table_name='water_points')
    op.drop_constraint('fk_water_points_campus_location_id', 'water_points', type_='foreignkey')
    op.drop_column('water_points', 'updated_at')
    op.drop_column('water_points', 'is_active')
    op.drop_column('water_points', 'campus_location_id')
    op.drop_column('water_points', 'type')

    op.drop_index('uq_campus_location_sibling_name', table_name='campus_locations')
    op.drop_index(op.f('ix_campus_locations_is_active'), table_name='campus_locations')
    op.drop_index(op.f('ix_campus_locations_location_type'), table_name='campus_locations')
    op.drop_index(op.f('ix_campus_locations_parent_id'), table_name='campus_locations')
    op.drop_index(op.f('ix_campus_locations_id'), table_name='campus_locations')
    op.drop_table('campus_locations')
