ALTER TABLE `users` ADD `phone` varchar(30);--> statement-breakpoint
ALTER TABLE `users` ADD `school` varchar(180);--> statement-breakpoint
ALTER TABLE `users` ADD `grade` varchar(40);--> statement-breakpoint
ALTER TABLE `users` ADD `district` varchar(80);--> statement-breakpoint
ALTER TABLE `users` ADD `profileCompleted` int DEFAULT 0 NOT NULL;