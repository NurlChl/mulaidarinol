import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PartnerForm from "@/components/PartnerForm";
import dbConnect from "@/lib/db";
import Roadmap from "@/lib/models/Roadmap";
import {
  Compass,
  Layout,
  Server,
  Layers,
  Palette,
  Terminal,
  Brain,
  Wrench,
  PenTool,
  ArrowRight,
  Sparkles,
  Lock,
  BookOpen,
  Code,
  Settings,
  ShoppingBag,
  Globe
} from "lucide-react";

// Predefined roadmaps to display on the landing page (static UI + database union)
const STATIC_ROADMAP_CARDS = [
  {
    title: "Web Developer",
    slug: "web-developer",
    description: "Kuasai pemrograman web dari nol mutlak. Fokus pada HTML, CSS, JavaScript, Next.js, Node.js, API, hingga deployment.",
    icon: Code,
    color: "from-indigo-500 to-blue-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "UI/UX Designer",
    slug: "ui-ux-designer",
    description: "Pelajari riset pengguna, perancangan wireframe, gaya warna, auto-layout, hingga pembuatan design system di Figma.",
    icon: PenTool,
    color: "from-pink-500 to-rose-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "WordPress Developer",
    slug: "wordpress-developer",
    description: "Pelajari arsitektur tema WordPress, custom post types, Gutenberg blocks, hingga headless CMS menggunakan GraphQL.",
    icon: Settings,
    color: "from-sky-500 to-indigo-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "Framer Developer",
    slug: "framer-developer",
    description: "Bangun landing page interaktif dengan Framer. Kuasai transisi, layout reaktif, Framer CMS, dan SEO.",
    icon: Layers,
    color: "from-blue-600 to-violet-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "Webflow Developer",
    slug: "webflow-developer",
    description: "Desain halaman web responsif dengan struktur Box Model CSS asli. Kelola Webflow CMS dan interaksi rumit.",
    icon: Layout,
    color: "from-blue-500 to-cyan-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "Wix Developer",
    slug: "wix-developer",
    description: "Manfaatkan Wix Studio dan script Velo JavaScript untuk membuat aplikasi web kustom yang canggih.",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "Shopify Developer",
    slug: "shopify-developer",
    description: "Kuasai ekosistem e-commerce terbesar. Pelajari Liquid engine, kustomisasi tema, dan Shopify Storefront API.",
    icon: ShoppingBag,
    color: "from-green-500 to-emerald-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "AI-Powered Web Dev",
    slug: "ai-powered-web-dev",
    description: "Tingkatkan produktivitas coding hingga 10x lipat dengan Cursor, Windsurf, Claude Code, v0, dan Prompt Engineering.",
    icon: Brain,
    color: "from-emerald-500 to-teal-500",
    badge: "Interactive",
    isActive: true,
  },
  {
    title: "Front End Developer",
    slug: "front-end-developer",
    description: "Pelajari framework modern, responsive design, state management, dan optimasi visual.",
    icon: Layout,
    color: "from-cyan-500 to-blue-500",
    badge: "Coming Soon",
    isActive: false,
  },
  {
    title: "Backend Developer",
    slug: "backend-developer",
    description: "Kembangkan API, kelola database relasional/non-relasional, caching, dan arsitektur server.",
    icon: Server,
    color: "from-purple-500 to-pink-500",
    badge: "Coming Soon",
    isActive: false,
  },
  {
    title: "Fullstack Developer",
    slug: "fullstack-developer",
    description: "Gabungkan frontend dan backend untuk membangun aplikasi web produksi dari ujung ke ujung.",
    icon: Layers,
    color: "from-indigo-500 to-violet-500",
    badge: "Coming Soon",
    isActive: false,
  },
  {
    title: "AI Engineer",
    slug: "ai-engineer",
    description: "Pelajari integrasi LLM, prompt engineering, vector database, dan pembuatan agen AI cerdas.",
    icon: Brain,
    color: "from-amber-500 to-orange-500",
    badge: "Coming Soon",
    isActive: false,
  },
  {
    title: "Software Engineer",
    slug: "software-engineer",
    description: "Struktur data, algoritma, desain sistem skala besar, pola arsitektur, dan prinsip clean code.",
    icon: Terminal,
    color: "from-zinc-500 to-zinc-800",
    badge: "Coming Soon",
    isActive: false,
  },
];

