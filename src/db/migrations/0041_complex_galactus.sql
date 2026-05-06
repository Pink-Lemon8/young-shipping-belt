CREATE INDEX `belt_code_idx` ON `belt_queues` (`belt_code`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `belt_queues` (`status`);--> statement-breakpoint
CREATE INDEX `patient_id_idx` ON `belt_queues` (`patient_id`);--> statement-breakpoint
CREATE INDEX `tracking_number_idx` ON `belt_queues` (`tracking_number`);--> statement-breakpoint
CREATE INDEX `label_created_at_idx` ON `belt_queues` (`label_created_at`);--> statement-breakpoint
CREATE INDEX `belt_code_status_idx` ON `belt_queues` (`belt_code`,`status`);