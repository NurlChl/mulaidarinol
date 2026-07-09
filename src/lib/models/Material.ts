import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMaterial extends Document {
  roadmapId: mongoose.Types.ObjectId;
  nodeId: string; // References the node.id in Roadmap
  title: string;
  slug: string;
  content: string; // Markdown formatted text
  quizId?: mongoose.Types.ObjectId; // Optional linked quiz
  challengeId?: mongoose.Types.ObjectId; // Optional linked code challenge
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    roadmapId: { type: Schema.Types.ObjectId, ref: "Roadmap", required: true },
    nodeId: { type: String, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    content: { type: String, required: true },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz" },
    challengeId: { type: Schema.Types.ObjectId, ref: "CodeChallenge" },
  },
  { timestamps: true }
);

// Compound index to guarantee only one material per node on a specific roadmap
MaterialSchema.index({ roadmapId: 1, nodeId: 1 }, { unique: true });

const Material: Model<IMaterial> =
  mongoose.models?.Material || mongoose.model<IMaterial>("Material", MaterialSchema);

export default Material;
