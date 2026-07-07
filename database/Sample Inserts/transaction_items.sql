-- =============================================================
--  HIStore'y - Sample Transaction Items Insert
-- =============================================================
USE `hstore_db`;

INSERT INTO `transaction_items` (`id`, `transaction_id`, `product_id`, `quantity`, `unit_price`) VALUES
(1, 1, 1, 1, 4999.00),
(2, 1, 6, 1, 3200.00),
(3, 2, 2, 2, 2499.00),
(4, 3, 8, 1, 1200.00),
(5, 4, 3, 1, 1899.00),
(6, 4, 13, 2, 750.00);
