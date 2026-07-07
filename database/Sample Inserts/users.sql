-- =============================================================
--  HIStore'y - Sample Users Insert
--  Admin plain-text password: Admin@1234
--  Customer plain-text password: Customer@1234
-- =============================================================
USE `hstore_db`;

INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `is_active`, `phone`, `address`) VALUES
(1, 'HIStorey Admin', 'admin@hiStorey.com', '$2b$10$kwkbdH10aayHF13Nh1dmtOWNn1z4ORXf8RsZwOpc5eBo6z1Rk5N4S', 'admin', 1, '09123456789', 'TUP Taguig Campus, Taguig City'),
(2, 'John Doe', 'john@example.com', '$2b$10$fWY9ROvxSMyw5n7KPRhF2.cvfSm.XDB/Dc/UesOaDtU32A9myRPXa', 'customer', 1, '09987654321', '123 Thriller Lane, Gary, Indiana'),
(3, 'Jane Smith', 'jane@example.com', '$2b$10$fWY9ROvxSMyw5n7KPRhF2.cvfSm.XDB/Dc/UesOaDtU32A9myRPXa', 'customer', 1, '09112233445', '456 Neverland Ranch, Los Olivos, California');
