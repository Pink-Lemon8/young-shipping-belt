ALTER TABLE `belt_queues` DROP FOREIGN KEY `belt_queues_pharmacist_review_by_belt_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `belt_queues_history` DROP FOREIGN KEY `belt_queues_history_pharmacist_review_by_belt_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `belt_queues` DROP COLUMN `pharmacist_review_by`;--> statement-breakpoint
ALTER TABLE `belt_queues` DROP COLUMN `pharmacist_review_at`;--> statement-breakpoint
ALTER TABLE `belt_queues_history` DROP COLUMN `pharmacist_review_by`;--> statement-breakpoint
ALTER TABLE `belt_queues_history` DROP COLUMN `pharmacist_review_at`;