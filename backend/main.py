"""
=============================================================================
BACKEND ASECNA - MADAGASCAR TERMINALS
Fichier : main.py
Framework : FastAPI (Python)
Base de données : MySQL via WAMP Server
=============================================================================

POURQUOI FastAPI ?
FastAPI est un framework moderne et très rapide pour créer des APIs en Python.
Il gère automatiquement la validation des données, génère de la documentation
interactive (Swagger UI) et supporte nativement les opérations asynchrones.

ARCHITECTURE GÉNÉRALE :
  [Frontend React] <--> [FastAPI (port 8000)] <--> [MySQL via WAMP (port 3306)]

=============================================================================
"""

# ── IMPORTS ──────────────────────────────────────────────────────────────────

from fastapi import FastAPI, HTTPException, Depends  # Le cœur de FastAPI
from fastapi.middleware.cors import CORSMiddleware   # Pour autoriser les requêtes cross-origin (React → FastAPI)
from pydantic import BaseModel                       # Pour valider et typer les données reçues
from typing import Optional                          # Pour les champs facultatifs
#import mysql.connector                               # Le connecteur officiel MySQL pour Python
import bcrypt                                        # Pour hacher (chiffrer) les mots de passe
import secrets                                       # Pour générer des tokens de session sécurisés
import os                                            # Pour lire des variables d'environnement

# ── CONFIGURATION ─────────────────────────────────────────────────────────────

"""
POURQUOI des variables d'environnement ?
Au lieu d'écrire "password=MonMotDePasse" directement dans le code (ce qui
serait visible si le code est partagé sur GitHub par exemple), on utilise des
variables d'environnement. C'est une bonne pratique de sécurité fondamentale.

En production, ces variables sont définies sur le serveur.
En développement, on peut utiliser un fichier .env avec la librairie python-dotenv.
"""

DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),       # L'hôte MySQL (WAMP tourne en local)
    "port":     int(os.getenv("DB_PORT", 3306)),         # Port MySQL par défaut
    "user":     os.getenv("DB_USER", "root"),            # Utilisateur MySQL (root par défaut sur WAMP)
    "password": os.getenv("DB_PASSWORD", ""),            # Mot de passe MySQL (vide par défaut sur WAMP)
    "database": os.getenv("DB_NAME", "asecna_db"),       # Nom de notre base de données
}

# Clé secrète ASECNA : seuls les administrateurs autorisés connaissent ce code.
# En production, cette valeur doit ABSOLUMENT venir d'une variable d'environnement.
ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "ASECNA2025SECRET")

# ── INITIALISATION DE L'APPLICATION ──────────────────────────────────────────

"""
POURQUOI créer une instance FastAPI ?
C'est l'objet central de notre application. Il gère toutes les routes,
les middlewares et la configuration de l'API.
"""
app = FastAPI(
    title="ASECNA API",
    description="Backend pour la gestion des utilisateurs - Madagascar Terminals",
    version="1.0.0",
)

# ── CONFIGURATION CORS ────────────────────────────────────────────────────────

"""
POURQUOI le CORS (Cross-Origin Resource Sharing) ?
Par défaut, les navigateurs bloquent les requêtes HTTP vers un domaine/port
différent de celui de la page web. Notre React tourne sur http://localhost:5173
et notre API sur http://localhost:8000 → ce sont des origines DIFFÉRENTES.

Sans ce middleware, toutes les requêtes de React vers FastAPI seraient bloquées
par le navigateur avec une erreur "CORS policy: No 'Access-Control-Allow-Origin'".

allow_origins : liste des origines autorisées à interroger l'API.
allow_methods : méthodes HTTP autorisées (GET, POST, etc.).
allow_headers : en-têtes HTTP autorisés (Content-Type est nécessaire pour JSON).
"""
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Ports courants de React/Vite
    allow_credentials=True,   # Autorise l'envoi de cookies (utile pour les sessions)
    allow_methods=["*"],      # Autorise toutes les méthodes HTTP
    allow_headers=["*"],      # Autorise tous les en-têtes
)

# ── GESTION DE LA BASE DE DONNÉES ─────────────────────────────────────────────

