CREATE TABLE `belt_queues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`belt_code` varchar(3),
	`batch_id` int NOT NULL,
	`affiliate_id` int,
	`order_id` int NOT NULL,
	`patient_id` int NOT NULL,
	`tracking_number` varchar(255),
	`transaction_id` varchar(255),
	`locked_for_user_id` int,
	`locked_at` timestamp,
	`label` json,
	`label_created_at` timestamp,
	`files` json,
	`extra_files` json,
	`extra_files_created_at` timestamp,
	`images` json,
	`box_size_id` int,
	`status` enum('SENT_TO_BELT','STAGE1','STAGE2','STAGE3','COMPLETED','FAILED') DEFAULT 'SENT_TO_BELT',
	`comments` json,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `belt_queues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `box_sizes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('COLD_CHAIN','DRY_MEDS','DEFAULT') DEFAULT 'DEFAULT',
	`h` decimal(8,2) NOT NULL,
	`w` decimal(8,2) NOT NULL,
	`l` decimal(8,2) NOT NULL,
	`description` varchar(255),
	`status` enum('PENDING','ACTIVE','INACTIVE','SUSPENDED') DEFAULT 'ACTIVE',
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `box_sizes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `belt_queues` ADD CONSTRAINT `belt_queues_affiliate_id_affiliates_id_fk` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `belt_queues` ADD CONSTRAINT `belt_queues_box_size_id_box_sizes_id_fk` FOREIGN KEY (`box_size_id`) REFERENCES `box_sizes`(`id`) ON DELETE set null ON UPDATE no action;