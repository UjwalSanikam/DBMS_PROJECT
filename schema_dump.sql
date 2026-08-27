
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `club`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `club` (
  `club_id` int unsigned NOT NULL AUTO_INCREMENT,
  `league_id` int unsigned NOT NULL,
  `club_name` varchar(120) NOT NULL,
  `city` varchar(80) DEFAULT NULL,
  `country` varchar(80) NOT NULL,
  `founded_year` smallint unsigned DEFAULT NULL,
  PRIMARY KEY (`club_id`),
  KEY `idx_club_league` (`league_id`),
  CONSTRAINT `fk_club_league` FOREIGN KEY (`league_id`) REFERENCES `league` (`league_id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `contract`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contract` (
  `contract_id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int unsigned NOT NULL,
  `club_id` int unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `weekly_salary` decimal(12,2) DEFAULT NULL,
  `release_clause` decimal(14,2) DEFAULT NULL,
  `currency` char(3) NOT NULL DEFAULT 'EUR',
  `contract_status` enum('ACTIVE','EXPIRED','TERMINATED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`contract_id`),
  KEY `fk_contract_club` (`club_id`),
  KEY `idx_contract_player_end` (`player_id`,`end_date`),
  KEY `idx_contract_end` (`end_date`),
  CONSTRAINT `fk_contract_club` FOREIGN KEY (`club_id`) REFERENCES `club` (`club_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_contract_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`player_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_contract_dates` CHECK ((`end_date` > `start_date`)),
  CONSTRAINT `chk_contract_release_clause` CHECK (((`release_clause` is null) or (`release_clause` >= 0))),
  CONSTRAINT `chk_contract_salary` CHECK (((`weekly_salary` is null) or (`weekly_salary` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=295 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`scoutiq_app`@`localhost`*/ /*!50003 TRIGGER `trg_contract_before_insert` BEFORE INSERT ON `contract` FOR EACH ROW BEGIN
  IF NEW.end_date <= NEW.start_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'contract end_date must be after start_date';
  END IF;
  IF NEW.weekly_salary IS NOT NULL AND NEW.weekly_salary < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'weekly_salary cannot be negative';
  END IF;
  IF NEW.release_clause IS NOT NULL AND NEW.release_clause < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'release_clause cannot be negative';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`scoutiq_app`@`localhost`*/ /*!50003 TRIGGER `trg_contract_single_active_after_insert` AFTER INSERT ON `contract` FOR EACH ROW BEGIN
  IF NEW.contract_status = 'ACTIVE' THEN
    UPDATE contract
    SET contract_status = 'EXPIRED'
    WHERE player_id = NEW.player_id
      AND contract_id <> NEW.contract_id
      AND contract_status = 'ACTIVE';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`scoutiq_app`@`localhost`*/ /*!50003 TRIGGER `trg_contract_before_update` BEFORE UPDATE ON `contract` FOR EACH ROW BEGIN
  IF NEW.end_date <= NEW.start_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'contract end_date must be after start_date';
  END IF;
  IF NEW.weekly_salary IS NOT NULL AND NEW.weekly_salary < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'weekly_salary cannot be negative';
  END IF;
  IF NEW.release_clause IS NOT NULL AND NEW.release_clause < 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'release_clause cannot be negative';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `injury`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `injury` (
  `injury_id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int unsigned NOT NULL,
  `injury_type` varchar(120) NOT NULL,
  `body_area` varchar(80) NOT NULL,
  `injury_date` date NOT NULL,
  `expected_return_date` date DEFAULT NULL,
  `actual_return_date` date DEFAULT NULL,
  `severity` enum('MINOR','MODERATE','MAJOR') NOT NULL,
  `status` enum('ACTIVE','RECOVERING','RECOVERED') NOT NULL DEFAULT 'ACTIVE',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`injury_id`),
  KEY `idx_injury_player_status` (`player_id`,`status`),
  KEY `idx_injury_expected_return` (`expected_return_date`),
  CONSTRAINT `fk_injury_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`player_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_injury_actual_return` CHECK (((`actual_return_date` is null) or (`actual_return_date` >= `injury_date`))),
  CONSTRAINT `chk_injury_expected_return` CHECK (((`expected_return_date` is null) or (`expected_return_date` >= `injury_date`)))
) ENGINE=InnoDB AUTO_INCREMENT=338 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`scoutiq_app`@`localhost`*/ /*!50003 TRIGGER `trg_injury_before_insert` BEFORE INSERT ON `injury` FOR EACH ROW BEGIN
  IF NEW.expected_return_date IS NOT NULL AND NEW.expected_return_date < NEW.injury_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'expected_return_date cannot be before injury_date';
  END IF;
  IF NEW.actual_return_date IS NOT NULL AND NEW.actual_return_date < NEW.injury_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'actual_return_date cannot be before injury_date';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`scoutiq_app`@`localhost`*/ /*!50003 TRIGGER `trg_injury_before_update` BEFORE UPDATE ON `injury` FOR EACH ROW BEGIN
  IF NEW.expected_return_date IS NOT NULL AND NEW.expected_return_date < NEW.injury_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'expected_return_date cannot be before injury_date';
  END IF;
  IF NEW.actual_return_date IS NOT NULL AND NEW.actual_return_date < NEW.injury_date THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'actual_return_date cannot be before injury_date';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `league`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `league` (
  `league_id` int unsigned NOT NULL AUTO_INCREMENT,
  `league_name` varchar(120) NOT NULL,
  `country` varchar(80) NOT NULL,
  `tier` tinyint unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`league_id`),
  UNIQUE KEY `uq_league_name_country` (`league_name`,`country`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `market_value_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `market_value_history` (
  `valuation_id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int unsigned NOT NULL,
  `valuation_date` date NOT NULL,
  `market_value` decimal(14,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'EUR',
  `source_label` varchar(80) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`valuation_id`),
  UNIQUE KEY `uq_valuation_player_date` (`player_id`,`valuation_date`),
  KEY `idx_valuation_player_date` (`player_id`,`valuation_date`),
  CONSTRAINT `fk_valuation_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`player_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_valuation_value` CHECK ((`market_value` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=1921 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `player`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player` (
  `player_id` int unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(80) NOT NULL,
  `last_name` varchar(80) NOT NULL,
  `date_of_birth` date NOT NULL,
  `nationality` varchar(80) NOT NULL,
  `primary_position` enum('GK','CB','LB','RB','LWB','RWB','DM','CM','AM','LW','RW','ST') NOT NULL,
  `secondary_position` enum('GK','CB','LB','RB','LWB','RWB','DM','CM','AM','LW','RW','ST') DEFAULT NULL,
  `preferred_foot` enum('LEFT','RIGHT','BOTH') NOT NULL DEFAULT 'RIGHT',
  `height_cm` smallint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`player_id`),
  KEY `idx_player_position` (`primary_position`),
  KEY `idx_player_dob` (`date_of_birth`),
  CONSTRAINT `chk_player_height` CHECK (((`height_cm` is null) or (`height_cm` between 140 and 220)))
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `player_club`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_club` (
  `player_club_id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int unsigned NOT NULL,
  `club_id` int unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `shirt_number` tinyint unsigned DEFAULT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`player_club_id`),
  KEY `idx_playerclub_player` (`player_id`),
  KEY `idx_playerclub_club` (`club_id`),
  KEY `idx_playerclub_current` (`player_id`,`is_current`),
  CONSTRAINT `fk_playerclub_club` FOREIGN KEY (`club_id`) REFERENCES `club` (`club_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_playerclub_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`player_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_playerclub_dates` CHECK (((`end_date` is null) or (`end_date` > `start_date`)))
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `player_statistics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_statistics` (
  `stat_id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int unsigned NOT NULL,
  `club_id` int unsigned NOT NULL,
  `league_id` int unsigned NOT NULL,
  `season` varchar(9) NOT NULL,
  `appearances` smallint unsigned NOT NULL DEFAULT '0',
  `starts` smallint unsigned NOT NULL DEFAULT '0',
  `minutes_played` int unsigned NOT NULL DEFAULT '0',
  `goals` smallint unsigned NOT NULL DEFAULT '0',
  `assists` smallint unsigned NOT NULL DEFAULT '0',
  `xg` decimal(6,2) NOT NULL DEFAULT '0.00',
  `xa` decimal(6,2) NOT NULL DEFAULT '0.00',
  `shots` smallint unsigned NOT NULL DEFAULT '0',
  `shots_on_target` smallint unsigned NOT NULL DEFAULT '0',
  `key_passes` smallint unsigned NOT NULL DEFAULT '0',
  `progressive_passes` smallint unsigned NOT NULL DEFAULT '0',
  `pass_accuracy` decimal(5,2) NOT NULL DEFAULT '0.00',
  `tackles` smallint unsigned NOT NULL DEFAULT '0',
  `interceptions` smallint unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`stat_id`),
  UNIQUE KEY `uq_stats_player_club_league_season` (`player_id`,`club_id`,`league_id`,`season`),
  KEY `idx_stats_player_season` (`player_id`,`season`),
  KEY `idx_stats_club` (`club_id`),
  KEY `idx_stats_league` (`league_id`),
  CONSTRAINT `fk_stats_club` FOREIGN KEY (`club_id`) REFERENCES `club` (`club_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_stats_league` FOREIGN KEY (`league_id`) REFERENCES `league` (`league_id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_stats_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`player_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_stats_pass_accuracy` CHECK ((`pass_accuracy` between 0 and 100)),
  CONSTRAINT `chk_stats_shots_on_target` CHECK ((`shots_on_target` <= `shots`)),
  CONSTRAINT `chk_stats_starts_le_apps` CHECK ((`starts` <= `appearances`))
) ENGINE=InnoDB AUTO_INCREMENT=721 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `filename` varchar(255) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`filename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `scout_report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scout_report` (
  `report_id` int unsigned NOT NULL AUTO_INCREMENT,
  `scout_user_id` int unsigned NOT NULL,
  `player_id` int unsigned NOT NULL,
  `overall_rating` decimal(3,1) NOT NULL,
  `strengths` text,
  `weaknesses` text,
  `tactical_fit` text,
  `recommendation` enum('AVOID','MONITOR','SHORTLIST','PRIORITY') NOT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  KEY `idx_report_player` (`player_id`),
  KEY `idx_report_scout` (`scout_user_id`),
  CONSTRAINT `fk_report_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`player_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_report_scout` FOREIGN KEY (`scout_user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_report_rating` CHECK ((`overall_rating` between 1.0 and 10.0))
) ENGINE=InnoDB AUTO_INCREMENT=272 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `shortlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shortlist` (
  `shortlist_id` int unsigned NOT NULL AUTO_INCREMENT,
  `scout_user_id` int unsigned NOT NULL,
  `player_id` int unsigned NOT NULL,
  `priority` enum('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
  `status` enum('WATCHING','RECOMMENDED','CONTACT_CLUB','NEGOTIATING','REJECTED','SIGNED') NOT NULL DEFAULT 'WATCHING',
  `reason` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`shortlist_id`),
  UNIQUE KEY `uq_shortlist_scout_player` (`scout_user_id`,`player_id`),
  KEY `idx_shortlist_scout_status` (`scout_user_id`,`status`),
  KEY `idx_shortlist_player` (`player_id`),
  CONSTRAINT `fk_shortlist_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`player_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shortlist_scout` FOREIGN KEY (`scout_user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=138 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `transfer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfer` (
  `transfer_id` int unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int unsigned NOT NULL,
  `from_club_id` int unsigned DEFAULT NULL,
  `to_club_id` int unsigned DEFAULT NULL,
  `transfer_date` date NOT NULL,
  `transfer_fee` decimal(14,2) DEFAULT NULL,
  `currency` char(3) NOT NULL DEFAULT 'EUR',
  `transfer_type` enum('PERMANENT','LOAN','FREE','LOAN_RETURN','ACADEMY_PROMOTION') NOT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transfer_id`),
  KEY `fk_transfer_from_club` (`from_club_id`),
  KEY `idx_transfer_player_date` (`player_id`,`transfer_date`),
  KEY `idx_transfer_to_club` (`to_club_id`),
  CONSTRAINT `fk_transfer_from_club` FOREIGN KEY (`from_club_id`) REFERENCES `club` (`club_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_transfer_player` FOREIGN KEY (`player_id`) REFERENCES `player` (`player_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_transfer_to_club` FOREIGN KEY (`to_club_id`) REFERENCES `club` (`club_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_transfer_fee` CHECK (((`transfer_fee` is null) or (`transfer_fee` >= 0)))
) ENGINE=InnoDB AUTO_INCREMENT=166 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(120) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('ADMIN','SCOUT') NOT NULL DEFAULT 'SCOUT',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_user_email` (`email`),
  KEY `idx_user_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `vw_available_players`;
/*!50001 DROP VIEW IF EXISTS `vw_available_players`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_available_players` AS SELECT 
 1 AS `player_id`,
 1 AS `first_name`,
 1 AS `last_name`,
 1 AS `primary_position`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_contract_expiry`;
/*!50001 DROP VIEW IF EXISTS `vw_contract_expiry`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_contract_expiry` AS SELECT 
 1 AS `contract_id`,
 1 AS `player_id`,
 1 AS `first_name`,
 1 AS `last_name`,
 1 AS `club_id`,
 1 AS `club_name`,
 1 AS `end_date`,
 1 AS `months_remaining`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_latest_market_values`;
/*!50001 DROP VIEW IF EXISTS `vw_latest_market_values`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_latest_market_values` AS SELECT 
 1 AS `player_id`,
 1 AS `market_value`,
 1 AS `currency`,
 1 AS `valuation_date`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_player_recruitment_snapshot`;
/*!50001 DROP VIEW IF EXISTS `vw_player_recruitment_snapshot`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_player_recruitment_snapshot` AS SELECT 
 1 AS `player_id`,
 1 AS `player_name`,
 1 AS `age`,
 1 AS `position`,
 1 AS `club_name`,
 1 AS `league_name`,
 1 AS `market_value`,
 1 AS `contract_end`,
 1 AS `availability`,
 1 AS `injury_type`,
 1 AS `expected_return_date`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_u23_recruitment_candidates`;
/*!50001 DROP VIEW IF EXISTS `vw_u23_recruitment_candidates`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_u23_recruitment_candidates` AS SELECT 
 1 AS `player_id`,
 1 AS `first_name`,
 1 AS `last_name`,
 1 AS `primary_position`,
 1 AS `age`,
 1 AS `market_value`,
 1 AS `contract_end`,
 1 AS `availability`*/;
SET character_set_client = @saved_cs_client;
/*!50003 DROP PROCEDURE IF EXISTS `sp_add_scout_recommendation` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`scoutiq_app`@`localhost` PROCEDURE `sp_add_scout_recommendation`(
  IN p_scout_user_id  INT UNSIGNED,
  IN p_player_id      INT UNSIGNED,
  IN p_overall_rating DECIMAL(3,1),
  IN p_strengths      TEXT,
  IN p_weaknesses     TEXT,
  IN p_tactical_fit   TEXT,
  IN p_recommendation VARCHAR(20),
  IN p_notes          TEXT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  INSERT INTO scout_report (scout_user_id, player_id, overall_rating, strengths,
                             weaknesses, tactical_fit, recommendation, notes)
  VALUES (p_scout_user_id, p_player_id, p_overall_rating, p_strengths,
          p_weaknesses, p_tactical_fit, p_recommendation, p_notes);

  IF p_recommendation IN ('SHORTLIST', 'PRIORITY') THEN
    INSERT INTO shortlist (scout_user_id, player_id, priority, status, reason)
    VALUES (
      p_scout_user_id, p_player_id,
      IF(p_recommendation = 'PRIORITY', 'HIGH', 'MEDIUM'),
      'RECOMMENDED',
      CONCAT('Auto-added from scout report: ', p_recommendation)
    )
    ON DUPLICATE KEY UPDATE
      status = 'RECOMMENDED',
      priority = IF(p_recommendation = 'PRIORITY', 'HIGH', VALUES(priority)),
      updated_at = CURRENT_TIMESTAMP;
  END IF;

  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_record_transfer` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`scoutiq_app`@`localhost` PROCEDURE `sp_record_transfer`(
  IN p_player_id      INT UNSIGNED,
  IN p_from_club_id   INT UNSIGNED,
  IN p_to_club_id     INT UNSIGNED,
  IN p_transfer_date  DATE,
  IN p_transfer_fee   DECIMAL(14,2),
  IN p_currency       CHAR(3),
  IN p_transfer_type  VARCHAR(20),
  IN p_notes          TEXT
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  INSERT INTO transfer (player_id, from_club_id, to_club_id, transfer_date,
                         transfer_fee, currency, transfer_type, notes)
  VALUES (p_player_id, p_from_club_id, p_to_club_id, p_transfer_date,
          p_transfer_fee, p_currency, p_transfer_type, p_notes);

  -- Close the player's existing current club membership, if any
  UPDATE player_club
  SET end_date = p_transfer_date, is_current = FALSE
  WHERE player_id = p_player_id AND is_current = TRUE;

  -- Open the new club membership (skip for LOAN_RETURN with no destination club)
  IF p_to_club_id IS NOT NULL THEN
    INSERT INTO player_club (player_id, club_id, start_date, is_current)
    VALUES (p_player_id, p_to_club_id, p_transfer_date, TRUE);
  END IF;

  COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50001 DROP VIEW IF EXISTS `vw_available_players`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`scoutiq_app`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_available_players` AS select `p`.`player_id` AS `player_id`,`p`.`first_name` AS `first_name`,`p`.`last_name` AS `last_name`,`p`.`primary_position` AS `primary_position` from `player` `p` where exists(select 1 from `injury` `i` where ((`i`.`player_id` = `p`.`player_id`) and (`i`.`status` in ('ACTIVE','RECOVERING')))) is false */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_contract_expiry`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`scoutiq_app`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_contract_expiry` AS select `c`.`contract_id` AS `contract_id`,`c`.`player_id` AS `player_id`,`p`.`first_name` AS `first_name`,`p`.`last_name` AS `last_name`,`c`.`club_id` AS `club_id`,`cl`.`club_name` AS `club_name`,`c`.`end_date` AS `end_date`,timestampdiff(MONTH,curdate(),`c`.`end_date`) AS `months_remaining` from ((`contract` `c` join `player` `p` on((`p`.`player_id` = `c`.`player_id`))) join `club` `cl` on((`cl`.`club_id` = `c`.`club_id`))) where ((`c`.`contract_status` = 'ACTIVE') and (`c`.`end_date` >= curdate())) order by `c`.`end_date` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_latest_market_values`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`scoutiq_app`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_latest_market_values` AS select `mvh`.`player_id` AS `player_id`,`mvh`.`market_value` AS `market_value`,`mvh`.`currency` AS `currency`,`mvh`.`valuation_date` AS `valuation_date` from (`market_value_history` `mvh` join (select `market_value_history`.`player_id` AS `player_id`,max(`market_value_history`.`valuation_date`) AS `max_date` from `market_value_history` group by `market_value_history`.`player_id`) `latest` on(((`latest`.`player_id` = `mvh`.`player_id`) and (`latest`.`max_date` = `mvh`.`valuation_date`)))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_player_recruitment_snapshot`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`scoutiq_app`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_player_recruitment_snapshot` AS select `p`.`player_id` AS `player_id`,concat(`p`.`first_name`,' ',`p`.`last_name`) AS `player_name`,timestampdiff(YEAR,`p`.`date_of_birth`,curdate()) AS `age`,`p`.`primary_position` AS `position`,`cl`.`club_name` AS `club_name`,`lg`.`league_name` AS `league_name`,`lmv`.`market_value` AS `market_value`,`ce`.`end_date` AS `contract_end`,(case when (`av`.`player_id` is null) then 'INJURED' else 'AVAILABLE' end) AS `availability`,`active_inj`.`injury_type` AS `injury_type`,`active_inj`.`expected_return_date` AS `expected_return_date` from (((((((`player` `p` left join `player_club` `pc` on(((`pc`.`player_id` = `p`.`player_id`) and (`pc`.`is_current` = true)))) left join `club` `cl` on((`cl`.`club_id` = `pc`.`club_id`))) left join `league` `lg` on((`lg`.`league_id` = `cl`.`league_id`))) left join `vw_latest_market_values` `lmv` on((`lmv`.`player_id` = `p`.`player_id`))) left join `vw_contract_expiry` `ce` on((`ce`.`player_id` = `p`.`player_id`))) left join `vw_available_players` `av` on((`av`.`player_id` = `p`.`player_id`))) left join (select `i1`.`player_id` AS `player_id`,`i1`.`injury_type` AS `injury_type`,`i1`.`expected_return_date` AS `expected_return_date` from `injury` `i1` where ((`i1`.`status` in ('ACTIVE','RECOVERING')) and (`i1`.`injury_date` = (select max(`i2`.`injury_date`) from `injury` `i2` where ((`i2`.`player_id` = `i1`.`player_id`) and (`i2`.`status` in ('ACTIVE','RECOVERING'))))))) `active_inj` on((`active_inj`.`player_id` = `p`.`player_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_u23_recruitment_candidates`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`scoutiq_app`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_u23_recruitment_candidates` AS select `p`.`player_id` AS `player_id`,`p`.`first_name` AS `first_name`,`p`.`last_name` AS `last_name`,`p`.`primary_position` AS `primary_position`,timestampdiff(YEAR,`p`.`date_of_birth`,curdate()) AS `age`,`lmv`.`market_value` AS `market_value`,`ce`.`end_date` AS `contract_end`,(case when (`av`.`player_id` is null) then 'INJURED' else 'AVAILABLE' end) AS `availability` from (((`player` `p` left join `vw_latest_market_values` `lmv` on((`lmv`.`player_id` = `p`.`player_id`))) left join `vw_contract_expiry` `ce` on((`ce`.`player_id` = `p`.`player_id`))) left join `vw_available_players` `av` on((`av`.`player_id` = `p`.`player_id`))) where (timestampdiff(YEAR,`p`.`date_of_birth`,curdate()) < 23) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

