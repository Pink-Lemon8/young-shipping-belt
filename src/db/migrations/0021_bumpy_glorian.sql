ALTER TABLE `belt_queues` ADD `skipped` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `belt_queues` ADD `skipped_at` timestamp;--> statement-breakpoint
ALTER TABLE `belt_queues` ADD `skipped_by` int;--> statement-breakpoint
ALTER TABLE `belt_queues_history` ADD `skipped` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `belt_queues_history` ADD `skipped_at` timestamp;--> statement-breakpoint
ALTER TABLE `belt_queues_history` ADD `skipped_by` int;--> statement-breakpoint
ALTER TABLE `belt_queues` ADD CONSTRAINT `belt_queues_skipped_by_belt_users_id_fk` FOREIGN KEY (`skipped_by`) REFERENCES `belt_users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `belt_queues_history` ADD CONSTRAINT `belt_queues_history_skipped_by_belt_users_id_fk` FOREIGN KEY (`skipped_by`) REFERENCES `belt_users`(`id`) ON DELETE set null ON UPDATE no action;