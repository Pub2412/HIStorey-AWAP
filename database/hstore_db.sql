-- =============================================================
--  HIStore'y - MySQL Database Schema
--  An E-commerce platform for Michael Jackson memorabilia
--  Technological University of the Philippines - Taguig
--  Authors: Haboc, Lance Grant E. | Padilla, John Sherwin E.
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+08:00";

-- -------------------------------------------------------------
--  Create and select database
-- -------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `hstore_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `hstore_db`;

-- -------------------------------------------------------------
--  Drop existing tables if they exist (reverse dependency order)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `email_logs`;
DROP TABLE IF EXISTS `transaction_items`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `product_images`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `users`;

-- =============================================================
--  TABLE: users
--  Stores both customer and admin accounts.
--  role         = 'customer' or 'admin'
--  is_active    = soft-deactivation (deactivated users cannot log in)
--  active_token = current valid JWT for single-session control
-- =============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(150)     NOT NULL,
  `email`         VARCHAR(255)     NOT NULL,
  `password_hash` VARCHAR(255)     NOT NULL,
  `role`          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  `is_active`     TINYINT(1)       NOT NULL DEFAULT 1,
  `active_token`  TEXT             NULL,
  `profile_photo` VARCHAR(500)     NULL,
  `phone`         VARCHAR(30)      NULL,
  `address`       TEXT             NULL,
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  INDEX `idx_users_role`      (`role`),
  INDEX `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
--  TABLE: products
--  Memorabilia catalogue managed exclusively by admins.
--  condition  = New, Like New, Good, Fair, Poor
--  is_deleted = soft-delete flag
-- =============================================================
CREATE TABLE IF NOT EXISTS `products` (
  `id`          INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(255)   NOT NULL,
  `description` TEXT           NULL,
  `category` ENUM(
  'Music',
  'Albums',
  'Merchandise',
  'Posters',
  'Apparel',
  'Collectibles',
  'Accessories'
) NOT NULL,
  `price`       DECIMAL(10,2)  NOT NULL,
  `stock`       INT UNSIGNED   NOT NULL DEFAULT 0,
  `condition`   ENUM('New','Like New','Good','Fair','Poor') NOT NULL DEFAULT 'Good',
  `year`        YEAR           NULL,
  `is_deleted`  TINYINT(1)     NOT NULL DEFAULT 0,
  `created_at`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_products_category`   (`category`),
  INDEX `idx_products_is_deleted` (`is_deleted`),
  INDEX `idx_products_price`      (`price`),
  FULLTEXT KEY `ft_products_search` (`name`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
--  TABLE: product_images
--  Up to 5 images per product (Multer multi-upload).
--  is_primary = TRUE for the main thumbnail shown in listings
-- =============================================================
CREATE TABLE IF NOT EXISTS `product_images` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `product_id`  INT UNSIGNED  NOT NULL,
  `file_path`   VARCHAR(500)  NOT NULL,
  `is_primary`  TINYINT(1)    NOT NULL DEFAULT 0,
  `uploaded_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_pi_product_id` (`product_id`),
  CONSTRAINT `fk_pi_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
--  TABLE: transactions
--  One record per placed order.
--  Status flow: Pending > Processing > Shipped > Delivered
--               Customer or admin may also set: Cancelled
-- =============================================================
CREATE TABLE IF NOT EXISTS `transactions` (
  `id`               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `user_id`          INT UNSIGNED  NOT NULL,
  `status`           ENUM('Pending','Processing','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
  `payment_status`   ENUM('Pending','Paid','Cancelled') NOT NULL DEFAULT 'Pending',
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tx_user_id` (`user_id`),
  INDEX `idx_tx_status`  (`status`),
  INDEX `idx_tx_created` (`created_at`),
  CONSTRAINT `fk_tx_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
--  TABLE: transaction_items
--  Line items per transaction.
--  unit_price is a snapshot of the price at time of purchase.
-- =============================================================
CREATE TABLE IF NOT EXISTS `transaction_items` (
  `id`             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `transaction_id` INT UNSIGNED  NOT NULL,
  `product_id`     INT UNSIGNED  NOT NULL,
  `quantity`       INT UNSIGNED  NOT NULL,
  `unit_price`     DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_ti_transaction` (`transaction_id`),
  INDEX `idx_ti_product`     (`product_id`),
  CONSTRAINT `fk_ti_transaction`
    FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ti_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
--  TABLE: email_logs
--  Audit trail for every Nodemailer transactional email.
--  status         = 'sent' or 'failed'
--  has_attachment = 1 when a PDF receipt was attached
-- =============================================================
CREATE TABLE IF NOT EXISTS `email_logs` (
  `id`             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `transaction_id` INT UNSIGNED  NOT NULL,
  `recipient`      VARCHAR(255)  NOT NULL,
  `subject`        VARCHAR(255)  NOT NULL,
  `status`         ENUM('sent','failed') NOT NULL DEFAULT 'sent',
  `has_attachment` TINYINT(1)    NOT NULL DEFAULT 0,
  `sent_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_el_transaction` (`transaction_id`),
  INDEX `idx_el_status`      (`status`),
  CONSTRAINT `fk_el_transaction`
    FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
--  TABLE: reviews
--  Storing reviews per product
-- =============================================================

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `rating` TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  `comment` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_user_product` (`user_id`, `product_id`),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
--  TABLE: favorites
--  Storing user favorite products
-- =============================================================

CREATE TABLE IF NOT EXISTS `favorites` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_favorite_user_product` (`user_id`, `product_id`),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================
--  SEED DATA - Default admin account
--  Plain-text password: Admin@1234
--  Hash generated with bcrypt (salt rounds = 10)
-- =============================================================
INSERT INTO `users` (`name`, `email`, `password_hash`, `role`, `is_active`)
VALUES (
  'HIStorey Admin',
  'admin@hiStorey.com',
  '$2b$10$kwkbdH10aayHF13Nh1dmtOWNn1z4ORXf8RsZwOpc5eBo6z1Rk5N4S',
  'admin',
  1
);

SET FOREIGN_KEY_CHECKS = 1;