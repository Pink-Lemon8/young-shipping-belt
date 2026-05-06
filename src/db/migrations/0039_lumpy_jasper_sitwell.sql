-- ALTER TABLE `files` ADD `created_by` varchar(36);--> statement-breakpoint
-- ALTER TABLE `order_expected_items` ADD `din` varchar(255);--> statement-breakpoint
-- ALTER TABLE `order_items` ADD `din` varchar(255);--> statement-breakpoint
-- ALTER TABLE `files` ADD CONSTRAINT `files_created_by_user_id_fk` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE cascade;
-- Shipping App is Migrated
COMMIT;