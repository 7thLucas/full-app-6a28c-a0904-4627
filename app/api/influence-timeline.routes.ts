/**
 * Influence Growth Timeline routes.
 *
 * Surface (mounted under /api):
 *   POST /api/influence-timeline/snapshots  — persist a session snapshot
 *                                             { leaderId, level, summary?, capturedAt? }
 *   GET  /api/influence-timeline/snapshots  — list a leader's snapshots oldest→newest
 *                                             ?leaderId=<id>
 *
 * Snapshots capture the diagnosed Maxwell level after a coaching session, a
 * timestamp, and a short summary. They power the Progress Timeline screen.
 */

import { Router, type Request, type Response } from "express";
import { createLogger } from "~/lib/logger";
import { InfluenceSnapshotModel } from "./models/influence-snapshot.model";

const logger = createLogger("InfluenceTimelineRoutes");
const router = Router();

const LEVEL_NAMES: Record<number, string> = {
  1: "Position",
  2: "Permission",
  3: "Production",
  4: "People Development",
  5: "Pinnacle",
};

const MAX_SUMMARY_CHARS = 2_000;

router.post("/influence-timeline/snapshots", async (req: Request, res: Response) => {
  const leaderId = typeof req.body?.leaderId === "string" ? req.body.leaderId.trim() : "";
  const levelRaw = req.body?.level;
  const level = typeof levelRaw === "number" ? levelRaw : Number(levelRaw);
  const summaryRaw = typeof req.body?.summary === "string" ? req.body.summary : "";
  const summary = summaryRaw.slice(0, MAX_SUMMARY_CHARS).trim();

  if (!leaderId) {
    return res.status(400).json({ success: false, message: "leaderId is required" });
  }
  if (!Number.isInteger(level) || level < 1 || level > 5) {
    return res
      .status(400)
      .json({ success: false, message: "level must be an integer between 1 and 5" });
  }

  let capturedAt = new Date();
  if (req.body?.capturedAt) {
    const parsed = new Date(req.body.capturedAt);
    if (!Number.isNaN(parsed.getTime())) {
      capturedAt = parsed;
    }
  }

  try {
    const snapshot = await InfluenceSnapshotModel.create({
      leaderId,
      level,
      levelName: LEVEL_NAMES[level] ?? `Level ${level}`,
      summary,
      capturedAt,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: String(snapshot._id),
        leaderId: snapshot.leaderId,
        level: snapshot.level,
        levelName: snapshot.levelName,
        summary: snapshot.summary,
        capturedAt: snapshot.capturedAt,
      },
    });
  } catch (error) {
    logger.error("Failed to create influence snapshot", error);
    return res.status(500).json({ success: false, message: "Failed to save snapshot" });
  }
});

router.get("/influence-timeline/snapshots", async (req: Request, res: Response) => {
  const leaderId = typeof req.query.leaderId === "string" ? req.query.leaderId.trim() : "";
  if (!leaderId) {
    return res.status(400).json({ success: false, message: "leaderId is required" });
  }

  const limit = Math.min(Number(req.query.limit) || 200, 500);

  try {
    const items = await InfluenceSnapshotModel.find({ leaderId })
      .sort({ capturedAt: 1, createdAt: 1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      data: {
        items: items.map((s) => ({
          id: String(s._id),
          leaderId: s.leaderId,
          level: s.level,
          levelName: s.levelName,
          summary: s.summary,
          capturedAt: s.capturedAt,
        })),
        total: items.length,
      },
    });
  } catch (error) {
    logger.error("Failed to list influence snapshots", error);
    return res.status(500).json({ success: false, message: "Failed to load snapshots" });
  }
});

export default router;
