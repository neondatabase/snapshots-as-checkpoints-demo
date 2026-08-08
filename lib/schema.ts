import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const projectsTable = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  neonProjectId: text("neon_project_id").notNull().unique(),
  databaseUrl: text("database_url").notNull(),
  // Managed Better Auth owns neon_auth.user, so this deliberately carries no
  // foreign key: drizzle-kit must not generate DDL against a schema the auth
  // provider creates, drops, and migrates on its own.
  ownerUserId: uuid("owner_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const checkpointsTable = pgTable("checkpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projectsTable.id, {
      onDelete: "cascade",
    }),
  prompt: text("prompt").notNull(),
  snapshotId: text("snapshot_id").notNull(),
  nextCheckpointId: uuid("next_checkpoint_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