def get_db_connection():
    """
    POURQUOI une fonction dédiée pour la connexion ?
    On centralise la logique de connexion en un seul endroit. Si on change
    de base de données ou de configuration, on ne modifie qu'ici.

    mysql.connector.connect() ouvre une connexion TCP vers MySQL.
    Elle retourne un objet "connexion" qu'on utilise pour exécuter des requêtes.

    IMPORTANT : chaque appel crée une NOUVELLE connexion. Pour les applications
    à fort trafic, on utiliserait un "pool de connexions" pour les réutiliser.
    """
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except mysql.connector.Error as e:
        # Si la connexion échoue (MySQL éteint, mauvais mot de passe, etc.)
        raise HTTPException(
            status_code=503,  # 503 = Service Unavailable
            detail=f"Impossible de contacter la base de données : {str(e)}"
        )


def init_database():
    """
    POURQUOI init_database() ?
    Cette fonction crée les tables si elles n'existent pas encore.
    Elle est appelée au démarrage de l'application (voir l'événement "startup").
    C'est une forme simple de migration de base de données.

    Dans un projet professionnel, on utiliserait un outil dédié comme Alembic
    pour gérer les migrations (modifications de structure de la base).
    """
    conn = get_db_connection()
    cursor = conn.cursor()  # Le curseur est l'objet qui exécute les requêtes SQL

    # ── TABLE : users ──────────────────────────────────────────────────────────
    """
    STRUCTURE DE LA TABLE users :
    ┌─────────────────┬──────────────────┬─────────────────────────────────────┐
    │ Colonne         │ Type             │ Rôle                                │
    ├─────────────────┼──────────────────┼─────────────────────────────────────┤
    │ id              │ INT AUTO_INC     │ Identifiant unique (clé primaire)   │
    │ username        │ VARCHAR(50)      │ Nom d'utilisateur (unique)          │
    │ password_hash   │ VARCHAR(255)     │ Mot de passe haché (jamais en clair)│
    │ role            │ ENUM             │ Rôle : 'client' ou 'admin'          │
    │ created_at      │ DATETIME         │ Date de création du compte          │
    └─────────────────┴──────────────────┴─────────────────────────────────────┘

    POURQUOI stocker un HASH et pas le mot de passe en clair ?
    Si la base de données est compromise (attaque, fuite de données), les mots
    de passe ne sont pas lisibles. bcrypt transforme "monMotDePasse" en une
    chaîne comme "$2b$12$abc..." qui est irréversible par conception.

    POURQUOI ENUM pour role ?
    MySQL n'acceptera que les valeurs 'client' ou 'admin'. C'est une contrainte
    d'intégrité au niveau de la base de données elle-même.
    """
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id           INT AUTO_INCREMENT PRIMARY KEY,
            username     VARCHAR(50)  NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role         ENUM('client', 'admin') NOT NULL DEFAULT 'client',
            created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)
    # ENGINE=InnoDB : moteur de stockage MySQL qui supporte les transactions et les clés étrangères
    # CHARSET=utf8mb4 : supporte tous les caractères Unicode, y compris les emojis

    # ── TABLE : sessions ────────────────────────────────────────────────────────
    """
    POURQUOI une table sessions ?
    Après la connexion, on génère un "token" unique pour l'utilisateur.
    Ce token est envoyé au frontend et stocké (localStorage, cookie).
    À chaque requête suivante, le frontend envoie ce token pour prouver
    son identité sans retaper son mot de passe → c'est l'authentification par session.

    STRUCTURE :
    ┌──────────────┬──────────────┬──────────────────────────────────────────┐
    │ Colonne      │ Type         │ Rôle                                     │
    ├──────────────┼──────────────┼──────────────────────────────────────────┤
    │ id           │ INT          │ Identifiant de la session                │
    │ user_id      │ INT          │ Référence vers l'utilisateur (FK)        │
    │ token        │ VARCHAR(64)  │ Token aléatoire unique (64 caractères)   │
    │ created_at   │ DATETIME     │ Date de création                         │
    │ expires_at   │ DATETIME     │ Date d'expiration (sécurité)             │
    └──────────────┴──────────────┴──────────────────────────────────────────┘

    FOREIGN KEY user_id → users(id) ON DELETE CASCADE :
    Si un utilisateur est supprimé, toutes ses sessions sont automatiquement
    supprimées aussi. C'est l'intégrité référentielle.
    """
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            user_id    INT         NOT NULL,
            token      VARCHAR(64) NOT NULL UNIQUE,
            created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME    NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """)

    conn.commit()   # Valider les changements (CREATE TABLE est une DDL mais commit est bonne pratique)
    cursor.close()  # Libérer le curseur
    conn.close()    # Fermer la connexion (libérer la ressource réseau)

    print("✅ Tables initialisées avec succès.")


# ── ÉVÉNEMENT DE DÉMARRAGE ────────────────────────────────────────────────────

"""
POURQUOI @app.on_event("startup") ?
Ce décorateur indique à FastAPI d'exécuter cette fonction UNE SEULE FOIS
quand le serveur démarre. C'est l'endroit idéal pour :
  - Initialiser la base de données
  - Charger des configurations
  - Vérifier que les services dépendants sont accessibles

