import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoadmapNode {
  id: string;
  label: string;
  type: "phase" | "topic" | "quiz" | "challenge";
  parentId?: string;
  x?: number;
  y?: number;
}

export interface IRoadmap extends Document {
  title: string;
  slug: string;
  description: string;
  icon: string; // Lucide icon name, e.g. "Layout"
  color: string; // Tailwind tint or hex string, e.g. "#6366f1"
  isPublished: boolean;
  visibility: "published" | "draft" | "coming_soon";
  creatorId: mongoose.Types.ObjectId;
  nodes: IRoadmapNode[];
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapNodeSchema = new Schema<IRoadmapNode>({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ["phase", "topic", "quiz", "challenge"],
    required: true,
  },
  parentId: { type: String },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
});

const RoadmapSchema = new Schema<IRoadmap>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, default: "Compass" },
    color: { type: String, default: "#6366f1" },
    isPublished: { type: Boolean, default: false },
    visibility: {
      type: String,
      enum: ["published", "draft", "coming_soon"],
      default: "draft",
    },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    nodes: [RoadmapNodeSchema],
  },
  { timestamps: true }
);

const Roadmap: Model<IRoadmap> =
  mongoose.models?.Roadmap || mongoose.model<IRoadmap>("Roadmap", RoadmapSchema);

export default Roadmap;
