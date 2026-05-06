CREATE TABLE `belt_queues_pharmacist_review` (
	`order_id` varchar(255) NOT NULL,
	`pharmacist_id` int NOT NULL,
	`pharmacist_review_status` enum('PENDING','APPROVED','DENIED') DEFAULT 'PENDING',
	`reason` text,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `belt_queues_pharmacist_review_order_id_pharmacist_id_pk` PRIMARY KEY(`order_id`,`pharmacist_id`)
);
--> statement-breakpoint
ALTER TABLE `belt_queues_pharmacist_review` ADD CONSTRAINT `fk_pharmacist_id` FOREIGN KEY (`pharmacist_id`) REFERENCES `belt_users`(`id`) ON DELETE set null ON UPDATE cascade;