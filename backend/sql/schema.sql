-- ============================================================================
-- ASECNA Network — Script de création de la base MySQL (WampServer)
-- Alternative à `alembic upgrade head` : à exécuter directement dans
-- phpMyAdmin ou la console MySQL si vous préférez ne pas utiliser Alembic.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS asecna_network
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE asecna_network;

-- ─── users ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               VARCHAR(36)  PRIMARY KEY,
  username         VARCHAR(50)  NOT NULL UNIQUE,
  email            VARCHAR(255) UNIQUE,
  hashed_password  VARCHAR(255) NOT NULL,
  role             ENUM('admin','technicien','user') NOT NULL DEFAULT 'user',
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  last_login       DATETIME     NULL,
  INDEX ix_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── airports (aéroports réels + points techniques) ──────────────────────
CREATE TABLE IF NOT EXISTS airports (
  `key`               VARCHAR(64)  PRIMARY KEY,
  name                VARCHAR(150) NOT NULL,
  iata                VARCHAR(20)  NOT NULL DEFAULT '',
  lat                 DOUBLE       NOT NULL,
  lng                 DOUBLE       NOT NULL,
  is_technical_point  TINYINT(1)   NOT NULL DEFAULT 0,
  in_local_network    TINYINT(1)   NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── network_items (sections sfa / sma / srna d'un aéroport) ────────────
CREATE TABLE IF NOT EXISTS network_items (
  id           VARCHAR(36)  PRIMARY KEY,
  airport_key  VARCHAR(64)  NOT NULL,
  category     ENUM('sfa','sma','srna') NOT NULL,
  title        VARCHAR(150) NOT NULL,
  description  TEXT NULL,
  details      JSON NULL,
  status       ENUM('operational','maintenance','planned') NULL,
  CONSTRAINT fk_network_items_airport
    FOREIGN KEY (airport_key) REFERENCES airports(`key`) ON DELETE CASCADE,
  UNIQUE KEY uq_network_items_airport_category_title (airport_key, category, title),
  INDEX ix_network_items_airport_category (airport_key, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── network_sub_parameters ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS network_sub_parameters (
  id           VARCHAR(36)  PRIMARY KEY,
  item_id      VARCHAR(36)  NOT NULL,
  title        VARCHAR(150) NOT NULL,
  value        VARCHAR(255) NOT NULL,
  status       ENUM('operational','maintenance') NOT NULL DEFAULT 'operational',
  description  TEXT NULL,
  CONSTRAINT fk_sub_parameters_item
    FOREIGN KEY (item_id) REFERENCES network_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── network_links (liaisons / flèches entre aéroports) ──────────────────
CREATE TABLE IF NOT EXISTS network_links (
  id                VARCHAR(36)  PRIMARY KEY,
  category          ENUM('sfa','sma','srna') NOT NULL,
  item_title        VARCHAR(150) NOT NULL,
  from_airport_key  VARCHAR(64)  NOT NULL,
  to_airport_key    VARCHAR(64)  NOT NULL,
  -- Liaison affichée dans les deux sens (LinkManagerModal.tsx) ou à sens
  -- unique (comportement historique, valeur par défaut).
  bidirectional     TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_links_from_airport
    FOREIGN KEY (from_airport_key) REFERENCES airports(`key`) ON DELETE CASCADE,
  CONSTRAINT fk_links_to_airport
    FOREIGN KEY (to_airport_key) REFERENCES airports(`key`) ON DELETE CASCADE,
  INDEX ix_network_links_lookup (category, item_title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── link_parameters / link_parameter_values (LinkDetailModal) ─────────
CREATE TABLE IF NOT EXISTS link_parameters (
  id       VARCHAR(36)  PRIMARY KEY,
  link_id  VARCHAR(36)  NOT NULL,
  name     VARCHAR(150) NOT NULL,
  CONSTRAINT fk_link_parameters_link
    FOREIGN KEY (link_id) REFERENCES network_links(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS link_parameter_values (
  id            VARCHAR(36)  PRIMARY KEY,
  parameter_id  VARCHAR(36)  NOT NULL,
  name          VARCHAR(150) NOT NULL,
  text          VARCHAR(500) NOT NULL,
  CONSTRAINT fk_link_parameter_values_parameter
    FOREIGN KEY (parameter_id) REFERENCES link_parameters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── airport_local_parameters / values (module "Réseau local") ─────────
CREATE TABLE IF NOT EXISTS airport_local_parameters (
  id           VARCHAR(36)  PRIMARY KEY,
  airport_key  VARCHAR(64)  NOT NULL,
  name         VARCHAR(150) NOT NULL,
  CONSTRAINT fk_local_parameters_airport
    FOREIGN KEY (airport_key) REFERENCES airports(`key`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS airport_local_parameter_values (
  id            VARCHAR(36)  PRIMARY KEY,
  parameter_id  VARCHAR(36)  NOT NULL,
  name          VARCHAR(150) NOT NULL,
  text          VARCHAR(500) NOT NULL,
  CONSTRAINT fk_local_parameter_values_parameter
    FOREIGN KEY (parameter_id) REFERENCES airport_local_parameters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── local_technical_points (module "Réseau local" — points placés à main
-- levée sur la carte zoomée d'un aéroport) ────────────────────────────────
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

-- ─── activity_logs (panneau Admin) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     VARCHAR(36) NULL,
  username    VARCHAR(50) NOT NULL,
  action      VARCHAR(255) NOT NULL,
  details     VARCHAR(500) NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- Données de démo (comptes + 4 aéroports initiaux, cf. data/airportsData.ts)
-- Mots de passe hachés bcrypt pour "123456" (à regénérer en prod !)
-- ============================================================================

INSERT IGNORE INTO users (id, username, email, hashed_password, role) VALUES
  (UUID(), 'admin',  'admin@asecna.mg',  '$2b$12$KIXQ6E0J8b6f0mQFvXO0KOG9m3hM9y0v3ZC1o6gk8w0m0v6z0n0lu', 'admin'),
  (UUID(), 'user',   'user@asecna.mg',   '$2b$12$KIXQ6E0J8b6f0mQFvXO0KOG9m3hM9y0v3ZC1o6gk8w0m0v6z0n0lu', 'technicien'),
  (UUID(), 'viewer', 'viewer@asecna.mg', '$2b$12$KIXQ6E0J8b6f0mQFvXO0KOG9m3hM9y0v3ZC1o6gk8w0m0v6z0n0lu', 'user');

-- NOTE : le hash ci-dessus est indicatif. Préférez lancer `python -m app.seed`
-- (backend/app/seed.py) qui génère un hash bcrypt correct au moment de
-- l'insertion, plutôt que de copier ce script tel quel en production.

INSERT IGNORE INTO airports (`key`, name, iata, lat, lng, is_technical_point, in_local_network) VALUES
  ('TNR', 'Ivato', 'TNR', -18.8787, 47.5079, 0, 1),
  ('DIE', 'Toamasina', 'DIE', -18.1089697984752, 49.39269376622393, 0, 1),
  ('MJG', 'Mahajanga', 'MJG', -15.666954850137442, 46.35106480662277, 0, 1),
  ('Fort Dauphin', 'Tolagnaro', 'Fort Dauphin', -25.03644107410689, 46.95447113950406, 0, 1);