Note : on_event est la méthode "legacy", les versions récentes de FastAPI
recommandent @app.lifespan, mais on_event reste largement utilisé et compris.
"""
@app.on_event("startup")
async def startup_event():
    print("🚀 Démarrage du serveur ASECNA...")
    init_database()


# ── MODÈLES PYDANTIC (SCHÉMAS DE DONNÉES) ─────────────────────────────────────

"""
POURQUOI Pydantic ?
Pydantic valide automatiquement les données JSON reçues par l'API.
Si le frontend envoie { "username": 123 } au lieu de { "username": "john" },
FastAPI retournera automatiquement une erreur 422 (Unprocessable Entity)
avec un message clair sur le problème.

C'est comme un "contrat" entre le frontend et le backend :
chaque champ a un type précis et des contraintes.
"""

class RegisterRequest(BaseModel):
    """
    Données attendues lors de l'inscription.
    Correspondent exactement aux champs envoyés par le formulaire React.
    """
    username:  str            # Nom d'utilisateur (obligatoire)
    password:  str            # Mot de passe en clair (sera haché avant stockage)
    role:      str = "client" # Rôle par défaut : client
    admin_key: Optional[str] = None  # Clé admin (seulement si role == 'admin')


class LoginRequest(BaseModel):
    """
    Données attendues lors de la connexion.
    Seulement l'identifiant et le mot de passe.
    """
    username: str
    password: str


class SessionCheckRequest(BaseModel):
    """
    Données pour vérifier si une session est encore valide.
    Le frontend envoie le token qu'il a stocké.
    """
    token: str


# ── UTILITAIRES ───────────────────────────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """
    POURQUOI bcrypt et pas MD5/SHA1 ?
    bcrypt est un algorithme de hachage LENT par conception. Cette lenteur
    rend les attaques par force brute (tester des milliers de mots de passe
    par seconde) beaucoup plus difficiles.

    - MD5 : 10 milliards de hachages/seconde possible avec du matériel spécialisé
    - bcrypt (cost=12) : environ 1 000 hachages/seconde → 10 millions de fois plus lent

    bcrypt ajoute aussi automatiquement un "sel" (données aléatoires) unique
    à chaque hachage. Deux utilisateurs avec le même mot de passe auront des
    hachages différents, empêchant les attaques par "table arc-en-ciel".

    encode('utf-8') : bcrypt travaille sur des bytes, pas des strings Python.
    """
    salt = bcrypt.gensalt(rounds=12)  # rounds=12 = facteur de coût (plus élevé = plus lent = plus sûr)
    hashed = bcrypt.hashpw(plain_password.encode('utf-8'), salt)
    return hashed.decode('utf-8')  # Convertir bytes → string pour stocker en DB


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compare un mot de passe en clair avec son hachage stocké en DB.
    bcrypt.checkpw() recrée le hachage avec le même sel et compare.
    Retourne True si les mots de passe correspondent, False sinon.

    IMPORTANT : on ne "déchiffre" jamais le hash. On hache le mot de passe
    fourni et on compare les deux hachages. C'est toute la beauté du concept.
    """
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def generate_session_token() -> str:
    """
    Génère un token de session aléatoire et sécurisé.

    secrets.token_hex(32) génère 32 octets aléatoires en hexadécimal
    → 64 caractères. La probabilité de collision est astronomiquement faible
    (1 chance sur 2^256 ≈ 10^77).

    POURQUOI secrets et pas random ?
    random est prévisible (pseudo-aléatoire). secrets utilise les sources
    d'entropie du système d'exploitation, donc il est cryptographiquement sûr.
    """
    return secrets.token_hex(32)


# ── ROUTES DE L'API ───────────────────────────────────────────────────────────

