#!/usr/bin/env node

/*
  Lists all Neon snapshots for the configured project and deletes them all.

  Required env vars:
  - NEON_API_KEY
  - NEON_PROJECT_ID (legacy; not used in app runtime)

  Usage:
    node scripts/delete-all-snapshots.js
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

  async function listSnapshots() {
    const url = `${baseUrl}/snapshots`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      // Ensure we do not cache
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to list snapshots: ${res.status} ${text}`);
    }

    const json = await res.json();
    // The API may return { items: [...]} or { snapshots: [...] } or just an array; handle common shapes
    const items = Array.isArray(json)
      ? json
      : json.items || json.snapshots || json.data || [];

    return items
      .map((s) => ({
        id: s.id || s.snapshot?.id || s.snapshot_id || s.snapshotId,
        name: s.name || s.snapshot?.name,
        created_at: s.created_at || s.createdAt || s.snapshot?.created_at,
      }))
      .filter((s) => Boolean(s.id));
  }

  async function deleteSnapshot(snapshotId) {
    const url = `${baseUrl}/snapshots/${encodeURIComponent(snapshotId)}`;
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
        `Failed to delete snapshot ${snapshotId}: ${res.status} ${text}`,
      );
    }
  }

  console.log("Fetching snapshots...");
  const snapshots = await listSnapshots();

  if (snapshots.length === 0) {
    console.log("No snapshots found.");
    return;
  }

  console.log(`Found ${snapshots.length} snapshot(s):`);
  for (const s of snapshots) {
    console.log(
      `- ${s.id}${s.name ? ` (${s.name})` : ""}${s.created_at ? ` created_at=${s.created_at}` : ""}`,
    );
  }

  console.log("Deleting snapshots...");
  const results = await Promise.allSettled(
    snapshots.map((s) => deleteSnapshot(s.id)),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - succeeded;

  if (failed > 0) {
    console.log(`${succeeded} snapshot(s) deleted, ${failed} failed:`);
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.log(`  - ${snapshots[i].id}: ${r.reason?.message || r.reason}`);
      }
    });
    process.exitCode = 1;
  } else {
    console.log(`All ${succeeded} snapshot(s) deleted successfully.`);
  }
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
