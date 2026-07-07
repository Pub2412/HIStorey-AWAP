-- =============================================================
--  HIStore'y - Sample Reviews Insert
-- =============================================================
USE `hstore_db`;

INSERT INTO `reviews` (`id`, `user_id`, `product_id`, `rating`, `comment`) VALUES
(1, 2, 1, 5, 'Absolutely historic piece of music history! Sleeve has minimal wear and plays like new.'),
(2, 2, 6, 4, 'Very high quality leather replica, fits nicely. Zippers are sturdy.'),
(3, 2, 2, 5, 'Excellent CD with OBI strip included. Perfect collector item.');
