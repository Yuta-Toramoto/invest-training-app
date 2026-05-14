ALTER TABLE "attempts" ADD COLUMN "xp_earned" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "weekly_goal_xp" integer DEFAULT 100 NOT NULL;