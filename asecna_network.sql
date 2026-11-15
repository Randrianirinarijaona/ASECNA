-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Nov 26, 2026 at 06:11 PM
-- Server version: 8.4.7
-- PHP Version: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `asecna_network`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `action` varchar(255) NOT NULL,
  `details` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_activity_logs_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `username`, `action`, `details`, `created_at`) VALUES
(1, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Modification de l\'aéroport DIEGO (nom/IATA)', NULL, '2026-09-23 08:17:24'),
(2, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Modification de l\'aéroport DIE (nom/IATA)', NULL, '2026-09-23 08:31:13'),
(3, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Modification de l\'aéroport Fort Dauphin (nom/IATA)', NULL, '2026-09-23 10:02:26'),
(4, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Modification de l\'aéroport DIE (nom/IATA)', NULL, '2026-09-30 12:33:24'),
(5, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Modification des informations de la liaison 42460905-68f8-4be8-9f95-6d4df768f847', NULL, '2026-10-13 23:20:07'),
(6, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Modification des informations de la liaison 42460905-68f8-4be8-9f95-6d4df768f847', NULL, '2026-10-13 23:20:13'),
(7, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Modification des informations de la liaison 42460905-68f8-4be8-9f95-6d4df768f847', NULL, '2026-10-13 23:20:49'),
(8, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Modification des informations de la liaison 42460905-68f8-4be8-9f95-6d4df768f847', NULL, '2026-10-13 23:21:09'),
(9, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Création d\'une liaison AMHS entre TNR et MJG', NULL, '2026-10-13 23:21:57'),
(10, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Modification de l\'aéroport MAHAJANGA (nom/IATA)', NULL, '2026-10-20 23:46:45'),
(11, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Suppression de la liaison 5297cd2f-68d1-4486-94f7-f5cd75c57cf4', NULL, '2026-10-20 23:51:40'),
(12, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Création d\'une liaison SMT entre TNR et DAKAR', NULL, '2026-10-23 12:34:34'),
(13, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Création d\'une liaison SMT entre TNR et Fort Dauphin', NULL, '2026-10-23 12:37:04'),
(14, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Modification des informations de la liaison e179ad7f-e18e-4122-b3d5-8f181209bd4f', NULL, '2026-10-23 12:37:40'),
(15, '17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', 'Modification des informations de la liaison 7e817114-bcee-494c-9432-670bb3dae16b', NULL, '2026-10-25 14:06:06');

-- --------------------------------------------------------

--
-- Table structure for table `airports`
--

DROP TABLE IF EXISTS `airports`;
CREATE TABLE IF NOT EXISTS `airports` (
  `key` varchar(64) NOT NULL,
  `name` varchar(150) NOT NULL,
  `iata` varchar(20) NOT NULL DEFAULT '',
  `lat` double NOT NULL,
  `lng` double NOT NULL,
  `is_technical_point` tinyint(1) NOT NULL DEFAULT '0',
  `in_local_network` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `airports`
--

INSERT INTO `airports` (`key`, `name`, `iata`, `lat`, `lng`, `is_technical_point`, `in_local_network`) VALUES
('BRAZZAVILLE', 'Brazzaville', '', -4.2430689769494405, 15.252606506428915, 0, 0),
('DAKAR', 'Dakar', '', 14.67093153115175, -17.072957388383305, 0, 0),
('DIE', 'Tamatave', 'JB', -18.1089697984752, 49.39269376622393, 0, 1),
('DIEGO', 'Diego', 'DIE', -12.349530815201579, 49.29521242187945, 0, 0),
('DZAOUDZI', 'Dzaoudzi', '', -12.80258664537288, 45.282617979562865, 0, 0),
('Fort Dauphin', 'Tolagnaro', 'TWR', -25.03644107410689, 46.95447113950406, 0, 1),
('KIGALI', 'Kigali', '', -1.963086724704963, 30.135050081242426, 0, 0),
('MAHAJANGA', 'Mahajanga', 'MJG', -15.666934189699596, 46.351257925668946, 0, 1),
('MORONI', 'Moroni', '', -11.53508469447056, 43.27154123535198, 0, 0),
('NOSY-BE', 'Nosy Be', '', -13.31872618304863, 48.31067306608802, 0, 0),
('PLAISANCE', 'Plaisance', '', -20.432435226777923, 57.67870953608098, 0, 0),
('REUNION', 'Reunion', '', -20.891516992791264, 55.512240995157214, 0, 0),
('tech-sma-HF-1792926149198', 'Antsirabe', '', -18.9, 46.8, 1, 0),
('tech-sma-VHF-1792926202466', 'tana', '', -17.9, 46.8, 1, 0),
('TNR', 'Antananativo', 'TNR', -18.799296578626116, 47.47541342391937, 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `airport_local_parameters`
--

DROP TABLE IF EXISTS `airport_local_parameters`;
CREATE TABLE IF NOT EXISTS `airport_local_parameters` (
  `id` varchar(36) NOT NULL,
  `airport_key` varchar(64) NOT NULL,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_local_parameters_airport` (`airport_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `airport_local_parameter_values`
--

DROP TABLE IF EXISTS `airport_local_parameter_values`;
CREATE TABLE IF NOT EXISTS `airport_local_parameter_values` (
  `id` varchar(36) NOT NULL,
  `parameter_id` varchar(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `text` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_local_parameter_values_parameter` (`parameter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `app_settings`
--

DROP TABLE IF EXISTS `app_settings`;
CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_key` varchar(64) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `link_parameters`
--

DROP TABLE IF EXISTS `link_parameters`;
CREATE TABLE IF NOT EXISTS `link_parameters` (
  `id` varchar(36) NOT NULL,
  `link_id` varchar(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_link_parameters_link` (`link_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `link_parameters`
--

INSERT INTO `link_parameters` (`id`, `link_id`, `name`) VALUES
('2a5575fc-652c-4715-b8b9-9071f5e5374c', '42460905-68f8-4be8-9f95-6d4df768f847', 'General');

-- --------------------------------------------------------

--
-- Table structure for table `link_parameter_values`
--

DROP TABLE IF EXISTS `link_parameter_values`;
CREATE TABLE IF NOT EXISTS `link_parameter_values` (
  `id` varchar(36) NOT NULL,
  `parameter_id` varchar(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `text` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_link_parameter_values_parameter` (`parameter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `link_parameter_values`
--

INSERT INTO `link_parameter_values` (`id`, `parameter_id`, `name`, `text`) VALUES
('9018940f-658c-44f0-8567-5e7e7b5bfe37', '2a5575fc-652c-4715-b8b9-9071f5e5374c', 'Chanel', 'A'),
('a7350485-a3bf-4db6-8da4-5fdb23b990de', '2a5575fc-652c-4715-b8b9-9071f5e5374c', 'Convey Mode', 'MTP'),
('b7b3c3ce-157a-4dd1-8dfd-2d875784620d', '2a5575fc-652c-4715-b8b9-9071f5e5374c', 'CID In', 'HTA'),
('c52aedd4-d8de-4f11-92f1-c3af853c1461', '2a5575fc-652c-4715-b8b9-9071f5e5374c', 'CID Out', 'THA');

-- --------------------------------------------------------

--
-- Table structure for table `local_technical_points`
--

DROP TABLE IF EXISTS `local_technical_points`;
CREATE TABLE IF NOT EXISTS `local_technical_points` (
  `id` varchar(36) NOT NULL,
  `parent_airport_key` varchar(64) NOT NULL,
  `name` varchar(150) NOT NULL,
  `lat` double NOT NULL,
  `lng` double NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_local_technical_points_parent` (`parent_airport_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `local_technical_point_parameters`
--

DROP TABLE IF EXISTS `local_technical_point_parameters`;
CREATE TABLE IF NOT EXISTS `local_technical_point_parameters` (
  `id` varchar(36) NOT NULL,
  `point_id` varchar(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_local_point_parameters_point` (`point_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `local_technical_point_parameter_values`
--

DROP TABLE IF EXISTS `local_technical_point_parameter_values`;
CREATE TABLE IF NOT EXISTS `local_technical_point_parameter_values` (
  `id` varchar(36) NOT NULL,
  `parameter_id` varchar(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `text` varchar(500) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_local_point_parameter_values_parameter` (`parameter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `network_items`
--

DROP TABLE IF EXISTS `network_items`;
CREATE TABLE IF NOT EXISTS `network_items` (
  `id` varchar(36) NOT NULL,
  `airport_key` varchar(64) NOT NULL,
  `category` enum('sfa','sma','srna') NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text,
  `details` json DEFAULT NULL,
  `status` enum('operational','maintenance','planned') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_network_items_airport_category_title` (`airport_key`,`category`,`title`),
  KEY `ix_network_items_airport_category` (`airport_key`,`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `network_items`
--

INSERT INTO `network_items` (`id`, `airport_key`, `category`, `title`, `description`, `details`, `status`) VALUES
('58df8f5f-0b90-47dc-9e99-28b39ee1e712', 'tech-sma-VHF-1792926202466', 'sma', 'VHF', NULL, NULL, 'operational'),
('7286464a-ea44-4f63-9fc4-7def2f24772d', 'tech-sma-HF-1792926149198', 'sma', 'HF', NULL, NULL, 'operational'),
('ac5e063a-bdac-46ef-ab31-e0da9230f60a', 'TNR', 'sfa', 'AMHS', NULL, 'null', NULL),
('cb993c11-ee13-41fc-b932-cf6135b73dca', 'TNR', 'sma', 'SMT', NULL, 'null', 'operational'),
('eed4a671-a759-4291-8d71-d43b6ca53363', 'Fort Dauphin', 'sfa', 'AMHS', NULL, 'null', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `network_links`
--

DROP TABLE IF EXISTS `network_links`;
CREATE TABLE IF NOT EXISTS `network_links` (
  `id` varchar(36) NOT NULL,
  `category` enum('sfa','sma','srna') NOT NULL,
  `item_title` varchar(150) NOT NULL,
  `from_airport_key` varchar(64) NOT NULL,
  `to_airport_key` varchar(64) NOT NULL,
  `direction` enum('incoming','outgoing','both') NOT NULL DEFAULT 'outgoing',
  `link_type` varchar(100) DEFAULT NULL,
  `circuit` varchar(100) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `port` varchar(10) DEFAULT NULL,
  `status` enum('operational','maintenance','out_of_service') NOT NULL DEFAULT 'operational',
  PRIMARY KEY (`id`),
  KEY `fk_links_from_airport` (`from_airport_key`),
  KEY `fk_links_to_airport` (`to_airport_key`),
  KEY `ix_network_links_lookup` (`category`,`item_title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `network_links`
--

INSERT INTO `network_links` (`id`, `category`, `item_title`, `from_airport_key`, `to_airport_key`, `direction`, `link_type`, `circuit`, `ip_address`, `port`, `status`) VALUES
('36deca71-90cf-41e1-8449-20336b893175', 'sfa', 'AMHS', 'TNR', 'REUNION', 'outgoing', 'TAS', 'RE', '192.168.61.231', '2300', 'operational'),
('42460905-68f8-4be8-9f95-6d4df768f847', 'sfa', 'AMHS', 'TNR', 'KIGALI', 'incoming', 'TCP', 'KI', '10.50.141.100', '50160', 'operational'),
('49114fb8-8450-4108-811d-eff6c9740626', 'sfa', 'SMT', 'TNR', 'DAKAR', 'both', 'Socket', NULL, '10.221.141.200', '14161', 'operational'),
('4cdba69d-7ad1-49b0-8e95-77a32bfbcc6a', 'sfa', 'AMHS', 'TNR', 'PLAISANCE', 'both', 'TAS', 'PL', '192.168.61.231', '2300', 'operational'),
('797c2180-d9b5-4c6e-98fd-58917123bd8b', 'sfa', 'AMHS', 'TNR', 'BRAZZAVILLE', 'both', 'TCP', 'BR', '10.42.141.104', '50261', 'operational'),
('7e817114-bcee-494c-9432-670bb3dae16b', 'sfa', 'AMHS', 'TNR', 'Fort Dauphin', 'outgoing', 'TCP', 'TO', '10.161.247.73', '50160', 'operational'),
('817de941-4729-4661-bff6-78f808b94e8c', 'sfa', 'AMHS', 'TNR', 'DAKAR', 'both', 'TCP', 'DA', '10.21.141.211', '50261', 'operational'),
('92d95c50-327e-4bff-b896-fd808bc2de4b', 'sfa', 'AMHS', 'TNR', 'MORONI', 'both', 'TCP', 'MO', '10.69.141.1', '50261', 'operational'),
('9a981b93-d8c2-4c09-9304-6fc00bd0f1a2', 'sfa', 'AMHS', 'TNR', 'DZAOUDZI', 'both', 'TAS', 'DZ', '192.168.61.231', '2500', 'operational'),
('ba0a5648-3b5d-4f07-84aa-80be4a6babc2', 'sfa', 'AMHS', 'TNR', 'NOSY-BE', 'outgoing', 'TCP', 'NO', '10.61.141.224', '50200', 'operational'),
('e179ad7f-e18e-4122-b3d5-8f181209bd4f', 'sfa', 'SMT', 'TNR', 'Fort Dauphin', 'both', 'Socket', NULL, '10.161.247.73', '61119', 'operational');

-- --------------------------------------------------------

--
-- Table structure for table `network_sub_parameters`
--

DROP TABLE IF EXISTS `network_sub_parameters`;
CREATE TABLE IF NOT EXISTS `network_sub_parameters` (
  `id` varchar(36) NOT NULL,
  `item_id` varchar(36) NOT NULL,
  `title` varchar(150) NOT NULL,
  `value` varchar(255) NOT NULL,
  `status` enum('operational','maintenance') NOT NULL DEFAULT 'operational',
  `description` text,
  PRIMARY KEY (`id`),
  KEY `fk_sub_parameters_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `role` enum('admin','technicien','user') NOT NULL DEFAULT 'user',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `ix_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `hashed_password`, `role`, `is_active`, `created_at`, `last_login`) VALUES
('17f7a25c-fcdf-436c-b5df-72a389fa7c94', 'administrateur', NULL, '$2b$12$120M4L9tS1LALMSCktwb0.bTtnfwjGKFlLTyqAVqT4a8wr2MNwMJe', 'admin', 1, '2026-09-20 20:21:40', '2026-11-26 18:08:53'),
('c77d6330-b50e-11f1-a32a-708bcd1baeb4', 'user', 'user@asecna.mg', '$2b$12$KIXQ6E0J8b6f0mQFvXO0KOG9m3hM9y0v3ZC1o6gk8w0m0v6z0n0lu', 'technicien', 1, '2026-09-20 19:17:30', NULL),
('c77d67c0-b50e-11f1-a32a-708bcd1baeb4', 'viewer', 'viewer@asecna.mg', '$2b$12$KIXQ6E0J8b6f0mQFvXO0KOG9m3hM9y0v3ZC1o6gk8w0m0v6z0n0lu', 'user', 1, '2026-09-20 19:17:30', NULL);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `fk_activity_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `airport_local_parameters`
--
ALTER TABLE `airport_local_parameters`
  ADD CONSTRAINT `fk_local_parameters_airport` FOREIGN KEY (`airport_key`) REFERENCES `airports` (`key`) ON DELETE CASCADE;

--
-- Constraints for table `airport_local_parameter_values`
--
ALTER TABLE `airport_local_parameter_values`
  ADD CONSTRAINT `fk_local_parameter_values_parameter` FOREIGN KEY (`parameter_id`) REFERENCES `airport_local_parameters` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `link_parameters`
--
ALTER TABLE `link_parameters`
  ADD CONSTRAINT `fk_link_parameters_link` FOREIGN KEY (`link_id`) REFERENCES `network_links` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `link_parameter_values`
--
ALTER TABLE `link_parameter_values`
  ADD CONSTRAINT `fk_link_parameter_values_parameter` FOREIGN KEY (`parameter_id`) REFERENCES `link_parameters` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `local_technical_points`
--
ALTER TABLE `local_technical_points`
  ADD CONSTRAINT `fk_local_points_airport` FOREIGN KEY (`parent_airport_key`) REFERENCES `airports` (`key`) ON DELETE CASCADE;

--
-- Constraints for table `local_technical_point_parameters`
--
ALTER TABLE `local_technical_point_parameters`
  ADD CONSTRAINT `fk_local_point_parameters_point` FOREIGN KEY (`point_id`) REFERENCES `local_technical_points` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `local_technical_point_parameter_values`
--
ALTER TABLE `local_technical_point_parameter_values`
  ADD CONSTRAINT `fk_local_point_parameter_values_parameter` FOREIGN KEY (`parameter_id`) REFERENCES `local_technical_point_parameters` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `network_items`
--
ALTER TABLE `network_items`
  ADD CONSTRAINT `fk_network_items_airport` FOREIGN KEY (`airport_key`) REFERENCES `airports` (`key`) ON DELETE CASCADE;

--
-- Constraints for table `network_links`
--
ALTER TABLE `network_links`
  ADD CONSTRAINT `fk_links_from_airport` FOREIGN KEY (`from_airport_key`) REFERENCES `airports` (`key`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_links_to_airport` FOREIGN KEY (`to_airport_key`) REFERENCES `airports` (`key`) ON DELETE CASCADE;

--
-- Constraints for table `network_sub_parameters`
--
ALTER TABLE `network_sub_parameters`
  ADD CONSTRAINT `fk_sub_parameters_item` FOREIGN KEY (`item_id`) REFERENCES `network_items` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
