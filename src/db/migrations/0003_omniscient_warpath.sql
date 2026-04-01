CREATE TABLE "user_holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"start_hour" integer,
	"end_hour" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "uq_user_holiday_date" UNIQUE("user_id","date")
);
--> statement-breakpoint
ALTER TABLE "user_holidays" ADD CONSTRAINT "user_holidays_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_holidays_user" ON "user_holidays" USING btree ("user_id");