-- ============================================================================
-- ASECNA Network — Migration SQL 002
-- Ajoute : liaisons bidirectionnelles + points techniques locaux
-- (module "Réseau local").
--
-- À exécuter dans phpMyAdmin (onglet SQL) sur la base `asecna_network`
-- existante. Équivalent de `alembic upgrade head` (revision 0002) pour ceux
-- qui gèrent leur base sans Alembic.
-- ============================================================================

USE asecna_network;

-- ─── 1. Liaisons bidirectionnelles (LinkManagerModal.tsx) ────────────────
ALTER TABLE network_links
  ADD COLUMN bidirectional TINYINT(1) NOT NULL DEFAULT 0;

-- ─── 2. Points techniques locaux (nouvelle entité) ───────────────────────
CREATE TABLE IF NOT EXISTS local_technical_points (
  id                  VARCHAR(36)  PRIMARY KEY,
  parent_airport_key  VARCHAR(64)  NOT NULL,
  name                VARCHAR(150) NOT NULL,
  lat                 DOUBLE       NOT NULL,
  lng                 DOUBLE       NOT NULL,
  CONSTRAINT fk_local_points_airport
    FOREIGN KEY (parent_airport_key) REFERENCES airports(`key`) ON DELETE CASCADE,
  INDEX ix_local_technical_points_parent (parent_airport_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS local_technical_point_parameters (
  id        VARCHAR(36)  PRIMARY KEY,
  point_id  VARCHAR(36)  NOT NULL,
  name      VARCHAR(150) NOT NULL,
  CONSTRAINT fk_local_point_parameters_point
    FOREIGN KEY (point_id) REFERENCES local_technical_points(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS local_technical_point_parameter_values (
  id            VARCHAR(36)  PRIMARY KEY,
  parameter_id  VARCHAR(36)  NOT NULL,
  name          VARCHAR(150) NOT NULL,
  text          VARCHAR(500) NOT NULL,
  CONSTRAINT fk_local_point_parameter_values_parameter
    FOREIGN KEY (parameter_id) REFERENCES local_technical_point_parameters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── 3. Les 4 aéroports existants rejoignent le Réseau local ─────────────
-- Aligne les données déjà en base sur le nouveau comportement par défaut
-- du frontend (localNetworkAirportKeys pré-rempli avec ces 4 aéroports).
UPDATE airports
  SET in_local_network = 1
  WHERE `key` IN ('TNR', 'DIE', 'MJG', 'Fort Dauphin');
