ALTER TABLE `belt_queues_pharmacist_review` DROP FOREIGN KEY `fk_pharmacist_id`;
--> statement-breakpoint
ALTER TABLE `belt_queues_pharmacist_review` ADD CONSTRAINT `fk_pharmacist_id` FOREIGN KEY (`pharmacist_id`) REFERENCES `belt_users`(`id`) ON DELETE no action ON UPDATE cascade;