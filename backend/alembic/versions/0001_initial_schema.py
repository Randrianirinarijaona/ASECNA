"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-07-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── users ──────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("username", sa.String(50), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=True, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "technicien", "user", name="roleenum"), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("last_login", sa.DateTime, nullable=True),
    )
    op.create_index("ix_users_username", "users", ["username"])

    # ─── airports ───────────────────────────────────────────────────────
    op.create_table(
        "airports",
        sa.Column("key", sa.String(64), primary_key=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("iata", sa.String(20), nullable=False, server_default=""),
        sa.Column("lat", sa.Float, nullable=False),
        sa.Column("lng", sa.Float, nullable=False),
        sa.Column("is_technical_point", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("in_local_network", sa.Boolean, nullable=False, server_default=sa.false()),
    )

    # ─── network_items (sections sfa/sma/srna) ────────────────────────
    op.create_table(
        "network_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("airport_key", sa.String(64), sa.ForeignKey("airports.key", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.Enum("sfa", "sma", "srna", name="networkcategoryenum"), nullable=False),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("details", sa.JSON, nullable=True),
        sa.Column("status", sa.Enum("operational", "maintenance", "planned", name="itemstatusenum"), nullable=True),
    )
    op.create_index("ix_network_items_airport_category", "network_items", ["airport_key", "category"])
    op.create_unique_constraint(
        "uq_network_items_airport_category_title", "network_items", ["airport_key", "category", "title"]
    )

    # ─── network_sub_parameters ────────────────────────────────────────
    op.create_table(
        "network_sub_parameters",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("item_id", sa.String(36), sa.ForeignKey("network_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("value", sa.String(255), nullable=False),
        sa.Column(
            "status",
            sa.Enum("operational", "maintenance", name="subparamstatusenum"),
            nullable=False,
            server_default="operational",
        ),
        sa.Column("description", sa.Text, nullable=True),
    )

    # ─── network_links (liaisons) ───────────────────────────────────────
    # NOTE : version d'origine, sans les champs direction/type/circuit/ip/
    # port/status (ajoutés en 0003) ni bidirectional (ajouté en 0002 puis
    # remplacé par direction en 0003). Historique conservé tel quel.
    op.create_table(
        "network_links",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("category", sa.Enum("sfa", "sma", "srna", name="networkcategoryenum"), nullable=False),
        sa.Column("item_title", sa.String(150), nullable=False),
        sa.Column("from_airport_key", sa.String(64), sa.ForeignKey("airports.key", ondelete="CASCADE"), nullable=False),
        sa.Column("to_airport_key", sa.String(64), sa.ForeignKey("airports.key", ondelete="CASCADE"), nullable=False),
    )
    op.create_index("ix_network_links_lookup", "network_links", ["category", "item_title"])

    # ─── link_parameters / link_parameter_values ───────────────────────
    op.create_table(
        "link_parameters",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("link_id", sa.String(36), sa.ForeignKey("network_links.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
    )
    op.create_table(
        "link_parameter_values",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "parameter_id", sa.String(36), sa.ForeignKey("link_parameters.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("text", sa.String(500), nullable=False),
    )

    # ─── airport_local_parameters / values ─────────────────────────────
    op.create_table(
        "airport_local_parameters",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("airport_key", sa.String(64), sa.ForeignKey("airports.key", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
    )
    op.create_table(
        "airport_local_parameter_values",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "parameter_id",
            sa.String(36),
            sa.ForeignKey("airport_local_parameters.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("text", sa.String(500), nullable=False),
    )

    # ─── activity_logs ──────────────────────────────────────────────────
    op.create_table(
        "activity_logs",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("action", sa.String(255), nullable=False),
        sa.Column("details", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("activity_logs")
    op.drop_table("airport_local_parameter_values")
    op.drop_table("airport_local_parameters")
    op.drop_table("link_parameter_values")
    op.drop_table("link_parameters")
    op.drop_table("network_links")
    op.drop_table("network_sub_parameters")
    op.drop_table("network_items")
    op.drop_table("airports")
    op.drop_table("users")
    for enum_name in ("roleenum", "networkcategoryenum", "itemstatusenum", "subparamstatusenum"):
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
