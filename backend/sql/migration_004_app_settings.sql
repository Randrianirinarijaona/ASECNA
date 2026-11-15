-- ============================================================================
-- ASECNA Network — Migration SQL 004
-- Table des paramètres applicatifs modifiables (clé de sécurité Admin et code
-- de validation technicien, modifiables par un administrateur dans Settings).
--
-- Ajoute UNIQUEMENT une table : aucune donnée ni structure existante n'est
-- modifiée ou supprimée. À exécuter dans phpMyAdmin (onglet SQL) sur la base
-- `asecna_network`. Équivalent de `alembic upgrade 0004`.
-- Tant que la table est vide, les valeurs du fichier .env restent utilisées.
-- ============================================================================

USE asecna_network;

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key    VARCHAR(64)  PRIMARY KEY,
  setting_value  VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
