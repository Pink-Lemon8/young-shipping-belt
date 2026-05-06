CREATE TABLE `belt_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(255) NOT NULL,
	`value` json NOT NULL,
	`description` text,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `belt_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `belt_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`belt_code` varchar(3),
	`action` varchar(255),
	`description` text,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `belt_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `belt__config`;--> statement-breakpoint
DROP TABLE `belt__logs`;--> statement-breakpoint
ALTER TABLE `belt_logs` ADD CONSTRAINT `belt_logs_user_id_belt_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `belt_users`(`id`) ON DELETE set null ON UPDATE no action;