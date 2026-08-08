#!/usr/bin/env node

/*
  Lists all Neon branches for the configured project and deletes all except the one named 'production'.

  Required env vars:
  - NEON_API_KEY
  - NEON_PROJECT_ID (legacy; not used in app runtime)

  Usage:
    node scripts/delete-non-production-branches.js
*/

// Load environment variables if a .env file is present
try {
  require("dotenv").config();
} catch {
  // dotenv is optional; ignore if not installed
}

async function main() {
  const apiKey = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID || process.env.PROJECT_ID;
  const branchNameToKeep = "production";

  if (!apiKey) {
    console.error("NEON_API_KEY is required");
    process.exit(1);
  }
  // For this script, a project id is still required via env when used standalone
  if (!projectId) {
    console.error("NEON_PROJECT_ID or PROJECT_ID is required for this script");
    process.exit(1);
  }

  const baseUrl = `https://console.neon.tech/api/v2/projects/${projectId}`;

  async function listBranches() {
    const url = `${baseUrl}/branches`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to list branches: ${res.status} ${text}`);
    }

    const json = await res.json();
    // Expected shape: { branches: [...] }
    const items = Array.isArray(json)
      ? json
      : json.branches || json.items || json.data || [];

    return items
      .map((b) => ({
        id: b.id || b.branch?.id,
        name: b.name || b.branch?.name,
        created_at: b.created_at || b.branch?.created_at,
        parent_id: b.parent_id || b.branch?.parent_id,
      }))
      .filter((b) => Boolean(b.id));
  }

  async function deleteBranch(branchId) {
    const url = `${baseUrl}/branches/${encodeURIComponent(branchId)}`;
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
        `Failed to delete branch ${branchId}: ${res.status} ${text}`,
      );
    }
  }

  console.log("Fetching branches...");
  const branches = await listBranches();

  if (branches.length === 0) {
    console.log("No branches found.");
    return;
  }

  console.log(`Found ${branches.length} branch(es):`);
  for (const b of branches) {
    console.log(
      `- ${b.id}${b.name ? ` (${b.name})` : ""}${b.created_at ? ` created_at=${b.created_at}` : ""}`,
    );
  }

  const toDelete = branches.filter((b) => b.name !== branchNameToKeep);

  if (toDelete.length === 0) {
    console.log(`Nothing to delete. Only '${branchNameToKeep}' exists.`);
    return;
  }

  console.log(
    `Deleting ${toDelete.length} branch(es) (keeping '${branchNameToKeep}')...`,
  );
  const results = await Promise.allSettled(
    toDelete.map((b) => deleteBranch(b.id)),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - succeeded;

  if (failed > 0) {
    console.log(`${succeeded} branch(es) deleted, ${failed} failed:`);
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.log(
          `  - ${toDelete[i].id}${toDelete[i].name ? ` (${toDelete[i].name})` : ""}: ${r.reason?.message || r.reason}`,
        );
      }
    });
    process.exitCode = 1;
  } else {
    console.log(`All ${succeeded} branch(es) deleted successfully.`);
  }
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
