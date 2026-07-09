"use client";

import { useState } from "react";
import { toggleNodeCompletion } from "@/app/actions/progress";
import { CheckCircle2, Circle, Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import confetti from "canvas-confetti";
import { useModal } from "@/components/ModalProvider";

interface CompletionButtonProps {
  roadmapSlug: string;
  nodeId: string;
  initialCompleted: boolean;
  isLoggedIn: boolean;
}

export function CompletionButton({ roadmapSlug, nodeId, initialCompleted, isLoggedIn }: CompletionButtonProps) {
  const { showModal } = useModal();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    // Require login — cannot mark complete without an account
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      setLoading(true);
      const res = await toggleNodeCompletion(roadmapSlug, nodeId);
      if (res.success) {
        setCompleted(res.completed || false);
        if (res.completed) {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.8 },
          });
        }
        router.refresh();
      } else {
        showModal({
          title: "Gagal Menyimpan Progres",
          message: res.error || "Gagal mengubah status penyelesaian materi belajar Anda.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      showModal({
        title: "Terjadi Galat",
        message: "Gagal memperbarui progres karena masalah server. Coba beberapa saat lagi.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 border rounded text-xs font-bold cursor-pointer transition-all ${
          completed
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15"
            : "bg-primary text-primary-foreground border-primary/20 hover:bg-primary/90 shadow-sm"
        } disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : completed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
        <span>{completed ? "Materi Selesai" : "Tandai Selesai"}</span>
      </button>

      {/* Login prompt modal */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center text-center gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-foreground mb-2">Login Diperlukan</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Untuk menandai materi sebagai selesai dan menyimpan progres belajarmu, 
                kamu perlu login terlebih dahulu dengan akun Google.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => signIn("google", { callbackUrl: window.location.href })}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                Masuk dengan Google
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Lanjut Membaca Dulu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CompletionButton;
