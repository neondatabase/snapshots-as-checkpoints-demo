"use client";

import React, { useState } from "react";
import { CheckpointButton } from "@/components/checkpoint-button";
import { useCheckpointActions } from "@/hooks/use-checkpoint-actions";
import { cn } from "@/lib/utils";
import demo from "@/lib/demo";
import invariant from "tiny-invariant";

export type TimelineItem = {
  id: string;
  snapshot_id: string | null;
  isCurrent: boolean;
};

function getVersion(items: TimelineItem[], id: string) {
  const index = items.findIndex((i) => i.id === id);
  const step = demo[index];
  invariant(step, "Step not found");
  return step.version;
}

export function UpdatedCheckpointsTimeline({
  items,
  className,
}: {
  items: TimelineItem[];
  className?: string;
}) {
  const { restoreCheckpoint } = useCheckpointActions();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const handleTimelineClick = (targetId: string) => async () => {
    setPendingItemId(targetId);
    try {
      await restoreCheckpoint(targetId);
    } finally {
      setPendingItemId(null);
    }
  };

  return (
    <div className={className}>
      <div className="text-xs text-[#61646B] dark:text-[#94979E] mb-1 text-center font-medium">
        Version History
      </div>
      <nav
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-lg border border-[#E4E5E7] p-2 dark:border-[#303236]",
        )}
      >
        {items.map((i, idx) => (
        <React.Fragment key={i.id}>
          <CheckpointButton
            pending={pendingItemId === i.id}
            onClick={handleTimelineClick(i.id)}
            pendingText={
              <span className="flex items-center gap-1">
                {getVersion(items, i.id)}
              </span>
            }
            overlayTitle="Restoring checkpoint"
            overlaySteps={[
              {
                label: "Apply snapshot to main branch",
                active: true,
              },
            ]}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              i.isCurrent
                ? "bg-[#00E599]/20 text-[#1a8c66] dark:text-[#00E599]"
                : "hover:bg-[#E4E5E7]/50 dark:hover:bg-[#303236]/50"
            }`}
            variant="ghost"
            size="sm"
          >
            <span>{getVersion(items, i.id)}</span>
          </CheckpointButton>
          {idx < items.length - 1 && <span className="opacity-30">→</span>}
        </React.Fragment>
      ))}
      </nav>
    </div>
  );
}
