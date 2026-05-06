CREATE INDEX `locked_for_user_id_idx` ON `belt_queues` (`locked_for_user_id`);--> statement-breakpoint
CREATE INDEX `order_id_idx` ON `belt_queues` (`order_id`);--> statement-breakpoint
CREATE INDEX `queue_lookup_idx` ON `belt_queues` (`locked_for_user_id`,`status`,`belt_code`,`skipped`);--> statement-breakpoint
CREATE INDEX `user_action_created_idx` ON `belt_logs` (`user_id`,`action`,`created_at`);--> statement-breakpoint
CREATE INDEX `order_action_idx` ON `belt_logs` (`order_id`,`action`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `belt_logs` (`user_id`);