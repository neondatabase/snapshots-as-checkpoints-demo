CREATE TABLE "checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"snapshot_id" text NOT NULL,
	"next_checkpoint_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"neon_project_id" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_neon_project_id_unique" UNIQUE("neon_project_id")
);
--> statement-breakpoint
-- CREATE TABLE "neon_auth"."users_sync" (
-- 	"raw_json" jsonb NOT NULL,
-- 	"id" text PRIMARY KEY NOT NULL,
-- 	"name" text,
-- 	"email" text,
-- 	"created_at" timestamp with time zone,
-- 	"deleted_at" timestamp with time zone,
-- 	"updated_at" timestamp with time zone
-- );
--> statement-breakpoint
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
-- Retired with legacy Stack Auth. neon_auth.users_sync does not exist on a Managed
-- Better Auth database, so this constraint made a fresh `db:migrate` fail here. 0002
-- drops it on the one database that already had it.
-- ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_user_id_users_sync_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "neon_auth"."users_sync"("id") ON DELETE cascade ON UPDATE no action;