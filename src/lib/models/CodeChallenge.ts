import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITestCase {
  inputDescription: string;
  assertionCode: string; // JavaScript assertion statement, e.g. "typeof sum === 'function' && sum(2, 3) === 5"
  expectedOutput: string;
}

export interface ICodeChallenge extends Document {
  roadmapId: mongoose.Types.ObjectId;
  nodeId: string;
  title: string;
  description: string; // Markdown text explaining the task
  language: "javascript" | "html" | "css";
  initialCode: string;
  testCases: ITestCase[];
  createdAt: Date;
  updatedAt: Date;
}

const TestCaseSchema = new Schema<ITestCase>({
  inputDescription: { type: String, required: true },
  assertionCode: { type: String, required: true },
  expectedOutput: { type: String, required: true },
});

const CodeChallengeSchema = new Schema<ICodeChallenge>(
  {
    roadmapId: { type: Schema.Types.ObjectId, ref: "Roadmap", required: true },
    nodeId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    language: { type: String, enum: ["javascript", "html", "css"], default: "javascript" },
    initialCode: { type: String, default: "" },
    testCases: [TestCaseSchema],
  },
  { timestamps: true }
);

CodeChallengeSchema.index({ roadmapId: 1, nodeId: 1 }, { unique: true });

const CodeChallenge: Model<ICodeChallenge> =
  mongoose.models?.CodeChallenge || mongoose.model<ICodeChallenge>("CodeChallenge", CodeChallengeSchema);

export default CodeChallenge;
