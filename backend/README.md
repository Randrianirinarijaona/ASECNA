# ASECNA Network — Backend (FastAPI + MySQL)

## 1. Prérequis
- Python 3.11+
- WampServer démarré (MySQL sur `127.0.0.1:3306`)

## 2. Installation

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
cp .env.example .env
```

## 3. Créer la base de données

**Option A — Alembic (recommandé) :**
```bash
# Créez d'abord une base vide "asecna_network" dans phpMyAdmin
alembic upgrade head
python -m app.seed
```

**Option B — Script SQL brut (phpMyAdmin), pour une base neuve :**
Importez `sql/schema.sql` directement dans phpMyAdmin.

**Mise à jour d'une base existante (déjà sur la version précédente) :**
Exécutez dans l'ordre les scripts encore manquants dans `sql/` :
`migration_002_bidirectional_and_local_points.sql` puis
`migration_003_link_direction_fields_status.sql` — ou simplement
`alembic upgrade head`, qui détecte automatiquement la révision déjà
appliquée.

## 4. Lancer le serveur

```bash
uvicorn app.main:app --reload --port 8000
```

API : `http://localhost:8000` — Documentation Swagger : `http://localhost:8000/docs`

## 5. Comptes de démonstration

| Utilisateur | Mot de passe | Rôle        |
|-------------|--------------|-------------|
| admin       | 123456       | admin       |
| user        | 123456       | technicien  |
| viewer      | 123456       | user        |

## 6. Connecter le frontend

```
VITE_API_URL=http://localhost:8000
```

## 7. Règles métier à connaître

- Toute liaison (`NetworkLink`) doit obligatoirement partir de l'aéroport
  d'Antananarivo (`ANTANANARIVO_AIRPORT_KEY`, `TNR` par défaut, configurable
  via `.env`) — vérifié dans `crud/link.py::create_link`, retourne `400` sinon.
- `direction` remplace l'ancien `bidirectional` : `incoming` / `outgoing` / `both`.
- `ip_address` et `port` sont obligatoires à la création d'une liaison
  (`link_type` et `circuit` restent optionnels).
- Le statut d'une liaison (`operational` / `maintenance` / `out_of_service`)
  se modifie via `PATCH /links/{id}/status`, réservé aux administrateurs.

## 8. Générer une nouvelle migration après modification des modèles

```bash
alembic revision --autogenerate -m "description du changement"
alembic upgrade head
```
