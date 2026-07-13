import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Code2 } from "lucide-react";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Roadmap from "@/lib/models/Roadmap";
import CodeChallenge from "@/lib/models/CodeChallenge";
import ConsoleEditor from "@/components/ConsoleEditor";
import { ThemeToggle } from "@/components/ThemeToggle";

interface RoadmapNodeLike {
  id: string;
  label: string;
}

interface ChallengeTestCaseLike {
  inputDescription: string;
  assertionCode: string;
  expectedOutput: string;
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
  if (!roadmap) return { title: "Code Challenge - MulaiDariNol" };

  const node = (roadmap.nodes as RoadmapNodeLike[]).find((n) => n.id === nodeId);
  return {
    title: `${node?.label || "Code Challenge"} | ${roadmap.title} - MulaiDariNol`,
  };
}

export default async function ChallengeFocusPage({ params }: PageProps) {
  const { slug, nodeId } = await params;
  await dbConnect();

  const roadmap = await Roadmap.findOne({ slug });
  const isAccessible =
    roadmap &&
    (roadmap.visibility === "published" || (!roadmap.visibility && roadmap.isPublished));
  if (!isAccessible) notFound();

  const node = roadmap.nodes.find((n) => n.id === nodeId);
  if (!node) notFound();

  const challengeDoc = await CodeChallenge.findOne({
    roadmapId: roadmap._id,
    nodeId,
  }).lean();

  if (!challengeDoc) notFound();

  const session = await auth();
  if (!session || !session.user) {
    const callbackUrl = `/roadmaps/${slug}/${nodeId}/challenge`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const safeChallenge = {
    _id: challengeDoc._id.toString(),
    title: challengeDoc.title,
    description: challengeDoc.description,
    language: challengeDoc.language,
    initialCode: challengeDoc.initialCode,
    testCases: (challengeDoc.testCases as ChallengeTestCaseLike[]).map((tc) => ({
      inputDescription: tc.inputDescription,
      assertionCode: tc.assertionCode,
      expectedOutput: tc.expectedOutput,
    })),
  };

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-3 py-2 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/roadmaps/${roadmap.slug}/${nodeId}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-border bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Kembali ke materi"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Code2 className="h-3.5 w-3.5" />
              Code Challenge
            </div>
            <h1 className="truncate text-sm font-extrabold text-foreground sm:text-base">
              {challengeDoc.title || node.label}
            </h1>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="min-h-0 flex-1 overflow-hidden p-2 sm:p-3">
        <ConsoleEditor
          roadmapSlug={roadmap.slug}
          nodeId={nodeId}
          challenge={safeChallenge}
          isLoggedIn={true}
        />
      </main>
    </div>
  );
}
