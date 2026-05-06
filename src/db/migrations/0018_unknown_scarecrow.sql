CREATE TABLE `belt_queues_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`belt_code` varchar(3),
	`batch_id` int NOT NULL,
	`affiliate_id` int,
	`order_id` varchar(255),
	`patient_id` varchar(255) NOT NULL,
	`shipping_method` enum('FEDEX','CANADA_POST','UPS','DEFAULT') DEFAULT 'DEFAULT',
	`tracking_number` varchar(255),
	`transaction_id` varchar(255),
	`locked_for_user_id` int,
	`locked_at` timestamp,
	`locked_for_pharmacist_user_id` int,
	`locked_for_pharmacist_at` timestamp,
	`label` json,
	`label_created_at` timestamp,
	`files` json,
	`extra_files` json,
	`extra_files_created_at` timestamp,
	`images` json,
	`box_size_id` int,
	`status` enum('SENT_TO_BELT','STAGE1','STAGE2','STAGE3','COMPLETED','FAILED') DEFAULT 'SENT_TO_BELT',
	`comments` json,
	`cage_code` varchar(255),
	`pharmacist_review_status` enum('PENDING','APPROVED','DENIED') DEFAULT 'PENDING',
	`pharmacist_review_by` int,
	`pharmacist_review_at` timestamp,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `belt_queues_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `belt_queues_history` ADD CONSTRAINT `belt_queues_history_affiliate_id_affiliates_id_fk` FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `belt_queues_history` ADD CONSTRAINT `belt_queues_history_box_size_id_box_sizes_id_fk` FOREIGN KEY (`box_size_id`) REFERENCES `box_sizes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `belt_queues_history` ADD CONSTRAINT `belt_queues_history_pharmacist_review_by_belt_users_id_fk` FOREIGN KEY (`pharmacist_review_by`) REFERENCES `belt_users`(`id`) ON DELETE set null ON UPDATE no action;