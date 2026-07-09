import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Roadmap from "@/lib/models/Roadmap";
import Material from "@/lib/models/Material";
import CmsMaterialEditor from "@/components/CmsMaterialEditor";

export default async function CMSMaterialsPage() {
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

  // Fetch all existing materials in one query to build cache map
  const materialsDocs = await Material.find().lean();
  const materialsCache: Record<string, { title: string; slug: string; content: string }> = {};

  materialsDocs.forEach((mat: any) => {
    const key = `${mat.roadmapId.toString()}-${mat.nodeId}`;
    materialsCache[key] = {
      title: mat.title,
      slug: mat.slug,
      content: mat.content,
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
        <h1 className="text-xl font-bold tracking-tight text-foreground">Materials Creator</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tulis modul bacaan belajar menggunakan editor Markdown standar. Konten yang Anda tulis akan tampil secara real-time di halaman belajar siswa.
        </p>
      </div>

      <CmsMaterialEditor roadmaps={serializedRoadmaps} materialsCache={materialsCache} />
    </div>
  );
}