async function getPublishedRoadmapsFromDb() {
  try {
    await dbConnect();
    // Query database for published roadmaps and project just title/slug/icon/color
    const dbRoadmaps = await Roadmap.find(
      { isPublished: true },
      "title slug description icon color"
    ).lean();
    return dbRoadmaps.map((r: any) => ({
      _id: r._id.toString(),
      title: r.title,
      slug: r.slug,
      description: r.description,
      icon: r.icon,
      color: r.color,
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

  // Create active list from DB + Fallback
  // If a slug in static list is already published in database, override it or prioritize DB version
  const combinedRoadmaps = [...STATIC_ROADMAP_CARDS];

  // Map of slugs from DB
  const dbSlugs = new Set(dbRoadmaps.map((r) => r.slug));

  // Merge: If database has roadmaps that aren't in STATIC_ROADMAP_CARDS, add them dynamically.
  // If they are in the static list, set them to active (since they exist in DB)
  dbRoadmaps.forEach((dbR) => {
    const staticIndex = combinedRoadmaps.findIndex((s) => s.slug === dbR.slug);
    if (staticIndex > -1) {
      combinedRoadmaps[staticIndex].isActive = true;
      combinedRoadmaps[staticIndex].badge = "Interactive";
    } else {
      // Add custom roadmap added by partners/admins
      combinedRoadmaps.push({
        title: dbR.title,
        slug: dbR.slug,
        description: dbR.description,
        icon: Compass, // Fallback icon
        color: "from-primary to-violet-500",
        badge: "Partner Custom",
        isActive: true,
      });
    }
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-background">
        <div className="absolute inset-0 grid-bg opacity-35 pointer-events-none" />
        {/* Soft background glow */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary mb-6 animate-in fade-in duration-300">
            <Sparkles className="h-3 w-3" />
            <span>AI-First Developer Path 2026</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            Kuasai Karir Developer <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-indigo-400">
              Di Era Artifisial Inteligens
            </span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Mulai karir IT impian Anda dengan peta jalan belajar yang terstruktur rapi dari nol sampai siap kerja. 
            Pelajari teori esensial, uji pemahaman lewat kuis interaktif, dan langsung praktek coding di browser Anda tanpa perlu instalasi tools yang rumit.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="#roadmaps"
              className="px-6 py-3 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/95 rounded-md shadow-sm transition-colors cursor-pointer"
            >
              Lihat Roadmap Belajar
            </Link>
            <Link
              href="#partner"
              className="px-6 py-3 text-sm font-semibold border border-border hover:bg-muted rounded-md transition-colors cursor-pointer"
            >
              Gabung Jadi Partner
            </Link>
          </div>
        </div>
      </section>

      {/* Roadmaps Grid Section */}
      <section id="roadmaps" className="py-16 border-t border-border bg-background relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
              Peta Jalan Pembelajaran
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Pilih fokus karir Anda. Peta jalan di bawah dirancang berdasarkan tren industri modern dan workflow berbasis AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {combinedRoadmaps.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.slug}
                  className={`group relative flex flex-col justify-between p-6 rounded-lg border border-border bg-card shadow-sm transition-all duration-300 ${
                    card.isActive
                      ? "hover:border-primary/50 hover:shadow-md cursor-pointer"
                      : "opacity-80"
                  }`}
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 rounded bg-secondary border border-border text-foreground">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      
                      {card.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <BookOpen className="h-2.5 w-2.5" />
                          <span>{card.badge}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                          <Lock className="h-2.5 w-2.5" />
                          <span>Coming Soon</span>
                        </span>
                      )}
                    </div>

                    {/* Text content */}
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                      {card.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                      {card.description}
                    </p>
                  </div>

                  {/* Action Link */}
                  <div>
                    {card.isActive ? (
                      <Link
                        href={`/roadmaps/${card.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        <span>Mulai Belajar</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <span>Segera Hadir</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Partner Program Section */}
      <section id="partner" className="py-20 border-t border-border bg-secondary relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left intro text */}
            <div className="lg:col-span-6 space-y-6">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 inline-block">
                Creator & Community Program
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Bagikan Keahlian Anda <br />
                Sebagai Mitra Kontributor
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kami percaya bahwa ilmu terbaik datang dari para praktisi aktif yang berpengalaman di industri. Sebagai Mentor / Partner di MulaiDariNol, 
                Anda dapat berkontribusi menyusun peta jalan belajar yang realistis, membagikan modul materi yang terstruktur, kuis evaluasi, 
                hingga tantangan coding interaktif untuk membantu ribuan talenta baru berkembang.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Kelola Kurikulum Karir Anda</h4>
                    <p className="text-xs text-muted-foreground">Tulis dan susun modul pembelajaran secara langsung dengan editor visual interaktif kami yang mudah digunakan.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">✓</div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Kurasi & Standarisasi Industri</h4>
                    <p className="text-xs text-muted-foreground">Setiap modul akan ditinjau bersama oleh tim kurator profesional kami untuk memastikan standar materi tetap tinggi, rapi, dan mudah dipahami oleh pemula.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right form container */}
            <div className="lg:col-span-6">
              <PartnerForm />
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
