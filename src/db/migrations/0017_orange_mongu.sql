CREATE TABLE `countries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`code_two` varchar(3),
	`code_three` varchar(3),
	CONSTRAINT `countries_id` PRIMARY KEY(`id`),
	CONSTRAINT `countries_code_two_unique` UNIQUE(`code_two`),
	CONSTRAINT `countries_code_three_unique` UNIQUE(`code_three`)
);
--> statement-breakpoint
CREATE TABLE `drug_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`country_id` int,
	`exportable` boolean NOT NULL,
	`prescription_required` boolean NOT NULL,
	`always_consult` boolean NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drug_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drugs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`drug_family_name` varchar(255),
	`strength_free_form` varchar(255),
	`form` varchar(255),
	`ingredient` json,
	`schedule_id` int,
	`manufacturer_id` int,
	`generic` boolean DEFAULT true,
	`din` varchar(255),
	`comments` json,
	`pw_condition_id` varchar(255),
	`pw_condition_name` varchar(255),
	`species` json,
	`dosage_form` varchar(255),
	`fridge` boolean DEFAULT false,
	`status` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drugs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manufacturers` (
	`id` int NOT NULL,
	`name` varchar(255),
	`address` json,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `manufacturers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`order_id` varchar(255) NOT NULL,
	`package_id` varchar(255) NOT NULL,
	`lot_number` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `order_items_order_id_package_id_lot_number_pk` PRIMARY KEY(`order_id`,`package_id`,`lot_number`)
);
--> statement-breakpoint
CREATE TABLE `package_barcode` (
	`package_id` int NOT NULL,
	`barcode` varchar(255) NOT NULL,
	CONSTRAINT `package_barcode_package_id_barcode_pk` PRIMARY KEY(`package_id`,`barcode`)
);
--> statement-breakpoint
CREATE TABLE `package_extras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`package_id` int,
	`fda_approval_year` year,
	`condition_treated` varchar(255),
	`ndc_11` varchar(255),
	`din` varchar(255),
	CONSTRAINT `package_extras_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drug_id` int,
	`product` varchar(255),
	`ndc` json,
	`origin_country_id` int,
	`upc` varchar(255),
	`packaging_free_form` varchar(255),
	`unit` varchar(255) NOT NULL,
	`package_quantity` decimal(8,2) NOT NULL,
	`minitemqty` int DEFAULT 0,
	`maxitemqty` int DEFAULT 0,
	`comments` json,
	`created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `drug_schedules` ADD CONSTRAINT `drug_schedules_country_id_countries_id_fk` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drugs` ADD CONSTRAINT `drugs_schedule_id_drug_schedules_id_fk` FOREIGN KEY (`schedule_id`) REFERENCES `drug_schedules`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `package_barcode` ADD CONSTRAINT `package_barcode_package_id_packages_id_fk` FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `packages` ADD CONSTRAINT `packages_drug_id_drugs_id_fk` FOREIGN KEY (`drug_id`) REFERENCES `drugs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `packages` ADD CONSTRAINT `packages_origin_country_id_countries_id_fk` FOREIGN KEY (`origin_country_id`) REFERENCES `countries`(`id`) ON DELETE set null ON UPDATE no action;