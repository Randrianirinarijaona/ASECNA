"""add bidirectional links + local technical points

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── 1. Liaisons bidirectionnelles (LinkManagerModal.tsx) ─────────────
    op.add_column(
        "network_links",
        sa.Column("bidirectional", sa.Boolean, nullable=False, server_default=sa.false()),
    )

    # ─── 2. Points techniques locaux (module Réseau local) ────────────────
    op.create_table(
        "local_technical_points",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "parent_airport_key", sa.String(64),
            sa.ForeignKey("airports.key", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("lat", sa.Float, nullable=False),
        sa.Column("lng", sa.Float, nullable=False),
    )
    op.create_index(
        "ix_local_technical_points_parent", "local_technical_points", ["parent_airport_key"]
    )

    op.create_table(
        "local_technical_point_parameters",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "point_id", sa.String(36),
            sa.ForeignKey("local_technical_points.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("name", sa.String(150), nullable=False),
    )

    op.create_table(
        "local_technical_point_parameter_values",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "parameter_id", sa.String(36),
            sa.ForeignKey("local_technical_point_parameters.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("text", sa.String(500), nullable=False),
    )

    # ─── 3. Les 4 aéroports existants rejoignent le Réseau local ──────────
    # Aligne les données existantes sur le nouveau comportement par défaut
    # du frontend (localNetworkAirportKeys pré-rempli avec les 4 aéroports
    # initiaux). Sans effet si ces aéroports n'existent pas encore
    # (installation neuve : le seed s'en charge directement).
    op.execute(
        "UPDATE airports SET in_local_network = 1 "
        "WHERE `key` IN ('TNR', 'DIE', 'MJG', 'Fort Dauphin')"
    )


def downgrade() -> None:
    op.drop_table("local_technical_point_parameter_values")
    op.drop_table("local_technical_point_parameters")
    op.drop_index("ix_local_technical_points_parent", table_name="local_technical_points")
    op.drop_table("local_technical_points")
    op.drop_column("network_links", "bidirectional")
