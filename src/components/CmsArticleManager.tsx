"use client";

import { useState } from "react";
import { deleteArticle } from "@/app/actions/article";
import { FileText, Plus, Search, Edit, Trash2, Loader2, Calendar, User, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/ModalProvider";
import Link from "next/link";

interface ArticleItem {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

interface CmsArticleManagerProps {
  articles: ArticleItem[];
}

export function CmsArticleManager({ articles }: CmsArticleManagerProps) {
  const router = useRouter();
  const { showModal } = useModal();
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string, title: string) => {
    showModal({
      title: "Hapus Artikel?",
      message: `Apakah Anda yakin ingin menghapus artikel "${title}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      type: "error",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      onConfirm: async () => {
        try {
          setDeletingId(id);
          const res = await deleteArticle(id);
          if (res.success) {
            router.refresh();
            showModal({
              title: "Berhasil",
              message: "Artikel berhasil dihapus.",
              type: "success",
            });
          } else {
            showModal({
              title: "Gagal Menghapus",
              message: res.error || "Gagal menghapus artikel.",
              type: "error",
            });
          }
        } catch (err) {
          console.error(err);
          showModal({
            title: "Kesalahan Sistem",
            message: "Terjadi kesalahan internal saat mencoba menghapus artikel.",
            type: "error",
          });
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border p-4 rounded-lg shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari judul, slug, atau penulis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
          />
        </div>

        {/* Add Button */}
        <Link
          href="/cms/articles/new"
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-md font-semibold text-xs transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tulis Artikel Baru</span>
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <th className="p-4">Artikel</th>
                <th className="p-4">Penulis</th>
                <th className="p-4">Status</th>
                <th className="p-4">Tanggal Dibuat</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Tidak ada artikel ditemukan. Mulai tulis artikel baru untuk meningkatkan SEO!
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr key={article._id} className="hover:bg-muted/10 transition-colors">
                    {/* Title & Slug */}
                    <td className="p-4 max-w-xs sm:max-w-sm">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 bg-primary/10 text-primary rounded shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground line-clamp-1 text-[13px]">
                            {article.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            /{article.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="p-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span>{article.authorName}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          article.status === "published"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}
                      >
                        {article.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="p-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(article.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Public Preview Link */}
                        {article.status === "published" && (
                          <Link
                            href={`/articles/${article.slug}`}
                            target="_blank"
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors hover:bg-muted/50 rounded"
                            title="Lihat Artikel"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}

                        {/* Edit */}
                        <Link
                          href={`/cms/articles/${article._id}`}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/50 rounded"
                          title="Edit Artikel"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>

                        {/* Delete */}
                        <button
                          disabled={deletingId === article._id}
                          onClick={() => handleDelete(article._id, article.title)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors hover:bg-muted/50 rounded cursor-pointer disabled:opacity-50"
                          title="Hapus Artikel"
                        >
                          {deletingId === article._id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CmsArticleManager;
