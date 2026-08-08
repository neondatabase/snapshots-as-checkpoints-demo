"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signInUrl } from "@/lib/auth/sign-in-url";

type PendingState =
  | "idle"
  | "create-project"
  | "restore-checkpoint"
  | "create-next-checkpoint";

interface UseCheckpointActionsReturn {
  pending: PendingState;
  createNewProject: () => Promise<void>;
  restoreCheckpoint: (targetId: string) => Promise<void>;
  createNextCheckpoint: (params: {
    nextStepId?: string;
    checkpointId?: string;
    targetId?: string;
  }) => Promise<void>;
}

export function useCheckpointActions(): UseCheckpointActionsReturn {
  const [pending, setPending] = useState<PendingState>("idle");
  const router = useRouter();
  const pathname = usePathname();

  // The session can end while a tab is open — signing out elsewhere, or an expiry.
  // The action routes answer 401 for that, and a button that quietly does nothing is
  // worse than the redirect it replaced.
  const handleSignedOut = (response: Response) => {
    if (response.status !== 401) return false;
    router.push(signInUrl(pathname));
    return true;
  };

  const createNewProject = async () => {
    if (pending !== "idle") return;

    setPending("create-project");
    try {
      const response = await fetch("/api/create-new-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (handleSignedOut(response)) return;

      const result = await response.json();

      if (result.success && result.checkpointId) {
        router.push(`/${result.checkpointId}`);
      } else {
        throw new Error(result.error || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      // TODO: Add proper error handling/toast notifications
    } finally {
      setPending("idle");
    }
  };

  const restoreCheckpoint = async (targetId: string) => {
    if (pending !== "idle") return;

    setPending("restore-checkpoint");
    try {
      const response = await fetch("/api/restore-checkpoint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetId }),
      });

      if (handleSignedOut(response)) return;

      const result = await response.json();

      if (result.success && result.checkpointId) {
        router.push(`/${result.checkpointId}`);
      } else {
        throw new Error(result.error || "Failed to restore checkpoint");
      }
    } catch (error) {
      console.error("Error restoring checkpoint:", error);
      // TODO: Add proper error handling/toast notifications
    } finally {
      setPending("idle");
    }
  };

  const createNextCheckpoint = async (params: {
    nextStepId?: string;
    checkpointId?: string;
    targetId?: string;
  }) => {
    if (pending !== "idle") return;

    setPending("create-next-checkpoint");
    try {
      const response = await fetch("/api/create-next-checkpoint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (handleSignedOut(response)) return;

      const result = await response.json();

      if (result.success && result.checkpointId) {
        router.push(`/${result.checkpointId}`);
      } else {
        throw new Error(result.error || "Failed to create next checkpoint");
      }
    } catch (error) {
      console.error("Error creating next checkpoint:", error);
      // TODO: Add proper error handling/toast notifications
    } finally {
      setPending("idle");
    }
  };

  return {
    pending,
    createNewProject,
    restoreCheckpoint,
    createNextCheckpoint,
  };
}
