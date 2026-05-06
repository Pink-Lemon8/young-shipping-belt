ALTER TABLE `belt_queues` MODIFY COLUMN `order_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `belt_queues` MODIFY COLUMN `patient_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `belt_queues` ADD CONSTRAINT `belt_queues_order_id_unique` UNIQUE(`order_id`);