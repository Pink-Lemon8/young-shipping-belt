ALTER TABLE `belt_queues` DROP FOREIGN KEY `belt_queues_skipped_by_belt_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `belt_queues_history` DROP FOREIGN KEY `belt_queues_history_skipped_by_belt_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `belt_queues` ADD CONSTRAINT `belt_queues_skipped_by_belt_users_id_fk` FOREIGN KEY (`skipped_by`) REFERENCES `belt_users`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `belt_queues_history` ADD CONSTRAINT `belt_queues_history_skipped_by_belt_users_id_fk` FOREIGN KEY (`skipped_by`) REFERENCES `belt_users`(`id`) ON DELETE set null ON UPDATE cascade;