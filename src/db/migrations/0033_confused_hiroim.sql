CREATE TABLE `order_expected_items` (
	`order_id` varchar(255) NOT NULL,
	`package_id` varchar(255) NOT NULL,
	`description` varchar(255),
	`quantity` int NOT NULL,
	`unit_price` decimal(8,2),
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