# ────────────────────────────────────────────────────────────────────────────
# ROUTE : POST /register — Inscription d'un nouvel utilisateur
# ────────────────────────────────────────────────────────────────────────────
@app.post("/register")
async def register(data: RegisterRequest):
    """
    FLUX D'INSCRIPTION :
    1. Valider le rôle (client ou admin)
    2. Si admin → vérifier la clé secrète
    3. Vérifier que le nom d'utilisateur n'existe pas déjà
    4. Hacher le mot de passe
    5. Insérer le nouvel utilisateur en base de données
    6. Retourner un message de succès

    Le décorateur @app.post("/register") indique que cette fonction répond
    aux requêtes HTTP POST sur l'URL /register.
    """

    # ── Étape 1 : Validation du rôle ──────────────────────────────────────────
    if data.role not in ("client", "admin"):
        # HTTPException interrompt la fonction et retourne une réponse d'erreur JSON.
        # status_code=400 : "Bad Request" → les données envoyées sont incorrectes.
        raise HTTPException(status_code=400, detail="Rôle invalide. Choisissez 'client' ou 'admin'.")

    # ── Étape 2 : Vérification de la clé admin ────────────────────────────────
    if data.role == "admin":
        if not data.admin_key or data.admin_key != ADMIN_SECRET_KEY:
            # 403 Forbidden : l'utilisateur n'a pas le droit de faire cette action
            raise HTTPException(status_code=403, detail="Clé administrateur incorrecte.")

    # ── Étape 3 : Vérifier l'unicité du nom d'utilisateur ────────────────────
    conn   = get_db_connection()
    cursor = conn.cursor(dictionary=True)  # dictionary=True → les résultats sont des dict Python

    """
    POURQUOI les paramètres (%s) et pas la concaténation de strings ?
    JAMAIS faire : f"SELECT * FROM users WHERE username = '{data.username}'"
    
    C'est une faille de sécurité critique appelée "injection SQL".
    Un utilisateur malveillant pourrait envoyer : username = "'; DROP TABLE users; --"
    et détruire la base de données.

    Avec %s et les paramètres séparés, mysql.connector échappe automatiquement
    les caractères spéciaux → le SQL est sûr.
    """
    cursor.execute(
        "SELECT id FROM users WHERE username = %s",
        (data.username,)  # Tuple avec un seul élément → la virgule est obligatoire
    )
    existing_user = cursor.fetchone()  # Récupère la première (et unique) ligne du résultat

    if existing_user:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=409, detail="Ce nom d'utilisateur est déjà pris.")
        # 409 Conflict : la ressource qu'on veut créer existe déjà

    # ── Étape 4 : Hacher le mot de passe ─────────────────────────────────────
    """
    On ne stocke JAMAIS le mot de passe en clair en base de données.
    Si quelqu'un accède à la DB, il ne verra que des hash impossibles à inverser.
    """
    hashed_pwd = hash_password(data.password)

    # ── Étape 5 : Insérer le nouvel utilisateur ───────────────────────────────
    cursor.execute(
        """
        INSERT INTO users (username, password_hash, role)
        VALUES (%s, %s, %s)
        """,
        (data.username, hashed_pwd, data.role)
    )
    conn.commit()  # IMPORTANT : sans commit(), l'insertion n'est pas sauvegardée !

    cursor.close()
    conn.close()

    # ── Étape 6 : Réponse de succès ───────────────────────────────────────────
    return {
        "message": "Inscription réussie !",
        "username": data.username,
        "role": data.role,
    }


