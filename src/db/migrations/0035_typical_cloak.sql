ALTER TABLE `affiliates` MODIFY COLUMN `shipping_preference` varchar(50) DEFAULT 'DEFAULT';--> statement-breakpoint
ALTER TABLE `belt_queues` MODIFY COLUMN `shipping_method` varchar(50) DEFAULT 'DEFAULT';--> statement-breakpoint
ALTER TABLE `belt_queues_history` MODIFY COLUMN `shipping_method` varchar(50) DEFAULT 'DEFAULT';