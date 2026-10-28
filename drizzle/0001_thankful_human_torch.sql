ALTER TABLE `rooms` ADD `join_code` text;--> statement-breakpoint
ALTER TABLE `rooms` ADD `visibility` text DEFAULT 'private' NOT NULL;