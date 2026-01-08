CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dreamId` int NOT NULL,
	`rating` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dreams` ADD `averageRating` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `dreams` ADD `ratingCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `user_dream_rating_idx` ON `ratings` (`userId`,`dreamId`);--> statement-breakpoint
CREATE INDEX `dreamId_rating_idx` ON `ratings` (`dreamId`);