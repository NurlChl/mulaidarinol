"use client";

import { useRouter } from "next/navigation";
import ConsoleQuiz from "@/components/ConsoleQuiz";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  explanation?: string;
}

interface QuizPageShellProps {
  roadmapSlug: string;
  nodeId: string;
  quiz: {
    _id: string;
    title: string;
    timeLimit: number;
    highestScore?: number | null;
    lastScore?: number | null;
    questions: Question[];
  };
  isLoggedIn: boolean;
  nextNode?: { id: string; label: string; type: string } | null;
}

export default function QuizPageShell({
  roadmapSlug,
  nodeId,
  quiz,
  isLoggedIn,
  nextNode,
}: QuizPageShellProps) {
  const router = useRouter();

  return (
    <ConsoleQuiz
      roadmapSlug={roadmapSlug}
      nodeId={nodeId}
      quiz={quiz}
      isLoggedIn={isLoggedIn}
      nextNode={nextNode}
      onClose={() => router.push(`/roadmaps/${roadmapSlug}/${nodeId}`)}
    />
  );
}
