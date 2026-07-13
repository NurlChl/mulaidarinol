import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Roadmap from "@/lib/models/Roadmap";
import Quiz from "@/lib/models/Quiz";
import UserProgress from "@/lib/models/UserProgress";
import QuizPageShell from "@/components/QuizPageShell";

interface RoadmapNodeLike {
  id: string;
  label: string;
  type: string;
}

interface QuizAttemptLike {
  quizId: { toString(): string };
  score: number;
  completedAt: Date;
}

interface QuizQuestionLike {
  id: string;
  questionText: string;
  options: string[];
  explanation?: string;
}

interface PageProps {
  params: Promise<{
    slug: string;
    nodeId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, nodeId } = await params;
  await dbConnect();

  const roadmap = await Roadmap.findOne({ slug }).lean();
  if (!roadmap) return { title: "Ujian Kuis - MulaiDariNol" };

  const node = (roadmap.nodes as RoadmapNodeLike[]).find((n) => n.id === nodeId);
  return {
    title: `${node?.label || "Ujian Kuis"} | ${roadmap.title} - MulaiDariNol`,
  };
}

export default async function QuizFocusPage({ params }: PageProps) {
  const { slug, nodeId } = await params;
  await dbConnect();

  const roadmap = await Roadmap.findOne({ slug });
  const isAccessible =
    roadmap &&
    (roadmap.visibility === "published" || (!roadmap.visibility && roadmap.isPublished));
  if (!isAccessible) notFound();

  const node = roadmap.nodes.find((n) => n.id === nodeId);
  if (!node) notFound();

  const quizDoc = await Quiz.findOne({
    roadmapId: roadmap._id,
    nodeId,
  }).lean();

  if (!quizDoc) notFound();

  const session = await auth();
  if (!session || !session.user) {
    const callbackUrl = `/roadmaps/${slug}/${nodeId}/quiz`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const isLoggedIn = true;
  let highestQuizScore: number | null = null;
  let lastQuizScore: number | null = null;

  if (isLoggedIn) {
    const progress = await UserProgress.findOne({
      userId: session.user.id,
      roadmapId: roadmap._id,
    });

    if (progress?.quizAttempts) {
      const attempts = (progress.quizAttempts as QuizAttemptLike[]).filter(
        (a) => a.quizId.toString() === quizDoc._id.toString()
      );

      if (attempts.length > 0) {
        highestQuizScore = Math.max(...attempts.map((a) => a.score));
        const sortedAttempts = [...attempts].sort(
          (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
        );
        lastQuizScore = sortedAttempts[0].score;
      }
    }
  }

  const topics = (roadmap.nodes as RoadmapNodeLike[]).filter((n) => n.type !== "phase");
  const currentIdx = topics.findIndex((topic) => topic.id === nodeId);
  const nextNode = currentIdx >= 0 && currentIdx < topics.length - 1
    ? {
        id: topics[currentIdx + 1].id,
        label: topics[currentIdx + 1].label,
        type: topics[currentIdx + 1].type,
      }
    : null;

  const safeQuiz = {
    _id: quizDoc._id.toString(),
    title: quizDoc.title,
    timeLimit: quizDoc.timeLimit,
    highestScore: highestQuizScore,
    lastScore: lastQuizScore,
    questions: (quizDoc.questions as QuizQuestionLike[]).map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      explanation: q.explanation,
    })),
  };

  return (
    <QuizPageShell
      roadmapSlug={roadmap.slug}
      nodeId={nodeId}
      quiz={safeQuiz}
      isLoggedIn={isLoggedIn}
      nextNode={nextNode}
    />
  );
}
