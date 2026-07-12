import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Roadmap from "@/lib/models/Roadmap";
import UserProgress from "@/lib/models/UserProgress";
import RoadmapCanvas from "@/components/RoadmapCanvas";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Compass, BookOpen, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  await dbConnect();
  const roadmap = await Roadmap.findOne({ slug }).lean();
  if (!roadmap) {
    return { title: "Roadmap Tidak Ditemukan - MulaiDariNol" };
  }
  return {
    title: `${roadmap.title} Career Roadmap 2026 - MulaiDariNol`,
    description: roadmap.description,
  };
}


export default async function RoadmapPage({ params }: PageProps) {
  const { slug } = await params;
  await dbConnect();

  // Fetch the roadmap from database
  const roadmapDoc = await Roadmap.findOne({ slug }).lean();

  // Draft roadmaps are invisible to public users
  const isDraft =
    !roadmapDoc ||
    roadmapDoc.visibility === "draft" ||
    (!roadmapDoc.visibility && !roadmapDoc.isPublished);

  if (isDraft) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold mb-2">Roadmap Tidak Ditemukan</h1>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Peta jalan untuk &quot;{slug}&quot; belum dibuat oleh kontributor atau belum diterbitkan oleh administrator.
          </p>
          <Link
            href="/"
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Coming Soon roadmaps are visible on landing but not accessible
  if (roadmapDoc.visibility === "coming_soon") {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="p-5 bg-primary/10 border border-primary/20 text-primary rounded-full mb-5">
            <Compass className="h-10 w-10" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-4">
            <BookOpen className="h-3 w-3" />
            Segera Hadir
          </span>
          <h1 className="text-2xl font-extrabold text-foreground mb-2">{roadmapDoc.title}</h1>
          <p className="text-sm text-muted-foreground max-w-sm mb-8">
            {roadmapDoc.description || "Peta jalan ini sedang dalam persiapan dan akan segera tersedia. Pantau terus update terbaru kami!"}
          </p>
          <Link
            href="/"
            className="px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl transition-colors shadow-lg shadow-primary/20"
          >
            Kembali ke Beranda
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Get user session
  const session = await auth();
  let completedNodes: string[] = [];

  if (session?.user) {
    const progress = await UserProgress.findOne({
      userId: session.user.id,
      roadmapId: roadmapDoc._id,
    }).lean();

    if (progress) {
      completedNodes = progress.completedNodes || [];
    }
  }

  // Serialize roadmap object for the client component
  const serializedRoadmap = {
    title: roadmapDoc.title,
    slug: roadmapDoc.slug,
    description: roadmapDoc.description,
    color: roadmapDoc.color,
    nodes: roadmapDoc.nodes.map((node: any) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      parentId: node.parentId,
      x: node.x,
      y: node.y,
    })),
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <RoadmapCanvas
        roadmap={serializedRoadmap}
        completedNodes={completedNodes}
        isLoggedIn={!!session?.user}
      />
      <Footer />
    </div>
  );
}
