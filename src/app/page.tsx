import dbConnect from "@/lib/db";
import Roadmap from "@/lib/models/Roadmap";
import { LandingPageClient } from "@/components/LandingPageClient";

// Predefined roadmaps to display on the landing page (static UI + database union)
const STATIC_ROADMAP_CARDS = [
  {
    title: "Web Developer",
    slug: "web-developer",
    description: "Kuasai pemrograman web dari nol mutlak. Fokus pada HTML, CSS, JavaScript, Next.js, Node.js, API, hingga deployment.",
    iconName: "Code",
    color: "from-indigo-500 to-blue-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "UI/UX Designer",
    slug: "ui-ux-designer",
    description: "Pelajari riset pengguna, perancangan wireframe, gaya warna, auto-layout, hingga pembuatan design system di Figma.",
    iconName: "PenTool",
    color: "from-pink-500 to-rose-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "WordPress Developer",
    slug: "wordpress-developer",
    description: "Pelajari arsitektur tema WordPress, custom post types, Gutenberg blocks, hingga headless CMS menggunakan GraphQL.",
    iconName: "Settings",
    color: "from-sky-500 to-indigo-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "Framer Developer",
    slug: "framer-developer",
    description: "Bangun landing page interaktif dengan Framer. Kuasai transisi, layout reaktif, Framer CMS, dan SEO.",
    iconName: "Layers",
    color: "from-blue-600 to-violet-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "Webflow Developer",
    slug: "webflow-developer",
    description: "Desain halaman web responsif dengan struktur Box Model CSS asli. Kelola Webflow CMS dan interaksi rumit.",
    iconName: "Layout",
    color: "from-blue-500 to-cyan-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "Wix Developer",
    slug: "wix-developer",
    description: "Manfaatkan Wix Studio dan script Velo JavaScript untuk membuat aplikasi web kustom yang canggih.",
    iconName: "Sparkles",
    color: "from-purple-500 to-pink-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "Shopify Developer",
    slug: "shopify-developer",
    description: "Kuasai ekosistem e-commerce terbesar. Pelajari Liquid engine, kustomisasi tema, dan Shopify Storefront API.",
    iconName: "ShoppingBag",
    color: "from-green-500 to-emerald-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "AI-Powered Web Dev",
    slug: "ai-powered-web-dev",
    description: "Tingkatkan produktivitas coding hingga 10x lipat dengan Cursor, Windsurf, Claude Code, v0, dan Prompt Engineering.",
    iconName: "Brain",
    color: "from-emerald-500 to-teal-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "Front End Developer",
    slug: "front-end-developer",
    description: "Pelajari framework modern, responsive design, state management, dan optimasi visual.",
    iconName: "Layout",
    color: "from-cyan-500 to-blue-500",
    badge: "Coming Soon",
    isActive: false,
  },
  {
    title: "Backend Developer",
    slug: "backend-developer",
    description: "Kembangkan API, kelola database relasional/non-relasional, caching, dan arsitektur server.",
    iconName: "Server",
    color: "from-purple-500 to-pink-500",
    badge: "Coming Soon",
    isActive: false,
  },
  {
    title: "Fullstack Developer",
    slug: "fullstack-developer",
    description: "Gabungkan frontend dan backend untuk membangun aplikasi web produksi dari ujung ke ujung.",
    iconName: "Layers",
    color: "from-indigo-500 to-violet-500",
    badge: "Coming Soon",
    isActive: false,
  },
  {
    title: "AI Engineer",
    slug: "ai-engineer",
    description: "Pelajari integrasi LLM, prompt engineering, vector database, dan pembuatan agen AI cerdas.",
    iconName: "Brain",
    color: "from-amber-500 to-orange-500",
    badge: "Coming Soon",
    isActive: false,
  },
  {
    title: "Software Engineer",
    slug: "software-engineer",
    description: "Struktur data, algoritma, desain sistem skala besar, pola arsitektur, dan prinsip clean code.",
    iconName: "Terminal",
    color: "from-zinc-500 to-zinc-800",
    badge: "Coming Soon",
    isActive: false,
  },
];

async function getPublishedRoadmapsFromDb() {
  try {
    await dbConnect();
    const dbRoadmaps = await Roadmap.find(
      { isPublished: true },
      "title slug description icon color"
    ).lean();
    return dbRoadmaps.map((r: any) => ({
      title: r.title,
      slug: r.slug,
      description: r.description,
      iconName: r.icon || "Compass",
      color: r.color || "from-primary to-violet-500",
      isActive: true,
      badge: "Database Active",
    }));
  } catch (error) {
    console.error("Error fetching roadmaps from DB:", error);
    return [];
  }
}

export default async function HomePage() {
  const dbRoadmaps = await getPublishedRoadmapsFromDb();
  const combinedRoadmaps = [...STATIC_ROADMAP_CARDS];

  dbRoadmaps.forEach((dbR) => {
    const staticIndex = combinedRoadmaps.findIndex((s) => s.slug === dbR.slug);
    if (staticIndex > -1) {
      combinedRoadmaps[staticIndex].isActive = true;
      combinedRoadmaps[staticIndex].badge = "Interactive";
    } else {
      combinedRoadmaps.push({
        title: dbR.title,
        slug: dbR.slug,
        description: dbR.description,
        iconName: "Compass",
        color: "from-primary to-violet-500",
        badge: "Partner Custom",
        isActive: true,
      });
    }
  });

  return <LandingPageClient roadmaps={combinedRoadmaps} />;
}
