import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPartnerApplication extends Document {
  userId: mongoose.Types.ObjectId;
  portfolioUrl: string;
  experienceSummary: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerApplicationSchema = new Schema<IPartnerApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    portfolioUrl: { type: String, required: true },
    experienceSummary: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

const PartnerApplication: Model<IPartnerApplication> =
  mongoose.models?.PartnerApplication ||
  mongoose.model<IPartnerApplication>("PartnerApplication", PartnerApplicationSchema);

export default PartnerApplication;
