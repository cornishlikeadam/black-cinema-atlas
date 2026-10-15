CREATE TABLE `counters` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `film_cache` (
	`id` integer PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`criteria` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `messages_user_created` ON `messages` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sms_receipts` (
	`sid` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`status` text DEFAULT 'received' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`film_id` integer NOT NULL,
	PRIMARY KEY(`group_id`, `user_id`)
);
