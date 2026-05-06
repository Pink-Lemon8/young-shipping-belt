ALTER TABLE `belt_queues` DROP COLUMN `locked_for_pharmacist_user_id`;--> statement-breakpoint
ALTER TABLE `belt_queues` DROP COLUMN `locked_for_pharmacist_at`;--> statement-breakpoint
ALTER TABLE `belt_queues_history` DROP COLUMN `locked_for_pharmacist_user_id`;--> statement-breakpoint
ALTER TABLE `belt_queues_history` DROP COLUMN `locked_for_pharmacist_at`;