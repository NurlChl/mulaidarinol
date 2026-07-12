import { MetadataRoute } from "next";
import dbConnect from "@/lib/db";
import Roadmap from "@/lib/models/Roadmap";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Standard static routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cms/login`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ];

  try {
    await dbConnect();
    // Query only fully published roadmaps for sitemap (not draft or coming_soon)
    const roadmaps = await Roadmap.find(
      {
        $or: [
          { visibility: "published" },
          { isPublished: true, visibility: { $exists: false } }
        ]
      },
      "slug nodes updatedAt"
    ).lean();

    roadmaps.forEach((r: any) => {
      // Add main roadmap path
      routes.push({
        url: `${baseUrl}/roadmaps/${r.slug}`,
        lastModified: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      });

      // Add each node path
      r.nodes.forEach((node: any) => {
        if (node.type !== "phase") {
          routes.push({
            url: `${baseUrl}/roadmaps/${r.slug}/${node.id}`,
            lastModified: r.updatedAt ? new Date(r.updatedAt) : new Date(),
            changeFrequency: "daily" as const,
            priority: 0.6,
          });
        }
      });
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
  }

  return routes;
}
