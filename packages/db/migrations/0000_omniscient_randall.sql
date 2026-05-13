CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_choice_id" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"time_taken_ms" integer,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order" integer NOT NULL,
	"difficulty" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lessons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"xp" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"hearts" integer DEFAULT 5 NOT NULL,
	"last_active_at" timestamp with time zone,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"type" text DEFAULT 'chart' NOT NULL,
	"chart_image_url" text,
	"order_book_image_url" text,
	"volume_image_url" text,
	"prompt" text NOT NULL,
	"choices" jsonb NOT NULL,
	"correct_choice_id" text NOT NULL,
	"explanation" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"difficulty" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"title" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;