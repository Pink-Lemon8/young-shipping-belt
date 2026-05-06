ALTER TABLE `belt_queues` RENAME COLUMN `pharmacist_reviewed` TO `pharmacist_review_status`;--> statement-breakpoint
ALTER TABLE `belt_queues` RENAME COLUMN `pharmacist_reviewed_by` TO `pharmacist_review_by`;--> statement-breakpoint
ALTER TABLE `belt_queues` RENAME COLUMN `pharmacist_reviewed_at` TO `pharmacist_review_at`;--> statement-breakpoint
ALTER TABLE `belt_queues` DROP FOREIGN KEY `belt_queues_pharmacist_reviewed_by_belt_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `belt_queues` ADD CONSTRAINT `belt_queues_pharmacist_review_by_belt_users_id_fk` FOREIGN KEY (`pharmacist_review_by`) REFERENCES `belt_users`(`id`) ON DELETE set null ON UPDATE no action;