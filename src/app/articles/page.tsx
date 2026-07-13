import { getArticles } from "@/app/actions/article";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { BookOpen, Search, ChevronLeft, ChevronRight, Calendar, User, ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artikel & Tutorial Pemrograman Indonesia - MulaiDariNol",
  description: "Dapatkan tips, tutorial, dan artikel berkualitas seputar website development, UI/UX design, dan AI tools terbaik di Indonesia gratis.",
  keywords: [
    "belajar coding indonesia",
    "tutorial programming indonesia",
    "belajar web programming",
    "belajar ui ux terbaik",
    "artikel website developer",
    "kursus coding online gratis",
  ],
};

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function ArticlesListPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const pageStr = params.page;
  const search = params.search || "";
  const page = parseInt(pageStr || "1", 10);
  const limit = 9;

  const res = await getArticles(page, limit, search);
  const articles = res.success ? res.articles || [] : [];
  const pagination = res.pagination || { page: 1, limit, total: 0, totalPages: 0 };

  // SEO: Structured data for Blog
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "MulaiDariNol Blog",
    "description": "Tutorial dan artikel belajar pemrograman web, UI/UX, dan AI dari nol mutlak.",
    "publisher": {
      "@type": "Organization",
      "name": "MulaiDariNol",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mulaidarinol.com/MulaiDariNol.svg"
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12 space-y-12">
        {/* Banner Section */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/10 border border-primary/20 text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            Eksplorasi Artikel & Tutorial
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-linear-to-r from-foreground via-foreground/90 to-muted-foreground">
            Tingkatkan Skill Coding & UI/UX
          </h1>
          <p className="text-sm text-muted-foreground">
            Temukan panduan praktis, riset tren industri, dan tutorial terstruktur seputar teknologi, web dev, serta pemanfaatan AI terbaru.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto">
          <form action="/articles" method="GET" className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Cari artikel (e.g. Next.js, Figma, AI...)"
              className="w-full pl-9 pr-24 py-2.5 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 transition-all shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary text-primary-foreground hover:bg-primary/95 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
            >
              Cari
            </button>
          </form>
        </div>

        {/* Grid List */}
        {articles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-2xl p-8">
            <p className="text-sm font-semibold">Tidak ada artikel yang cocok dengan pencarian Anda.</p>
            <Link href="/articles" className="text-primary hover:underline text-xs mt-2 inline-block">
              Lihat semua artikel
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <article
                key={article._id}
                className="group flex flex-col bg-card border border-border hover:border-border/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Cover Image */}
                <div className="relative aspect-video bg-muted overflow-hidden shrink-0">
                  {article.coverImage ? (
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-indigo-500/10 via-primary/5 to-pink-500/10 flex items-center justify-center text-primary/45">
                      <BookOpen className="h-10 w-10 stroke-[1.5]" />
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Date */}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(article.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-base leading-snug">
                      <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                    </h3>

                    {/* Summary */}
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {article.summary || "Pelajari panduan materi berkualitas untuk meningkatkan pemahaman coding Anda dari nol mutlak."}
                    </p>
                  </div>

                  {/* Footer Meta */}
                  <div className="pt-4 border-t border-border flex items-center justify-between text-[11px] shrink-0">
                    <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                      {article.authorImage ? (
                        <img
                          src={article.authorImage}
                          alt={article.authorName}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <User className="h-3 w-3" />
                        </div>
                      )}
                      <span>{article.authorName}</span>
                    </div>

                    <Link
                      href={`/articles/${article.slug}`}
                      className="flex items-center gap-1 text-primary font-bold group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Baca</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 pt-6 shrink-0">
            <Link
              href={`/articles?page=${page - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className={`p-2 border border-border hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground flex items-center justify-center ${
                page <= 1 ? "pointer-events-none opacity-40" : ""
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>

            <span className="text-xs font-semibold text-muted-foreground">
              Halaman {page} dari {pagination.totalPages}
            </span>

            <Link
              href={`/articles?page=${page + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className={`p-2 border border-border hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground flex items-center justify-center ${
                page >= pagination.totalPages ? "pointer-events-none opacity-40" : ""
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
