-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: financemanager
-- ------------------------------------------------------
-- Server version	8.0.41

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

--
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `idaccounts` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `total` decimal(10,2) DEFAULT '0.00',
  `id_user` int NOT NULL,
  PRIMARY KEY (`idaccounts`),
  KEY `fk_user_id_idx` (`id_user`),
  CONSTRAINT `fk_user_id` FOREIGN KEY (`id_user`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `idbudgets` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `month` date DEFAULT NULL,
  `note` varchar(45) DEFAULT NULL,
  `frequency` varchar(45) DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`idbudgets`),
  KEY `id_user_idx` (`user_id`),
  CONSTRAINT `fk_id_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `idcategories` int NOT NULL AUTO_INCREMENT,
  `category` varchar(45) NOT NULL,
  `icon` varchar(45) NOT NULL,
  PRIMARY KEY (`idcategories`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expense_attachments`
--

DROP TABLE IF EXISTS `expense_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expense_id` int NOT NULL,
  `file_url` varchar(500) NOT NULL,
  `file_type` varchar(120) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `id_user` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expense_id` (`expense_id`),
  KEY `fk_expense_attachments_user` (`id_user`),
  CONSTRAINT `expense_attachments_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `expense_shared` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_expense_attachments_user` FOREIGN KEY (`id_user`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expense_shared`
--

DROP TABLE IF EXISTS `expense_shared`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_shared` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paid_by` varchar(255) NOT NULL,
  `split_type` enum('equal','manual') NOT NULL DEFAULT 'equal',
  `note` text,
  `created_at` date NOT NULL DEFAULT (curdate()),
  `has_reminder` tinyint(1) DEFAULT '0',
  `reminder_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `expense_shared_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `group` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `idexpenses` int NOT NULL AUTO_INCREMENT,
  `amount` decimal(10,2) NOT NULL,
  `note` varchar(150) DEFAULT NULL,
  `date` date NOT NULL,
  `category_id` int NOT NULL,
  `account_id` int NOT NULL,
  `budget_id` int DEFAULT NULL,
  `group_id` int DEFAULT NULL,
  `option_id` int DEFAULT NULL,
  PRIMARY KEY (`idexpenses`),
  KEY `category_id_idx` (`category_id`),
  KEY `account_id_idx` (`account_id`),
  KEY `budget_id_idx` (`budget_id`),
  KEY `fk_expense_group` (`group_id`),
  KEY `fk_option` (`option_id`),
  CONSTRAINT `account_id` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`idaccounts`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `budget_id` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`idbudgets`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `category_id` FOREIGN KEY (`category_id`) REFERENCES `categories` (`idcategories`),
  CONSTRAINT `fk_expense_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_option` FOREIGN KEY (`option_id`) REFERENCES `options` (`idOption`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2566 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expenses_split`
--

DROP TABLE IF EXISTS `expenses_split`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses_split` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expense_id` int NOT NULL,
  `user_id` int NOT NULL,
  `owed_amount` decimal(10,2) NOT NULL,
  `is_paid` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_user` (`user_id`),
  KEY `fk_expense_shared` (`expense_id`),
  CONSTRAINT `fk_expense_shared` FOREIGN KEY (`expense_id`) REFERENCES `expense_shared` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`idusers`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=234 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expenses_tags`
--

DROP TABLE IF EXISTS `expenses_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses_tags` (
  `idexpenses_tags` int NOT NULL AUTO_INCREMENT,
  `expense_id` int NOT NULL,
  `tag_id` int NOT NULL,
  PRIMARY KEY (`idexpenses_tags`),
  KEY `expense_id_idx` (`expense_id`),
  KEY `tag_id_idx` (`tag_id`),
  CONSTRAINT `expense_id` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`idexpenses`) ON DELETE CASCADE,
  CONSTRAINT `tag_id` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`idtags`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `group`
--

DROP TABLE IF EXISTS `group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `imagePath` varchar(255) DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `group_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`idusers`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `groups_members`
--

DROP TABLE IF EXISTS `groups_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groups_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `user_id` int NOT NULL,
  `joined_at` date DEFAULT NULL,
  `left_at` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `groups_members_ibfk_1` (`group_id`),
  CONSTRAINT `groups_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `group` (`id`) ON DELETE CASCADE,
  CONSTRAINT `groups_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `incomes`
--

DROP TABLE IF EXISTS `incomes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incomes` (
  `idincomes` int NOT NULL AUTO_INCREMENT,
  `amount` decimal(10,2) NOT NULL,
  `date` date NOT NULL,
  `note` varchar(45) DEFAULT NULL,
  `account_id` int NOT NULL,
  PRIMARY KEY (`idincomes`),
  KEY `account_id_idx` (`account_id`),
  CONSTRAINT `fk_account_id` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`idaccounts`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=533 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `objectives`
--

DROP TABLE IF EXISTS `objectives`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objectives` (
  `idObjective` int NOT NULL AUTO_INCREMENT,
  `name_objective` varchar(60) NOT NULL,
  `amount_allocated` decimal(10,2) NOT NULL,
  `due_date` date DEFAULT NULL,
  `account_id` int NOT NULL,
  `budget_id` int DEFAULT NULL,
  `category_id` int NOT NULL,
  `user_id` int NOT NULL,
  `note` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`idObjective`),
  KEY `account_id_idx` (`account_id`),
  KEY `budget_id_idx` (`budget_id`),
  KEY `user_id_obj_idx` (`user_id`),
  KEY `categ_id_fk_idx` (`category_id`),
  CONSTRAINT `account_id_obj` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`idaccounts`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `budget_id_obj` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`idbudgets`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `categ_id` FOREIGN KEY (`category_id`) REFERENCES `categories` (`idcategories`),
  CONSTRAINT `user_id_obj` FOREIGN KEY (`user_id`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `options`
--

DROP TABLE IF EXISTS `options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `options` (
  `idOption` int NOT NULL AUTO_INCREMENT,
  `name_option` varchar(60) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `imagePath` varchar(60) DEFAULT NULL,
  `note` varchar(100) DEFAULT NULL,
  `objective_id` int NOT NULL,
  `chosen` int NOT NULL DEFAULT '0',
  `id_option` int DEFAULT NULL,
  PRIMARY KEY (`idOption`),
  KEY `objective_id_idx` (`objective_id`),
  CONSTRAINT `objective_id` FOREIGN KEY (`objective_id`) REFERENCES `objectives` (`idObjective`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `idtags` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`idtags`),
  UNIQUE KEY `name_UNIQUE` (`name`),
  KEY `user_id_idx` (`user_id`),
  CONSTRAINT `user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `idusers` int NOT NULL AUTO_INCREMENT,
  `username` varchar(45) DEFAULT NULL,
  `password` varchar(60) DEFAULT NULL,
  `name` varchar(45) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `refreshToken` varchar(200) DEFAULT NULL,
  `expo_push_token` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idusers`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-27 15:49:21
