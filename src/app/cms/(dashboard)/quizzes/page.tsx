import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Roadmap from "@/lib/models/Roadmap";
import Quiz from "@/lib/models/Quiz";
import CodeChallenge from "@/lib/models/CodeChallenge";
import CmsExerciseEditor from "@/components/CmsExerciseEditor";

export default async function CMSQuizzesPage() {
  const session = await auth();
  await dbConnect();

  let roadmapsDocs = [];

  // Restrict partners to their own roadmaps
  if (session?.user?.role === "partner") {
    roadmapsDocs = await Roadmap.find({ creatorId: session.user.id })
      .select("title nodes")
      .lean();
  } else {
    roadmapsDocs = await Roadmap.find().select("title nodes").lean();
  }

  // 1. Fetch quizzes cache
  const quizzesDocs = await Quiz.find().lean();
  const quizzesCache: Record<string, any> = {};

  quizzesDocs.forEach((q: any) => {
    const key = `${q.roadmapId.toString()}-${q.nodeId}`;
    quizzesCache[key] = {
      _id: q._id.toString(),
      title: q.title,
      timeLimit: q.timeLimit,
      questions: q.questions.map((quest: any) => ({
        id: quest.id,
        questionText: quest.questionText,
        options: quest.options,
        correctOptionIndex: quest.correctOptionIndex,
        explanation: quest.explanation,
      })),
    };
  });

  // 2. Fetch code challenges cache
  const challengesDocs = await CodeChallenge.find().lean();
  const challengesCache: Record<string, any> = {};

  challengesDocs.forEach((c: any) => {
    const key = `${c.roadmapId.toString()}-${c.nodeId}`;
    challengesCache[key] = {
      _id: c._id.toString(),
      title: c.title,
      description: c.description,
      language: c.language,
      initialCode: c.initialCode,
      testCases: c.testCases.map((tc: any) => ({
        inputDescription: tc.inputDescription,
        assertionCode: tc.assertionCode,
        expectedOutput: tc.expectedOutput,
      })),
    };
  });

  const serializedRoadmaps = roadmapsDocs.map((r: any) => ({
    _id: r._id.toString(),
    title: r.title,
    nodes: r.nodes.map((node: any) => ({
      id: node.id,
      label: node.label,
      type: node.type,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Quizzes & Challenges</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Buat ujian pilihan ganda berskala waktu atau tantangan penulisan kode solusi untuk mengevaluasi pemahaman modul.
        </p>
      </div>

      <CmsExerciseEditor
        roadmaps={serializedRoadmaps}
        quizzesCache={quizzesCache}
        challengesCache={challengesCache}
      />
    </div>
  );
}
