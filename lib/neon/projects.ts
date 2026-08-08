"use server";

import invariant from "tiny-invariant";
import { waitForOperationsToSettle } from "./operations";

type CreateProjectResponse = {
  project?: { id?: string; name?: string; org_id?: string };
  id?: string;
  connection_uris?: Array<{
    connection_uri?: string;
  }>;
  operations?: Array<{ id?: string }>;
};

export async function createNeonProject(
  name: string,
): Promise<{ neonProjectId: string; databaseUrl: string }> {
  const apiKey = process.env.NEON_API_KEY;
  invariant(apiKey, "NEON_API_KEY is required");
  const orgId = process.env.NEON_ORG_ID;
  invariant(orgId, "NEON_ORG_ID is required");
  const res = await fetch("https://console.neon.tech/api/v2/projects", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ project: { name, org_id: orgId } }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create Neon project: ${res.status} ${text}`);
  }
  const json = (await res.json()) as CreateProjectResponse;
  const neonProjectId = json.project?.id ?? json.id;
  invariant(neonProjectId, "Neon project id missing in create response");
  // An org-scoped key silently creates in its own org and ignores a mismatched
  // org_id. Without this check the demo can quietly fill someone else's org, which
  // is how 45 stray projects accumulated before the org was made explicit.
  invariant(
    json.project?.org_id === orgId,
    `Neon project ${neonProjectId} was created in org ${json.project?.org_id} instead of NEON_ORG_ID (${orgId}). Check that NEON_API_KEY is scoped to that org.`,
  );
  const databaseUrl = json.connection_uris?.[0]?.connection_uri;
  invariant(databaseUrl, "Database URL missing in create response");

  // Wait for control-plane operations (e.g., start compute, create timeline) to complete
  const opIds = (json.operations ?? [])
    .map((o) => o.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  if (opIds.length > 0) {
    await waitForOperationsToSettle(neonProjectId, opIds);
  }

  return { neonProjectId, databaseUrl };
}

export async function deleteNeonProject(neonProjectId: string): Promise<void> {
  const apiKey = process.env.NEON_API_KEY;
  invariant(apiKey, "NEON_API_KEY is required");
  const url = `https://console.neon.tech/api/v2/projects/${neonProjectId}`;
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
