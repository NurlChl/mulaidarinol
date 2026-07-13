import dbConnect from "@/lib/db";
import Roadmap from "@/lib/models/Roadmap";
import { LandingPageClient } from "@/components/LandingPageClient";



async function getPublishedRoadmapsFromDb() {
  try {
    await dbConnect();
    const dbRoadmaps = await Roadmap.find(
      {
        $or: [
          { visibility: { $in: ["published", "coming_soon"] } },
          { isPublished: true, visibility: { $exists: false } }
        ]
      },
      "title slug description icon color visibility"
    ).lean();
    return dbRoadmaps.map((r: any) => {
      const isComingSoon = r.visibility === "coming_soon";
      return {
        title: r.title,
        slug: r.slug,
        description: r.description,
        iconName: r.icon || "Compass",
        color: r.color || "from-primary to-violet-500",
        isActive: !isComingSoon,
        badge: isComingSoon ? "Coming Soon" : "Interactive",
      };
    });
  } catch (error) {
    console.error("Error fetching roadmaps from DB:", error);
    return [];
  }
}

export default async function HomePage() {
  const dbRoadmaps = await getPublishedRoadmapsFromDb();
  return <LandingPageClient roadmaps={dbRoadmaps} />;
}
