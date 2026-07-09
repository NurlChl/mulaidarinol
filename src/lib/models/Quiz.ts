import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

export interface IQuiz extends Document {
  roadmapId: mongoose.Types.ObjectId;
  nodeId: string;
  title: string;
  timeLimit: number; // Time limit in seconds, 0 for no limit
  questions: IQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
  explanation: { type: String },
});

const QuizSchema = new Schema<IQuiz>(
  {
    roadmapId: { type: Schema.Types.ObjectId, ref: "Roadmap", required: true },
    nodeId: { type: String, required: true },
    title: { type: String, required: true },
    timeLimit: { type: Number, default: 0 }, // 0 means unlimited
    questions: [QuestionSchema],
  },
  { timestamps: true }
);

QuizSchema.index({ roadmapId: 1, nodeId: 1 }, { unique: true });

const Quiz: Model<IQuiz> = mongoose.models?.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);

export default Quiz;
