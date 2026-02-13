CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TABLE "schedule_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_customer_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "customer_phone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."appointment_status";--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "status" SET DATA TYPE "public"."appointment_status" USING "status"::"public"."appointment_status";--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "start_datetime" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "end_datetime" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "management_token" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "service_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_periods" ADD CONSTRAINT "schedule_periods_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "time_blocks_organization_id_date_idx" ON "time_blocks" USING btree ("organization_id","date");--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_org_start_idx" ON "appointments" USING btree ("organization_id","start_datetime");--> statement-breakpoint
CREATE INDEX "appointments_service_start_idx" ON "appointments" USING btree ("service_id","start_datetime");--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "customer_id";--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "start_time";--> statement-breakpoint
ALTER TABLE "appointments" DROP COLUMN "end_time";--> statement-breakpoint
ALTER TABLE "schedules" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "schedules" DROP COLUMN "start_time";--> statement-breakpoint
ALTER TABLE "schedules" DROP COLUMN "end_time";--> statement-breakpoint
ALTER TABLE "schedules" DROP COLUMN "active";--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_management_token_unique" UNIQUE("management_token");--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_service_id_day_of_week_unique" UNIQUE("service_id","day_of_week");