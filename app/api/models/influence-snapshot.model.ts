import mongoose, { type Document, type Model, Schema } from "mongoose";

/**
 * InfluenceSnapshot
 *
 * A point-in-time capture of where a leader stands in Maxwell's 5 Levels of
 * Leadership, persisted after a coaching session. This is the source of truth
 * for the Influence Growth Timeline.
 *
 * There is no auth system in this app, so snapshots are scoped by a stable
 * client-generated `leaderId` (persisted in the browser). This keeps each
 * leader's journey separate without requiring login.
 */
export interface InfluenceSnapshot extends Document {
  leaderId: string;
  level: number;
  levelName: string;
  summary: string;
  capturedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InfluenceSnapshotSchema = new Schema<InfluenceSnapshot>(
  {
    leaderId: { type: String, required: true, index: true },
    level: { type: Number, required: true, min: 1, max: 5 },
    levelName: { type: String, required: true },
    summary: { type: String, default: "" },
    capturedAt: { type: Date, required: true, default: () => new Date(), index: true },
  },
  { timestamps: true, collection: "tbl_influence_snapshots" },
);

InfluenceSnapshotSchema.index({ leaderId: 1, capturedAt: 1 });

export const InfluenceSnapshotModel: Model<InfluenceSnapshot> =
  (mongoose.models.InfluenceSnapshot as Model<InfluenceSnapshot>) ||
  mongoose.model<InfluenceSnapshot>("InfluenceSnapshot", InfluenceSnapshotSchema);
