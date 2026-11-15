"""app_settings : clés d'inscription modifiables par l'administrateur

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-25

Ajoute uniquement une nouvelle table ; aucune table ni colonne existante
n'est modifiée ou supprimée. À appliquer avec :
    alembic upgrade 0004
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "app_settings",
        sa.Column("setting_key", sa.String(64), primary_key=True),
        sa.Column("setting_value", sa.String(255), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("app_settings")
