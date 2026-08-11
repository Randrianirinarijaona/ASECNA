# ASECNA Network — Backend (FastAPI + MySQL)

## 1. Prérequis
- Python 3.11+
- WampServer démarré (MySQL sur `127.0.0.1:3306`)

## 2. Installation

```bash
cd backend
python -m venv venv
# Windows :
venv\Scripts\activate
# macOS/Linux :
source venv/bin/activate ou venv\Scripts\Activate

pip install -r requirements.txt
cp .env.example .env   # puis ajustez DB_PASSWORD / SECRET_KEY si besoin
```

## 3. Créer la base de données

Deux options équivalentes :

**Option A — Alembic (recommandé, gère les migrations futures) :**
```bash
# Crée d'abord une base vide dans phpMyAdmin : "asecna_network"
alembic upgrade head
python -m app.seed        # comptes de démo + 4 aéroports initiaux
```

**Option B — Script SQL brut (phpMyAdmin) :**
Importez `sql/schema.sql` directement dans phpMyAdmin (onglet "Importer").
Remplacez ensuite les hash de mot de passe par ceux générés par
`python -m app.seed`, ou lancez le seed après import (il ignore les lignes
déjà présentes grâce aux `INSERT IGNORE` / vérifications d'existence).

## 4. Lancer le serveur

```bash
uvicorn app.main:app --reload --port 8000
```

L'API est disponible sur `http://localhost:8000`, documentation interactive
Swagger sur `http://localhost:8000/docs`.

## 5. Comptes de démonstration (créés par le seed)

| Utilisateur | Mot de passe | Rôle        |
|-------------|--------------|-------------|
| admin       | 123456       | admin       |
| user        | 123456       | technicien  |
| viewer      | 123456       | user        |

## 6. Connecter le frontend

Dans le frontend, créez un fichier `.env` avec :
```
VITE_API_URL=http://localhost:8000
```
(déjà lu par `services/api.service.ts` via `import.meta.env.VITE_API_URL`).

## 7. Générer une nouvelle migration après modification des modèles

```bash
alembic revision --autogenerate -m "description du changement"
alembic upgrade head
```
