CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dreamId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dreamAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dreamId` int NOT NULL,
	`symbolism` text,
	`emotionalAnalysis` text,
	`psychologicalInsight` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dreamAnalyses_id` PRIMARY KEY(`id`),
	CONSTRAINT `dreamAnalyses_dreamId_unique` UNIQUE(`dreamId`)
);
--> statement-breakpoint
CREATE TABLE `dreams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`dreamDate` timestamp NOT NULL,
	`imageUrl` text,
	`imageKey` text,
	`likesCount` int NOT NULL DEFAULT 0,
	`commentsCount` int NOT NULL DEFAULT 0,
	`favoritesCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dreams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dreamId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dreamId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `dreamId_idx` ON `comments` (`dreamId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `comments` (`userId`);--> statement-breakpoint
CREATE INDEX `dreamId_idx` ON `dreamAnalyses` (`dreamId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `dreams` (`userId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `dreams` (`createdAt`);--> statement-breakpoint
CREATE INDEX `user_dream_idx` ON `favorites` (`userId`,`dreamId`);--> statement-breakpoint
CREATE INDEX `dreamId_idx` ON `favorites` (`dreamId`);--> statement-breakpoint
CREATE INDEX `user_dream_idx` ON `likes` (`userId`,`dreamId`);--> statement-breakpoint
CREATE INDEX `dreamId_idx` ON `likes` (`dreamId`);