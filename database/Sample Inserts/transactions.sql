-- =============================================================
--  HIStore'y - Sample Transactions Insert
-- =============================================================
USE `hstore_db`;

INSERT INTO `transactions` (`id`, `user_id`, `status`, `payment_status`) VALUES
(1, 2, 'Delivered', 'Paid'),
(2, 2, 'Shipped', 'Paid'),
(3, 3, 'Processing', 'Pending'),
(4, 3, 'Pending', 'Pending');
