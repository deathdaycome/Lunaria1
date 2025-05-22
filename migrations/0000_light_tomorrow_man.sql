CREATE TABLE "api_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"request_source" text NOT NULL,
	"request_text" text,
	"response_text" text,
	"tokens_in" integer DEFAULT 0,
	"tokens_out" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friends" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"gender" text NOT NULL,
	"birth_date" date NOT NULL,
	"birth_time" time,
	"birth_place" text,
	"zodiac_sign" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "horoscopes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"period" text NOT NULL,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"lucky_numbers" jsonb NOT NULL,
	"compatible_signs" jsonb NOT NULL,
	"is_actual" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"gender" text NOT NULL,
	"birth_date" date NOT NULL,
	"birth_time" time,
	"birth_place" text,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"zodiac_sign" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"subscription_type" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "zodiac_signs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horoscopes" ADD CONSTRAINT "horoscopes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;