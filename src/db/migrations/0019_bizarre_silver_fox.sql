ALTER TABLE `package_barcode` DROP FOREIGN KEY `package_barcode_package_id_packages_id_fk`;
--> statement-breakpoint
ALTER TABLE `package_barcode` ADD CONSTRAINT `package_barcode_package_id_packages_id_fk` FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE no action ON UPDATE no action;