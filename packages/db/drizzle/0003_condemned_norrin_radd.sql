ALTER TABLE "documents" ADD COLUMN "department" text DEFAULT 'recorder' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "department" text DEFAULT 'recorder' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "instrument_number";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "book";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "page";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "recorded_date";