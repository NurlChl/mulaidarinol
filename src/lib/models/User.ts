import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  role: "user" | "partner" | "admin" | "superadmin";
  password?: string; // Hashed password, used for admin/partner login
  googleId?: string; // Used for Google OAuth login
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    role: {
      type: String,
      enum: ["user", "partner", "admin", "superadmin"],
      default: "user",
    },
    password: { type: String },
    googleId: { type: String },
  },
  { timestamps: true }
);

// Prevent compile error if model is compiled multiple times
const User: Model<IUser> = mongoose.models?.User || mongoose.model<IUser>("User", UserSchema);

export default User;
