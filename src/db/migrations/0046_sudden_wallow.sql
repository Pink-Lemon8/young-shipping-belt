ALTER TABLE `package_barcode` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `package_barcode` MODIFY COLUMN `package_id` int;--> statement-breakpoint
ALTER TABLE `package_barcode` MODIFY COLUMN `barcode` varchar(255);--> statement-breakpoint
ALTER TABLE `package_barcode` ADD `lymlight_package_id` varchar(255);