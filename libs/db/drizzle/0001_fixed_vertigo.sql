CREATE TYPE "public"."plan_interest" AS ENUM('essential', 'professional');--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"plan_interest" "plan_interest" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
