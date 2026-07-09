"use client";

import { useState } from "react";
import { reviewPartnerApplication } from "@/app/actions/cms";
import { Check, X, Loader2, Globe, Clock, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/ModalProvider";

interface ApplicationData {
  _id: string;
  portfolioUrl: string;
  experienceSummary: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  userId?: {
    name: string;
    email: string;
    image?: string;
  };
}

interface PartnerReviewsProps {
  initialApplications: ApplicationData[];
}

export function PartnerReviews({ initialApplications }: PartnerReviewsProps) {
  const { showModal } = useModal();
  const [apps, setApps] = useState<ApplicationData[]>(initialApplications);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const handleReview = async (id: string, action: "approve" | "reject") => {
    try {
      setProcessingId(id);
      const res = await reviewPartnerApplication(id, action);
      
      if (res.success) {
        // Update local state status
        setApps((prev) =>
          prev.map((app) =>
            app._id === id
              ? { ...app, status: action === "approve" ? "approved" : "rejected" }
              : app
          )
        );
        router.refresh();
        showModal({
          title: "Status Diperbarui",
          message: `Permohonan kemitraan berhasil ${action === "approve" ? "disetujui" : "ditolak"}.`,
          type: "success",
        });
      } else {
        showModal({
          title: "Gagal Mengubah Status",
          message: res.error || "Gagal memperbarui status registrasi mitra.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      showModal({
        title: "Galat Pengajuan",
        message: "Terjadi kesalahan saat memproses data. Silakan coba kembali.",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden text-xs">
      <div className="px-5 py-4 border-b border-border bg-secondary">
        <h3 className="font-bold uppercase tracking-wider text-foreground">
          Daftar Pengajuan Mitra Kontributor (Partner)
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
              <th className="p-4">Pemohon</th>
              <th className="p-4">Portfolio Link</th>
              <th className="p-4">Pengalaman & Motivasi</th>
              <th className="p-4">Tanggal Pengajuan</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {apps.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Tidak ada data pengajuan partner yang masuk.
                </td>
              </tr>
            ) : (
              apps.map((app) => (
                <tr key={app._id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-foreground">{app.userId?.name || "Deleted User"}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{app.userId?.email}</div>
                  </td>
                  
                  <td className="p-4">
                    <a
                      href={app.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1.5 font-medium"
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-[150px]">{app.portfolioUrl}</span>
                    </a>
                  </td>

                  <td className="p-4">
                    <p className="whitespace-pre-wrap max-w-xs wrap-break-word leading-relaxed text-muted-foreground">
                      {app.experienceSummary}
                    </p>
                  </td>

                  <td className="p-4 text-muted-foreground">
                    {new Date(app.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td className="p-4 text-center">
                    {app.status === "pending" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="h-2.5 w-2.5" />
                        <span>Pending</span>
                      </span>
                    )}
                    {app.status === "approved" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle className="h-2.5 w-2.5" />
                        <span>Approved</span>
                      </span>
                    )}
                    {app.status === "rejected" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold uppercase bg-destructive/10 text-destructive border border-destructive/20">
                        <XCircle className="h-2.5 w-2.5" />
                        <span>Rejected</span>
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    {app.status === "pending" && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleReview(app._id, "approve")}
                          disabled={processingId !== null}
                          className="p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white transition-colors cursor-pointer border border-emerald-500/20"
                          title="Setujui Aplikasi"
                        >
                          {processingId === app._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleReview(app._id, "reject")}
                          disabled={processingId !== null}
                          className="p-1.5 rounded bg-destructive/10 hover:bg-destructive text-destructive hover:text-white transition-colors cursor-pointer border border-destructive/20"
                          title="Tolak Aplikasi"
                        >
                          {processingId === app._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PartnerReviews;
