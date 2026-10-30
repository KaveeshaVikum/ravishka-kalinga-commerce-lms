CREATE TABLE `assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`instructions` text NOT NULL,
	`dueAt` timestamp,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `addressLine1` varchar(180);--> statement-breakpoint
ALTER TABLE `users` ADD `addressLine2` varchar(180);--> statement-breakpoint
ALTER TABLE `users` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `postalCode` varchar(20);--> statement-breakpoint
UPDATE `users` SET `profileCompleted` = 0 WHERE `role` = 'user' AND `profileCompleted` = 1 AND (`addressLine1` IS NULL OR `city` IS NULL);
