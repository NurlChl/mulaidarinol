import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVerificationCode extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  purpose: "password_reset" | "email_change";
  createdAt: Date;
  updatedAt: Date;
}

const VerificationCodeSchema = new Schema<IVerificationCode>(
  {
    email: { type: String, required: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Auto-delete document after expiration
    purpose: {
      type: String,
      enum: ["password_reset", "email_change"],
      required: true,
    },
  },
  { timestamps: true }
);

const VerificationCode: Model<IVerificationCode> =
  mongoose.models?.VerificationCode ||
  mongoose.model<IVerificationCode>("VerificationCode", VerificationCodeSchema);

export default VerificationCode;
