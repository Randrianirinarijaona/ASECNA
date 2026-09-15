"""
Script de seed : recrée les comptes de démo (admin/user/viewer) et les 4
aéroports initiaux de data/airportsData.ts (TNR, DIE, MJG, Fort Dauphin)
avec leurs items SFA/SMA/SRNA, marqués `in_local_network=True` (cf.
useAirportsData.ts frontend : localNetworkAirportKeys pré-rempli avec ces
4 aéroports).

Usage :
    cd backend
    python -m app.seed
"""
from app.database import SessionLocal, Base, engine
from app.models.user import User, RoleEnum
from app.models.airport import Airport
from app.models.network import NetworkItem
from app.models.link import NetworkLink, LinkDirectionEnum, LinkStatusEnum
from app.core.security import hash_password
from app.core.config import settings

ITEMS = [
    ("sfa", "AMHS/RSFTA", "Système de messagerie AFTN/AMHS",
     ["Serveur principal opérationnel", "Redondance active", "Taux de disponibilité : 99.8%"], None),
    ("sfa", "SMT", "Système de Messagerie Terminale", ["Version 2.3 installée"], None),
    ("sma", "VHF", "Communications VHF",
     ["Couverture 100% dans le TMA", "5 fréquences opérationnelles"], "operational"),
    ("sma", "HF", "Communications Haute Fréquence", ["Antennes en bon état"], "maintenance"),
    ("srna", "Réseau", "Réseau de transmission",
     ["Fibre optique principale", "Liaison satellite backup"], "operational"),
]

AIRPORTS = {
    "TNR": ("Ivato", "TNR", -18.8787, 47.5079, ITEMS),
    "DIE": ("Toamasina", "DIE", -18.1089697984752, 49.39269376622393, ITEMS),
    "MJG": ("Mahajanga", "MJG", -15.666954850137442, 46.35106480662277, ITEMS),
    "Fort Dauphin": (
        "Tolagnaro", "Fort Dauphin", -25.03644107410689, 46.95447113950406,
        [
            ("sfa", "AMHS/RSFTA", "Système de messagerie AFTN/AMHS",
             ["Serveur principal opérationnel", "Redondance active", "Taux de disponibilité : 99.8%"], None),
            ("sma", "VHF", "Communications VHF",
             ["Couverture 100% dans le TMA", "5 fréquences opérationnelles"], "operational"),
            ("srna", "Réseau", "Réseau de transmission",
             ["Fibre optique principale", "Liaison satellite backup"], "operational"),
        ],
    ),
}

DEMO_USERS = [
    ("admin", "123456", RoleEnum.admin, "admin@asecna.mg"),
    ("user", "123456", RoleEnum.technicien, "user@asecna.mg"),
    ("viewer", "123456", RoleEnum.user, "viewer@asecna.mg"),
]


def run():
    Base.metadata.create_all(bind=engine)  # dev rapide ; en prod préférer `alembic upgrade head`
    db = SessionLocal()
    try:
        for username, password, role, email in DEMO_USERS:
            if not db.query(User).filter(User.username == username).first():
                db.add(User(username=username, email=email, hashed_password=hash_password(password), role=role))

        for key, (name, iata, lat, lng, items) in AIRPORTS.items():
            if db.get(Airport, key):
                continue
            airport = Airport(
                key=key, name=name, iata=iata, lat=lat, lng=lng,
                is_technical_point=False, in_local_network=True,
            )
            db.add(airport)
            db.flush()
            for category, title, description, details, status in items:
                db.add(NetworkItem(
                    airport_key=key, category=category, title=title,
                    description=description, details=details, status=status,
                ))

        db.flush()

        # Exemple de liaison de démonstration (illustre les nouveaux champs
        # obligatoires ip_address/port), uniquement si TNR et DIE existent
        # tous les deux et qu'aucune liaison AMHS/RSFTA ne les relie déjà.
        tnr = db.get(Airport, settings.ANTANANARIVO_AIRPORT_KEY)
        die = db.get(Airport, "DIE")
        if tnr and die:
            existing = (
                db.query(NetworkLink)
                .filter(
                    NetworkLink.category == "sfa",
                    NetworkLink.item_title == "AMHS/RSFTA",
                    NetworkLink.from_airport_key == tnr.key,
                    NetworkLink.to_airport_key == die.key,
                )
                .first()
            )
            if not existing:
                db.add(NetworkLink(
                    category="sfa",
                    item_title="AMHS/RSFTA",
                    from_airport_key=tnr.key,
                    to_airport_key=die.key,
                    direction=LinkDirectionEnum.outgoing,
                    link_type="Fibre optique",
                    circuit="CKT-001",
                    ip_address="10.0.0.1",
                    port="8080",
                    status=LinkStatusEnum.operational,
                ))

        db.commit()
        print("Seed terminé avec succès.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
