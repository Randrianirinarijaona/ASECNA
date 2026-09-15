"""link direction/type/circuit/ip/port/status + antananarivo origin

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── 1. Nouveaux champs sur network_links ──────────────────────────────
    op.add_column(
        "network_links",
        sa.Column(
            "direction",
            sa.Enum("incoming", "outgoing", "both", name="linkdirectionenum"),
            nullable=False,
            server_default="outgoing",
        ),
    )
    op.add_column("network_links", sa.Column("link_type", sa.String(100), nullable=True))
    op.add_column("network_links", sa.Column("circuit", sa.String(100), nullable=True))
    op.add_column("network_links", sa.Column("ip_address", sa.String(45), nullable=True))
    op.add_column("network_links", sa.Column("port", sa.String(10), nullable=True))
    op.add_column(
        "network_links",
        sa.Column(
            "status",
            sa.Enum("operational", "maintenance", "out_of_service", name="linkstatusenum"),
            nullable=False,
            server_default="operational",
        ),
    )

    # ─── 2. Migration des données existantes ───────────────────────────────
    # L'ancienne colonne `bidirectional` (booléenne) devient `direction`
    # ('both' si elle valait 1, 'outgoing' sinon — déjà la valeur par
    # défaut posée ci-dessus, donc rien à faire pour les False).
    op.execute("UPDATE network_links SET direction = 'both' WHERE bidirectional = 1")

    # Toute liaison existante qui ne partait pas d'Antananarivo est
    # désormais invalide au regard de la nouvelle règle métier. On ne peut
    # pas la "corriger" automatiquement sans risquer de fausser les
    # données ; on la supprime pour repartir sur un état cohérent (aucune
    # liaison n'était encore réellement exploitée en production à ce stade
    # du projet). Adapter/retirer cette ligne si des données réelles
    # existent déjà et doivent être conservées manuellement.
    op.execute("DELETE FROM network_links WHERE from_airport_key <> 'TNR'")

    op.drop_column("network_links", "bidirectional")


def downgrade() -> None:
    op.add_column(
        "network_links",
        sa.Column("bidirectional", sa.Boolean, nullable=False, server_default=sa.false()),
    )
    op.execute("UPDATE network_links SET bidirectional = 1 WHERE direction = 'both'")

    op.drop_column("network_links", "status")
    op.drop_column("network_links", "port")
    op.drop_column("network_links", "ip_address")
    op.drop_column("network_links", "circuit")
    op.drop_column("network_links", "link_type")
    op.drop_column("network_links", "direction")
