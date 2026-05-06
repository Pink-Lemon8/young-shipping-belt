ALTER TABLE `belt_queues_pharmacist_review` DROP FOREIGN KEY `fk_pharmacist_id`;
--> statement-breakpoint
ALTER TABLE `belt_queues` DROP FOREIGN KEY `belt_queues_skipped_by_belt_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `belt_queues_history` DROP FOREIGN KEY `belt_queues_history_skipped_by_belt_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `belt_logs` DROP FOREIGN KEY `belt_logs_user_id_belt_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `belt_queues_pharmacist_review` MODIFY COLUMN `pharmacist_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `belt_queues` MODIFY COLUMN `locked_for_user_id` varchar(36);--> statement-breakpoint
ALTER TABLE `belt_queues` MODIFY COLUMN `skipped_by` varchar(36);--> statement-breakpoint
ALTER TABLE `belt_queues_history` MODIFY COLUMN `locked_for_user_id` varchar(36);--> statement-breakpoint
ALTER TABLE `belt_queues_history` MODIFY COLUMN `skipped_by` varchar(36);--> statement-breakpoint
ALTER TABLE `belt_logs` MODIFY COLUMN `user_id` varchar(36);

-- after migrate all user id to varchar(36)
-- --> statement-breakpoint
-- ALTER TABLE `belt_queues_pharmacist_review` ADD CONSTRAINT `fk_pharmacist_id` FOREIGN KEY (`pharmacist_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
-- ALTER TABLE `belt_queues` ADD CONSTRAINT `belt_queues_locked_for_user_id_user_id_fk` FOREIGN KEY (`locked_for_user_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
-- ALTER TABLE `belt_queues` ADD CONSTRAINT `belt_queues_skipped_by_user_id_fk` FOREIGN KEY (`skipped_by`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
-- ALTER TABLE `belt_queues_history` ADD CONSTRAINT `belt_queues_history_locked_for_user_id_user_id_fk` FOREIGN KEY (`locked_for_user_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
-- ALTER TABLE `belt_queues_history` ADD CONSTRAINT `belt_queues_history_skipped_by_user_id_fk` FOREIGN KEY (`skipped_by`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
-- ALTER TABLE `belt_logs` ADD CONSTRAINT `belt_logs_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE cascade;