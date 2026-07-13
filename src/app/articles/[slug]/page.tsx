import { getArticleBySlug } from "@/app/actions/article";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, User, ArrowLeft, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Artikel Tidak Ditemukan - MulaiDariNol",
    };
  }

  const title = article.seoTitle || `${article.title} - MulaiDariNol`;
  const description = article.seoDescription || article.summary || "";

  return {
    title,
    description,
    keywords: article.seoKeywords,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt,
      images: article.coverImage ? [{ url: article.coverImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.coverImage ? [article.coverImage] : [],
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || article.status !== "published") {
    return notFound();
  }

  // Calculate estimated reading time
  const wordCount = article.content.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 225)); // average reading speed 225 wpm

  // SEO: Structured data for BlogPosting
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.summary || article.seoDescription,
    "image": article.coverImage || "https://mulaidarinol.com/MulaiDariNol.svg",
    "datePublished": article.createdAt,
    "dateModified": article.updatedAt,
    "author": {
      "@type": "Person",
      "name": article.authorName
    },
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

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 space-y-8">
        {/* Back Link */}
        <div className="shrink-0">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Daftar Artikel</span>
          </Link>
        </div>

        {/* Article Meta Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-semibold">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {new Date(article.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Estimasi {readingTime} Menit Baca</span>
            </div>

            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>Ditulis oleh: {article.authorName}</span>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold sm:text-4xl leading-tight text-foreground">
            {article.title}
          </h1>

          {article.summary && (
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary/50 pl-4 py-1 leading-relaxed">
              {article.summary}
            </p>
          )}
        </div>

        {/* Cover Image */}
        {article.coverImage && (
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted border border-border shadow-sm shrink-0">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <article className="prose dark:prose-invert prose-indigo max-w-none pt-4 pb-12 prose-sm sm:prose-base leading-relaxed text-foreground select-text">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
        </article>
      </main>

      <Footer />
    </div>
  );
}