# ────────────────────────────────────────────────────────────────────────────
# ROUTE : POST /login — Connexion d'un utilisateur existant
# ────────────────────────────────────────────────────────────────────────────
@app.post("/login")
async def login(data: LoginRequest):
    """
    FLUX DE CONNEXION :
    1. Chercher l'utilisateur par son nom d'utilisateur
    2. Vérifier le mot de passe
    3. Créer une session (token) en base de données
    4. Retourner le token et les informations de l'utilisateur au frontend

    POURQUOI ne pas chercher par username ET password directement ?
    Si on faisait SELECT * WHERE username=X AND password=Y, on comparerait
    le mot de passe en clair à un hash → ça ne marcherait jamais.
    On récupère d'abord le hash, puis on le compare avec bcrypt.
    """

    # ── Étape 1 : Chercher l'utilisateur ──────────────────────────────────────
    conn   = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT id, username, password_hash, role FROM users WHERE username = %s",
        (data.username,)
    )
    user = cursor.fetchone()

    # ── Étape 2 : Vérifications ───────────────────────────────────────────────
    if not user:
        cursor.close()
        conn.close()
        """
        POURQUOI le même message d'erreur pour "utilisateur inexistant" et
        "mauvais mot de passe" ?
        Si on disait "utilisateur introuvable" vs "mot de passe incorrect",
        un attaquant pourrait deviner quels noms d'utilisateur existent.
        Un message générique protège contre l'énumération d'utilisateurs.
        """
        raise HTTPException(status_code=401, detail="Identifiant ou mot de passe incorrect.")
        # 401 Unauthorized : authentification requise ou échouée

    if not verify_password(data.password, user["password_hash"]):
        cursor.close()
        conn.close()
        raise HTTPException(status_code=401, detail="Identifiant ou mot de passe incorrect.")

    # ── Étape 3 : Créer une session ───────────────────────────────────────────
    token = generate_session_token()

    """
    POURQUOI une durée d'expiration ?
    Si un token est volé (attaque man-in-the-middle, fuite de logs...), il ne
    sera utilisable que pendant une durée limitée. Ici, 24 heures est un bon
    compromis entre sécurité et confort utilisateur.

    DATE_ADD(NOW(), INTERVAL 24 HOUR) est du SQL MySQL pur.
    On laisse MySQL calculer la date d'expiration pour éviter les problèmes
    de fuseau horaire entre Python et MySQL.
    """
    cursor.execute(
        """
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (%s, %s, DATE_ADD(NOW(), INTERVAL 24 HOUR))
        """,
        (user["id"], token)
    )
    conn.commit()

    cursor.close()
    conn.close()

    # ── Étape 4 : Réponse au frontend ─────────────────────────────────────────
    """
    Le frontend reçoit ces données et peut :
    - Stocker le token dans localStorage pour les futures requêtes
    - Afficher le nom d'utilisateur dans l'interface
    - Adapter l'UI selon le rôle (admin vs client)
    """
    return {
        "message": "Connexion réussie",
        "username": user["username"],
        "role":     user["role"],
        "token":    token,
    }


# ────────────────────────────────────────────────────────────────────────────
# ROUTE : POST /verify-session — Vérifier la validité d'un token
# ────────────────────────────────────────────────────────────────────────────
@app.post("/verify-session")
async def verify_session(data: SessionCheckRequest):
    """
    POURQUOI cette route ?
    Quand l'utilisateur revient sur le site après avoir fermé l'onglet,
    le frontend récupère le token du localStorage et demande au backend
    si ce token est encore valide. Si oui, l'utilisateur est directement
    connecté sans retaper son mot de passe.

    On vérifie simultanément :
    - Que le token existe en base de données
    - Qu'il n'est pas expiré (expires_at > NOW())
    - On récupère les infos de l'utilisateur associé (JOIN)
    """
    conn   = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    """
    JOIN SQL :
    La table sessions contient user_id (l'ID de l'utilisateur).
    On "joint" avec la table users pour récupérer username et role
    en une seule requête, plutôt que de faire deux requêtes séparées.

    s.expires_at > NOW() : filtre les sessions expirées côté SQL,
    plus efficace que de récupérer tout et filtrer en Python.
    """
    cursor.execute(
        """
        SELECT u.username, u.role, s.expires_at
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = %s AND s.expires_at > NOW()
        """,
        (data.token,)
    )
    session = cursor.fetchone()

    cursor.close()
    conn.close()

    if not session:
        raise HTTPException(status_code=401, detail="Session invalide ou expirée.")

    return {
        "valid":    True,
        "username": session["username"],
        "role":     session["role"],
    }


# ────────────────────────────────────────────────────────────────────────────
# ROUTE : POST /logout — Déconnexion (suppression du token)
# ────────────────────────────────────────────────────────────────────────────
@app.post("/logout")
async def logout(data: SessionCheckRequest):
    """
    La déconnexion consiste simplement à supprimer le token de la base de données.
    Même si le frontend possède encore le token, il sera invalide côté serveur.

    C'est la grande différence avec les JWT (JSON Web Tokens) qui ne peuvent
    pas être "révoqués" facilement → les sessions en DB offrent ce contrôle.
    """
    conn   = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM sessions WHERE token = %s", (data.token,))
    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Déconnexion réussie."}


# ────────────────────────────────────────────────────────────────────────────
# ROUTE : GET / — Vérification que l'API est en ligne (health check)
# ────────────────────────────────────────────────────────────────────────────
@app.get("/")
async def health_check():
    """
    Route simple pour vérifier que le serveur tourne.
    Utile pour les outils de monitoring et pour les développeurs.
    """
    return {"status": "ok", "service": "ASECNA API", "version": "1.0.0"}
