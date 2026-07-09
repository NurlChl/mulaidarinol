import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Roadmap from "@/lib/models/Roadmap";
import Material from "@/lib/models/Material";
import Quiz from "@/lib/models/Quiz";
import CodeChallenge from "@/lib/models/CodeChallenge";
import UserProgress from "@/lib/models/UserProgress";
import ConsoleWorkspace from "@/components/ConsoleWorkspace";

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
  if (!roadmap) return { title: "MulaiDariNol" };
  const node = roadmap.nodes.find((n: any) => n.id === nodeId);
  if (!node) return { title: `${roadmap.title} - MulaiDariNol` };
  
  return {
    title: `${node.label} | ${roadmap.title} - MulaiDariNol`,
    description: `Pelajari ${node.label} di alur belajar ${roadmap.title}. Ikuti kuis interaktif dan langsung selesaikan tantangan kodenya.`,
  };
}

export default async function LearningConsolePage({ params }: PageProps) {
  const { slug, nodeId } = await params;
  await dbConnect();

  // 1. Fetch roadmap
  const roadmap = await Roadmap.findOne({ slug });
  if (!roadmap) {
    return notFound();
  }

  // 2. Fetch current node data from roadmap
  const node = roadmap.nodes.find((n) => n.id === nodeId);
  if (!node) {
    return notFound();
  }

  // 3. Get session
  const session = await auth();
  const isLoggedIn = !!session?.user;

  // 4. Fetch user progress completed nodes list
  let completedNodes: string[] = [];
  if (isLoggedIn) {
    const progress = await UserProgress.findOne({
      userId: session.user.id,
      roadmapId: roadmap._id,
    });
    if (progress) {
      completedNodes = progress.completedNodes;
    }
  }

  // 5. Fetch Material
  const materialDoc = await Material.findOne({
    roadmapId: roadmap._id,
    nodeId,
  }).lean();

  // 6. Fetch Quiz (optional)
  const quizDoc = await Quiz.findOne({
    roadmapId: roadmap._id,
    nodeId,
  }).lean();

  let highestQuizScore: number | null = null;
  let lastQuizScore: number | null = null;

  if (isLoggedIn && quizDoc) {
    const progress = await UserProgress.findOne({
      userId: session.user.id,
      roadmapId: roadmap._id,
    });
    if (progress && progress.quizAttempts) {
      const attempts = progress.quizAttempts.filter(
        (a: any) => a.quizId.toString() === quizDoc._id.toString()
      );
      if (attempts.length > 0) {
        highestQuizScore = Math.max(...attempts.map((a: any) => a.score));
        const sortedAttempts = [...attempts].sort(
          (a: any, b: any) => b.completedAt.getTime() - a.completedAt.getTime()
        );
        lastQuizScore = sortedAttempts[0].score;
      }
    }
  }

  // Strip correctOptionIndex to prevent cheating on client
  const safeQuiz = quizDoc
    ? {
        _id: quizDoc._id.toString(),
        title: quizDoc.title,
        timeLimit: quizDoc.timeLimit,
        highestScore: highestQuizScore,
        lastScore: lastQuizScore,
        questions: quizDoc.questions.map((q: any) => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options,
          explanation: q.explanation,
        })),
      }
    : null;

  // 7. Fetch Code Challenge (optional)
  const challengeDoc = await CodeChallenge.findOne({
    roadmapId: roadmap._id,
    nodeId,
  }).lean();

  const safeChallenge = challengeDoc
    ? {
        _id: challengeDoc._id.toString(),
        title: challengeDoc.title,
        description: challengeDoc.description,
        language: challengeDoc.language,
        initialCode: challengeDoc.initialCode,
        testCases: challengeDoc.testCases.map((tc: any) => ({
          inputDescription: tc.inputDescription,
          assertionCode: tc.assertionCode,
          expectedOutput: tc.expectedOutput,
        })),
      }
    : null;

  // Default content if material doc is not seeded yet
  const defaultMarkdownContent = `
# ${node.label}

Materi untuk topik ini sedang dirumuskan oleh kontributor ahli kami. 

Silakan kembali beberapa saat lagi. Jika Anda adalah administrator atau partner pembuat roadmap ini, Anda dapat mengunggah isi materi ini langsung melalui CMS Dashboard.
  `;

  const finalMarkdown = materialDoc?.content || defaultMarkdownContent;

  // Serialize Mongoose docs to plain JS objects for client components safe transit
  const serializedRoadmap = {
    title: roadmap.title,
    slug: roadmap.slug,
    nodes: roadmap.nodes.map((n: any) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      parentId: n.parentId,
    })),
  };

  const serializedNode = {
    id: node.id,
    label: node.label,
    type: node.type,
    parentId: node.parentId,
  };

  return (
    <ConsoleWorkspace
      roadmap={serializedRoadmap}
      currentNode={serializedNode}
      completedNodes={completedNodes}
      materialContent={finalMarkdown}
      safeQuiz={safeQuiz}
      safeChallenge={safeChallenge}
      isLoggedIn={isLoggedIn}
      userRole={session?.user?.role}
    />
  );
}
