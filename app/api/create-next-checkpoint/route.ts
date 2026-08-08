import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import {
  createNextCheckpoint,
  getLatestProjectForUser,
  listCheckpoints,
} from "@/lib/checkpoints";
import getProductionBranch from "@/lib/neon/branches";
import { applySnapshot } from "@/lib/neon/apply-snapshot";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not signed in" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const { nextStepId, targetId, checkpointId } = body;

  const project = await getLatestProjectForUser(user.id);

  if (!project) {
    return NextResponse.json(
      { success: false, error: "No project found for user" },
      { status: 404 },
    );
  }

  // Case 1: Create new checkpoint from nextStepId and checkpointId
  if (typeof nextStepId === "string" && typeof checkpointId === "string") {
    try {
      const created = await createNextCheckpoint(checkpointId, nextStepId);
      return NextResponse.json({
        success: true,
        checkpointId: created.id,
      });
    } catch (error) {
      console.error("Error creating next checkpoint:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create next checkpoint" },
        { status: 500 },
      );
    }
  }

  // Case 2: Navigate to existing checkpoint (targetId)
  if (typeof targetId === "string") {
    try {
      const [allCheckpoints, prodBranch] = await Promise.all([
        listCheckpoints(project.id),
        getProductionBranch(project.neonProjectId),
      ]);

      if (!prodBranch) {
        throw new Error("Production branch not found");
      }

      const target = allCheckpoints.find((c) => c.id === targetId);
      if (!target) {
        return NextResponse.json(
          { success: false, error: "Target checkpoint not found" },
          { status: 404 },
        );
      }

      await applySnapshot(
        project.neonProjectId,
        target.snapshot_id,
        prodBranch.id,
      );

      return NextResponse.json({
        success: true,
        checkpointId: target.id,
      });
    } catch (error) {
      console.error("Error navigating to checkpoint:", error);
      return NextResponse.json(
        { success: false, error: "Failed to navigate to checkpoint" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: "Either (nextStepId and checkpointId) or targetId is required",
    },
    { status: 400 },
  );
}
