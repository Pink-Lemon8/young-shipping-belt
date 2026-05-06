CREATE TABLE `files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`custom_id` varchar(255),
	`url` varchar(255),
	`key` varchar(255) NOT NULL,
	`name` varchar(255),
	`size` int DEFAULT 0,
	`type` varchar(255),
	`hash` varchar(255),
	`description` text,
	`is_public` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `affiliates` DROP FOREIGN KEY `affiliates_created_by_belt_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `belt_queues` DROP FOREIGN KEY `belt_queues_affiliate_id_affiliates_id_fk`;
--> statement-breakpoint
ALTER TABLE `belt_queues_history` DROP FOREIGN KEY `belt_queues_history_affiliate_id_affiliates_id_fk`;
--> statement-breakpoint
ALTER TABLE `belt_queues` ADD `patient_name` varchar(255);--> statement-breakpoint
ALTER TABLE `belt_queues_history` ADD `patient_name` varchar(255);--> statement-breakpoint
ALTER TABLE `belt_queues` ADD CONSTRAINT `belt_queues_affiliate_id_affiliates_id_fk` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `belt_queues_history` ADD CONSTRAINT `belt_queues_history_affiliate_id_affiliates_id_fk` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates`(`id`) ON DELETE set null ON UPDATE cascade;