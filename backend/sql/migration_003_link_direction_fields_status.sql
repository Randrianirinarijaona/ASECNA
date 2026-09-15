-- ============================================================================
-- ASECNA Network — Migration SQL 003
-- Remplace `bidirectional` par `direction` (Entrant/Sortant/Entrant et
-- sortant) et ajoute type/circuit/@IP/port/statut sur les liaisons.
-- Impose également que toute liaison existante parte d'Antananarivo (TNR).
--
-- À exécuter dans phpMyAdmin (onglet SQL) sur la base `asecna_network`
-- existante. Équivalent de `alembic upgrade head` (revision 0003).
-- ============================================================================

USE asecna_network;

-- ─── 1. Nouvelles colonnes ────────────────────────────────────────────────
ALTER TABLE network_links
  ADD COLUMN direction   ENUM('incoming','outgoing','both') NOT NULL DEFAULT 'outgoing',
  ADD COLUMN link_type   VARCHAR(100) NULL,
  ADD COLUMN circuit     VARCHAR(100) NULL,
  ADD COLUMN ip_address  VARCHAR(45)  NULL,
  ADD COLUMN port        VARCHAR(10)  NULL,
  ADD COLUMN status      ENUM('operational','maintenance','out_of_service') NOT NULL DEFAULT 'operational';

-- ─── 2. Migration des données existantes ─────────────────────────────────
-- Ancien `bidirectional = 1` -> nouveau `direction = 'both'`.
UPDATE network_links SET direction = 'both' WHERE bidirectional = 1;

-- Toute liaison existante ne partant pas d'Antananarivo devient invalide
-- au regard de la nouvelle règle métier ; elle est supprimée pour repartir
-- sur un état cohérent. À adapter si des données réelles doivent être
-- conservées/réattribuées manuellement avant d'exécuter ce script.
DELETE FROM network_links WHERE from_airport_key <> 'TNR';

ALTER TABLE network_links DROP COLUMN bidirectional;
