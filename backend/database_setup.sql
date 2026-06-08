-- =============================================================================
-- SCRIPT SQL D'INITIALISATION — ASECNA Madagascar Terminals
-- À exécuter dans phpMyAdmin (WAMP) ou en ligne de commande MySQL
-- =============================================================================

-- ── ÉTAPE 1 : Créer la base de données ───────────────────────────────────────
--
-- POURQUOI IF NOT EXISTS ?
-- Si on relance ce script par accident, MySQL ne plantera pas en essayant
-- de créer une DB qui existe déjà. C'est une pratique d'idempotence.
--
-- CHARACTER SET utf8mb4 : Supporte TOUS les caractères Unicode (émojis inclus).
-- COLLATE utf8mb4_unicode_ci : Règles de comparaison/tri (ci = case insensitive)
-- → "Admin" == "admin" dans les comparaisons. Idéal pour les noms d'utilisateur.

CREATE DATABASE IF NOT EXISTS asecna_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Sélectionner la base pour les instructions suivantes
USE asecna_db;

-- ── ÉTAPE 2 : Table des utilisateurs ──────────────────────────────────────────
--
-- C'est la table centrale de notre système d'authentification.
-- Chaque ligne = un compte utilisateur.

CREATE TABLE IF NOT EXISTS users (
    -- Clé primaire auto-incrémentée
    -- INT : entier 32 bits → jusqu'à 2 147 483 647 utilisateurs
    -- AUTO_INCREMENT : MySQL attribue automatiquement 1, 2, 3...
    -- PRIMARY KEY : index unique, jamais NULL, identifie de façon unique chaque ligne
    id            INT AUTO_INCREMENT PRIMARY KEY,

    -- Nom d'utilisateur : 50 caractères max, obligatoire, et UNIQUE
    -- UNIQUE crée automatiquement un index → recherche très rapide
    -- et garantit qu'on ne peut pas avoir deux fois le même username
    username      VARCHAR(50)  NOT NULL UNIQUE,

    -- Hash bcrypt : toujours 60 caractères pour bcrypt, mais VARCHAR(255)
    -- laisse de la marge si on change d'algorithme à l'avenir
    -- On ne stocke JAMAIS le mot de passe en clair ici
    password_hash VARCHAR(255) NOT NULL,

    -- ENUM : MySQL n'accepte QUE les valeurs listées
    -- Toute tentative d'insérer 'superadmin' ou 'guest' sera rejetée par MySQL
    -- DEFAULT 'client' : si le champ n'est pas fourni, il vaut 'client'
    role          ENUM('client', 'admin') NOT NULL DEFAULT 'client',

    -- Timestamp de création, automatiquement rempli par MySQL
    -- CURRENT_TIMESTAMP = datetime actuelle au moment de l'insertion
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commentaire descriptif sur la table (visible dans phpMyAdmin)
ALTER TABLE users COMMENT = 'Comptes utilisateurs du système ASECNA';


-- ── ÉTAPE 3 : Table des sessions ──────────────────────────────────────────────
--
-- Stocke les tokens de connexion actifs.
-- Chaque connexion réussie génère une nouvelle ligne ici.
-- La déconnexion supprime cette ligne.

CREATE TABLE IF NOT EXISTS sessions (
    id         INT AUTO_INCREMENT PRIMARY KEY,

    -- Référence vers l'utilisateur connecté
    -- NOT NULL : une session doit toujours appartenir à quelqu'un
    user_id    INT         NOT NULL,

    -- Le token : 64 caractères hex générés par Python secrets.token_hex(32)
    -- UNIQUE : deux sessions ne peuvent pas avoir le même token
    token      VARCHAR(64) NOT NULL UNIQUE,

    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Date/heure à laquelle le token expire
    -- Défini à NOW() + 24h par Python lors de l'insertion
    expires_at DATETIME    NOT NULL,

    -- ── CLÉ ÉTRANGÈRE ─────────────────────────────────────────────────────────
    -- FOREIGN KEY : user_id doit correspondre à un id existant dans users
    -- ON DELETE CASCADE : si l'utilisateur est supprimé, ses sessions le sont aussi
    -- Cela maintient la cohérence des données (pas de sessions "orphelines")
    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE sessions COMMENT = 'Tokens de session actifs des utilisateurs connectés';


-- ── ÉTAPE 4 : Index de performance ────────────────────────────────────────────
--
-- POURQUOI des index supplémentaires ?
-- MySQL scanne toute la table pour trouver une valeur sans index (O(n)).
-- Avec un index, la recherche est en O(log n) → beaucoup plus rapide.
--
-- On ajoute des index sur les colonnes qu'on recherche souvent :

-- Recherche de sessions par token (route /verify-session et /logout)
-- Note : UNIQUE crée déjà un index sur token, donc pas besoin d'en rajouter un.

-- Recherche des sessions expirées (nettoyage périodique)
CREATE INDEX IF NOT EXISTS idx_sessions_expires
    ON sessions (expires_at);

-- Recherche des sessions d'un utilisateur spécifique
CREATE INDEX IF NOT EXISTS idx_sessions_user_id
    ON sessions (user_id);


-- ── ÉTAPE 5 : Données de test ─────────────────────────────────────────────────
--
-- Hash bcrypt de "password123" (généré avec bcrypt.hashpw et rounds=12)
-- NE PAS utiliser ces comptes en production !
-- Supprimez ce bloc ou changez les mots de passe avant de déployer.
--
-- Pour générer votre propre hash, exécutez en Python :
--   import bcrypt
--   print(bcrypt.hashpw(b"VotreMotDePasse", bcrypt.gensalt(12)).decode())

INSERT IGNORE INTO users (username, password_hash, role) VALUES
(
    'admin_test',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lfZpMB1MDNvJxQe6G',
    'admin'
),
(
    'client_test',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lfZpMB1MDNvJxQe6G',
    'client'
);
-- INSERT IGNORE : si les lignes existent déjà (même username), on ignore l'erreur


-- ── VÉRIFICATION ─────────────────────────────────────────────────────────────
-- Exécutez ces requêtes pour vérifier que tout est en place :

-- SHOW TABLES;
-- DESCRIBE users;
-- DESCRIBE sessions;
-- SELECT id, username, role, created_at FROM users;
