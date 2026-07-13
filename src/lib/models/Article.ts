import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IArticle extends Document {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  coverImage?: string;
  status: "draft" | "published";
  authorId: mongoose.Types.ObjectId;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    summary: { type: String },
    coverImage: { type: String },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
    },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seoTitle: { type: String },
    seoDescription: { type: String },
    seoKeywords: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default models.Article || model<IArticle>("Article", ArticleSchema);
