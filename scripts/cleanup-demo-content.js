#!/usr/bin/env node

/*
  Cleans up demo content across meta DB and Neon:

  1) Fetch all projects from the meta database
  2) Delete all checkpoints for those projects (meta DB)
  3) Delete the corresponding Neon projects via API
  4) Delete all project rows from the meta DB

  Required env vars:
  - DATABASE_URL (meta database)
  - NEON_API_KEY (org-wide API key)

  Usage:
    node scripts/cleanup-demo-content.js
*/

// Load environment variables if a .env file is present
try {
  require("dotenv").config();
} catch {
  // optional
}

(async function main() {
  const apiKey = process.env.NEON_API_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!apiKey) {
    console.error("NEON_API_KEY is required");
    process.exit(1);
  }
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  // Use Neon serverless client to access the meta DB
  /** @type {import('@neondatabase/serverless').neon} */
  let neon;
  try {
    neon = require("@neondatabase/serverless").neon;
  } catch (err) {
    console.error("@neondatabase/serverless is required to run this script");
    throw err;
  }

  const sql = neon(databaseUrl);

  async function listProjects() {
    const rows = await sql`SELECT id, neon_project_id FROM projects`;
    return rows.map((r) => ({ id: r.id, neon_project_id: r.neon_project_id }));
  }

  async function deleteCheckpointsForProject(projectId) {
    await sql`DELETE FROM checkpoints WHERE project_id = ${projectId}`;
  }

  async function deleteNeonProject(neonProjectId) {
    const url = `https://console.neon.tech/api/v2/projects/${encodeURIComponent(
      neonProjectId,
    )}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Failed to delete Neon project ${neonProjectId}: ${res.status} ${text}`,
      );
    }
  }

  async function deleteAllProjects() {
    await sql`DELETE FROM projects`;
  }

  console.log("Listing projects from meta DB...");
  const projects = await listProjects();
  console.log(`Found ${projects.length} project(s).`);

  if (projects.length === 0) {
    console.log("Nothing to clean up.");
    return;
  }

  console.log("Deleting checkpoints for all projects (meta DB)...");
  const cpResults = await Promise.allSettled(
    projects.map((p) => deleteCheckpointsForProject(p.id)),
  );
  const cpFailed = cpResults.filter((r) => r.status === "rejected");
  if (cpFailed.length > 0) {
    console.warn(
      `Failed to delete checkpoints for ${cpFailed.length} project(s):`,
    );
    cpFailed.forEach((r, idx) => {
      const proj = projects[idx];
      console.warn(`  - ${proj?.id}: ${r.reason?.message || r.reason}`);
    });
  }

  console.log("Deleting Neon projects via API...");
  const neonResults = await Promise.allSettled(
    projects.map((p) => deleteNeonProject(p.neon_project_id)),
  );
  const neonFailed = neonResults.filter((r) => r.status === "rejected");
  if (neonFailed.length > 0) {
    console.warn(`Failed to delete ${neonFailed.length} Neon project(s):`);
    neonFailed.forEach((r, idx) => {
      const proj = projects[idx];
      console.warn(
        `  - ${proj?.neon_project_id}: ${r.reason?.message || r.reason}`,
      );
    });
  }

  console.log("Deleting project rows from meta DB...");
  await deleteAllProjects();

  const succeededProjects = projects.length - neonFailed.length;
  console.log(
    `Cleanup complete. Deleted checkpoints and ${succeededProjects}/${projects.length} Neon project(s); cleared projects table.`,
  );
})().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
