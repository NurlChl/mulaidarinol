import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuizAttempt {
  quizId: mongoose.Types.ObjectId;
  score: number; // Percentage or correct count
  passed: boolean;
  timeSpent: number; // in seconds
  completedAt: Date;
}

export interface IChallengeSubmission {
  challengeId: mongoose.Types.ObjectId;
  code: string;
  passed: boolean;
  completedAt: Date;
}

export interface IUserProgress extends Document {
  userId: mongoose.Types.ObjectId;
  roadmapId: mongoose.Types.ObjectId;
  completedNodes: string[]; // List of completed nodeIds (e.g. ['html-basics', 'css-grid'])
  quizAttempts: IQuizAttempt[];
  challengeSubmissions: IChallengeSubmission[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>({
  quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
  score: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  timeSpent: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
});

const ChallengeSubmissionSchema = new Schema<IChallengeSubmission>({
  challengeId: { type: Schema.Types.ObjectId, ref: "CodeChallenge", required: true },
  code: { type: String, required: true },
  passed: { type: Boolean, required: true },
  completedAt: { type: Date, default: Date.now },
});

const UserProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roadmapId: { type: Schema.Types.ObjectId, ref: "Roadmap", required: true },
    completedNodes: [{ type: String }],
    quizAttempts: [QuizAttemptSchema],
    challengeSubmissions: [ChallengeSubmissionSchema],
  },
  { timestamps: true }
);

// Guarantee only one progress document per user per roadmap
UserProgressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

const UserProgress: Model<IUserProgress> =
  mongoose.models?.UserProgress || mongoose.model<IUserProgress>("UserProgress", UserProgressSchema);

export default UserProgress;
