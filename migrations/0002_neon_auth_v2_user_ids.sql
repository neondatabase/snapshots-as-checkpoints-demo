-- Legacy Neon Auth (Stack Auth) synced users into neon_auth.users_sync with text ids.
-- Managed Better Auth replaces it with neon_auth.user, whose ids are uuid.
--
-- Managed Better Auth owns the neon_auth schema: it creates, migrates and drops those
-- tables itself. Nothing below touches them, and projects.owner_user_id deliberately
-- keeps no foreign key into them.

-- Every existing row is unreachable after the provider swap. Better Auth mints a fresh
-- uuid per user, so no owner_user_id written by Stack Auth can ever match a session
-- again, and each row's database_url points at a per-user Neon project that has already
-- been deleted. Checkpoints cascade from projects.
DELETE FROM "projects";--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_owner_user_id_users_sync_id_fk";--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "owner_user_id" SET DATA TYPE uuid USING "owner_user_id"::uuid;
