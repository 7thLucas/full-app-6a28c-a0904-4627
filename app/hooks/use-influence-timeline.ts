import { useCallback, useEffect, useState } from "react";
import { apiRequest, apiGet } from "~/lib/api.client";
import { getLeaderId } from "~/lib/leader-id";

export interface InfluenceSnapshotView {
  id: string;
  leaderId: string;
  level: number;
  levelName: string;
  summary: string;
  capturedAt: string;
}

interface SnapshotListResponse {
  items: InfluenceSnapshotView[];
  total: number;
}

export interface SaveSnapshotInput {
  level: number;
  summary?: string;
  capturedAt?: string;
}

/**
 * Persist a single session snapshot for the current leader.
 * Returns the created snapshot, or null on failure.
 */
export async function saveSnapshot(
  input: SaveSnapshotInput,
): Promise<InfluenceSnapshotView | null> {
  const leaderId = getLeaderId();
  if (!leaderId) return null;

  const res = await apiRequest<InfluenceSnapshotView>(
    "/api/influence-timeline/snapshots",
    {
      method: "POST",
      data: {
        leaderId,
        level: input.level,
        summary: input.summary ?? "",
        capturedAt: input.capturedAt,
      },
    },
  );

  return res.success && res.data ? res.data : null;
}

/**
 * Load (and refresh) the current leader's timeline of snapshots.
 */
export function useInfluenceTimeline() {
  const [snapshots, setSnapshots] = useState<InfluenceSnapshotView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const leaderId = getLeaderId();
    if (!leaderId) {
      setSnapshots([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const res = await apiGet<SnapshotListResponse>(
      "/api/influence-timeline/snapshots",
      { leaderId },
    );

    if (res.success && res.data) {
      setSnapshots(res.data.items);
    } else {
      setError(res.message ?? "Failed to load your timeline");
      setSnapshots([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { snapshots, loading, error, refresh };
}
