CREATE TABLE "settings_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"effective_year" integer NOT NULL,
	"effective_month" integer NOT NULL,
	"illetmeny" integer NOT NULL,
	"hours_per_day" numeric(4, 2) NOT NULL,
	"selected_ber" integer DEFAULT -1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_settings_period_user_year_month" UNIQUE("user_id","effective_year","effective_month")
);
--> statement-breakpoint
ALTER TABLE "shifts" ALTER COLUMN "start_time" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shifts" ALTER COLUMN "end_time" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shifts" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shifts" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "settings_periods" ADD CONSTRAINT "settings_periods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;