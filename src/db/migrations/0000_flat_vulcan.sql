CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(25) NOT NULL,
	`pw_auth_username` varchar(255),
	`pw_auth_password` varchar(255),
	`pw_local` boolean DEFAULT true,
	`category` enum('WHOLE_SALE','PARTNER','PBM','DEFAULT') DEFAULT 'DEFAULT',
	`shipping_preference` enum('FEDEX','CANADA_POST','UPS','DEFAULT') DEFAULT 'DEFAULT',
	`status` enum('PENDING','ACTIVE','INACTIVE','SUSPENDED') DEFAULT 'PENDING',
	`created_by` int,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliates_name_unique` UNIQUE(`name`),
	CONSTRAINT `affiliates_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `belt__config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(255) NOT NULL,
	`value` json NOT NULL,
	`description` text,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `belt__config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `belt__logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`belt_code` varchar(3),
	`action` varchar(255),
	`description` text,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `belt__logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `belt_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`login_type` enum('CREDENTIAL','GOOGLE','APPLE') DEFAULT 'CREDENTIAL',
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`password` varchar(255) NOT NULL,
	`role` enum('ADMIN','COORDINATOR','PHARMACIST','BELT') DEFAULT 'BELT',
	`email_verify_token` varchar(255),
	`email_verified_at` timestamp,
	`remember_token` varchar(100),
	`remember_token_created_at` timestamp,
	`forget_password_token` varchar(100),
	`forget_password_token_created_at` timestamp,
	`status` enum('PENDING','ACTIVE','INACTIVE','SUSPENDED') DEFAULT 'PENDING',
	`created_by` int,
	`belt_code` varchar(3),
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `belt_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `belt_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `affiliates` ADD CONSTRAINT `affiliates_created_by_belt_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `belt_users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `belt__logs` ADD CONSTRAINT `belt__logs_user_id_belt_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `belt_users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `belt_users` ADD CONSTRAINT `belt_users_created_by_belt_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `belt_users`(`id`) ON DELETE set null ON UPDATE no action;