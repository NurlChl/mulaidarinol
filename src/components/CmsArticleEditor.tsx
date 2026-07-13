"use client";

import { useState, useEffect } from "react";
import { saveArticle } from "@/app/actions/article";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Eye, Edit2, AlertCircle, Sparkles, Globe } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ArticleData {
  _id?: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  coverImage: string;
  status: "draft" | "published";
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
}

interface CmsArticleEditorProps {
  initialArticle: ArticleData | null;
}

export function CmsArticleEditor({ initialArticle }: CmsArticleEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState(initialArticle?.title || "");
  const [slug, setSlug] = useState(initialArticle?.slug || "");
  const [content, setContent] = useState(initialArticle?.content || "");
  const [summary, setSummary] = useState(initialArticle?.summary || "");
  const [coverImage, setCoverImage] = useState(initialArticle?.coverImage || "");
  const [status, setStatus] = useState<"draft" | "published">(initialArticle?.status || "draft");
  const [seoTitle, setSeoTitle] = useState(initialArticle?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initialArticle?.seoDescription || "");
  const [seoKeywordsInput, setSeoKeywordsInput] = useState(initialArticle?.seoKeywords?.join(", ") || "");

  // Tab state: "edit" | "preview"
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Auto-generate slug from title
  useEffect(() => {
    if (!initialArticle?._id && title) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setSlug(generated);
    }
  }, [title, initialArticle?._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !content) {
      setErrorMsg("Judul, slug, dan isi materi artikel wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const keywords = seoKeywordsInput
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const payload = {
        _id: initialArticle?._id,
        title,
        slug,
        content,
        summary,
        coverImage,
        status,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || summary || title,
        seoKeywords: keywords,
      };

      const res = await saveArticle(payload);
      if (res.success) {
        router.push("/cms/articles");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Gagal menyimpan artikel.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan internal sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-xs max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Link
            href="/cms/articles"
            className="p-2 border border-border hover:bg-muted/50 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              {initialArticle?._id ? "Edit Artikel" : "Tulis Artikel Baru"}
            </h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Kelola isi materi blog untuk optimasi SEO pencarian lokal Indonesia (GEO).
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Simpan Artikel</span>
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md animate-in fade-in duration-150">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Form Left, SEO Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Editor & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Article Info */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4 shadow-sm">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                Judul Artikel
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors font-medium placeholder:text-muted-foreground"
                placeholder="e.g. Cara Belajar Web Programming dari Nol untuk Pemula"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                  Custom Slug / Route
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    /articles/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.replace(/\s+/g, "-"))}
                    className="w-full pl-18 pr-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground font-mono"
                    placeholder="cara-belajar-coding"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                  placeholder="https://example.com/banner.png"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                Ringkasan / Summary (Singkat & Menarik untuk SEO)
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                maxLength={200}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground resize-none"
                placeholder="Tulis ringkasan singkat artikel dalam 1-2 kalimat (maks 200 karakter) untuk tampil di beranda blog."
              />
            </div>
          </div>

          {/* Markdown Content Editor */}
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col h-[500px]">
            {/* Toolbar */}
            <div className="flex justify-between items-center bg-muted/40 px-4 py-2 border-b border-border">
              <span className="font-semibold text-foreground">Isi Artikel (Markdown)</span>

              {/* Tabs Toggle */}
              <div className="flex bg-background border border-border rounded-md p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                    activeTab === "edit"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                    activeTab === "preview"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  <span>Pratinjau</span>
                </button>
              </div>
            </div>

            {/* Editor Pane */}
            {activeTab === "edit" ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full flex-1 p-4 bg-background focus:outline-none font-mono text-[13px] leading-relaxed resize-none overflow-y-auto"
                placeholder="# Mulai menulis artikel di sini menggunakan Markdown..."
              />
            ) : (
              <div className="w-full flex-1 p-6 bg-background overflow-y-auto prose dark:prose-invert max-w-none prose-sm text-foreground">
                {content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                ) : (
                  <span className="text-muted-foreground italic text-xs">Belum ada konten yang ditulis.</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Settings & SEO Parameters */}
        <div className="space-y-6">
          {/* Status Settings */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2.5">
              <span>Pengaturan Publikasi</span>
            </h3>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                Status Visibilitas
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="draft">Draft (Hanya Creator/Admin)</option>
                <option value="published">Published (Publik & SEO Index)</option>
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Status <strong>Published</strong> akan menampilkan artikel ini pada sitemap dan publik.
              </p>
            </div>
          </div>

          {/* SEO & GEO Optimization Card */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-2.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Optimasi SEO & GEO Indonesia</span>
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Parameter berikut mengontrol meta tag HTML artikel untuk menargetkan kata kunci lokal di Indonesia.
            </p>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                SEO Custom Title
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
                placeholder="e.g. Belajar Web Programming Terbaik Indonesia"
              />
              <p className="text-[9px] text-muted-foreground mt-0.5">
                Kosongkan untuk otomatis menggunakan Judul Artikel.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                SEO Meta Description
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                maxLength={160}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground resize-none"
                placeholder="e.g. Panduan belajar coding web programming terlengkap di Indonesia dengan kurikulum modern..."
              />
              <p className="text-[9px] text-muted-foreground mt-0.5">
                Teks deskripsi ringkas (maks 160 karakter) untuk hasil pencarian Google.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">
                GEO Keywords (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={seoKeywordsInput}
                onChange={(e) => setSeoKeywordsInput(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground font-mono"
                placeholder="web developer terbaik, belajar coding indonesia, belajar uiux jakarta"
              />
              <p className="text-[9px] text-muted-foreground mt-0.5">
                Masukkan kata kunci geografis & relevan untuk mempermudah Google merangking pencarian lokal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CmsArticleEditor;
