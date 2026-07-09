import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Roadmap from "@/lib/models/Roadmap";
import CmsRoadmapManager from "@/components/CmsRoadmapManager";

export default async function CMSRoadmapsPage() {
  const session = await auth();
  await dbConnect();

  let roadmapsDocs = [];

  // Restrict partners to viewing only their own roadmaps. Admins/Superadmins can view all.
  if (session?.user?.role === "partner") {
    roadmapsDocs = await Roadmap.find({ creatorId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();
  } else {
    roadmapsDocs = await Roadmap.find().sort({ createdAt: -1 }).lean();
  }

  // Serialize Mongoose documents
  const serializedRoadmaps = roadmapsDocs.map((r: any) => ({
    _id: r._id.toString(),
    title: r.title,
    slug: r.slug,
    description: r.description,
    icon: r.icon,
    color: r.color,
    isPublished: r.isPublished,
    nodes: r.nodes.map((node: any) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      parentId: node.parentId,
      x: node.x,
      y: node.y,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Roadmap Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Rancang dan terbitkan alur karir baru. Tambahkan node, atur relasi koneksi parent-child, dan tentukan tipe materi.
        </p>
      </div>

      <CmsRoadmapManager initialRoadmaps={serializedRoadmaps} />
    </div>
  );
}
