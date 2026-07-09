"use client";

import React, { useState, useEffect } from "react";
import { submitQuizAttempt } from "@/app/actions/progress";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Timer, 
  Trophy, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  LogIn, 
  Lock,
  ChevronRight,
  BookOpen,
  Award
} from "lucide-react";
import { useModal } from "@/components/ModalProvider";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  explanation?: string;
}

interface ConsoleQuizProps {
  roadmapSlug: string;
  nodeId: string;
  quiz: {
    _id: string;
    title: string;
    timeLimit: number; // in seconds
    highestScore?: number | null;
    lastScore?: number | null;
    questions: Question[];
  };
  onCompleted?: () => void;
  isLoggedIn: boolean;
  nextNode?: { id: string; label: string; type: string } | null;
  onClose: () => void;
}

export function ConsoleQuiz({ 
  roadmapSlug, 
  nodeId, 
  quiz, 
  onCompleted, 
  isLoggedIn,
  nextNode,
  onClose
}: ConsoleQuizProps) {
  const { showModal } = useModal();
  const [gameState, setGameState] = useState<"intro" | "playing" | "results">("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit);
  const [scoreData, setScoreData] = useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    totalCount: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  // High score tracking from props or local session update
  const [highestScore, setHighestScore] = useState<number | null>(quiz.highestScore ?? null);
  const [lastScore, setLastScore] = useState<number | null>(quiz.lastScore ?? null);

  // Timer countdown hook
  useEffect(() => {
    if (gameState !== "playing" || quiz.timeLimit <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  const startQuiz = () => {
    setSelectedAnswers({});
    setCurrentIdx(0);
    setTimeLeft(quiz.timeLimit);
    setScoreData(null);
    setReviewMode(false);
    setGameState("playing");
  };

  const handleSelectAnswer = (optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionIdx,
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // Build the answers array. If unanswered, send -1
    const answersArray = quiz.questions.map((_, idx) =>
      selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1
    );

    const timeSpent = quiz.timeLimit > 0 ? quiz.timeLimit - timeLeft : 0;

    if (!isLoggedIn) {
      showModal({
        title: "Login Diperlukan",
        message: "Kamu harus login menggunakan akun Google untuk mengirim jawaban dan menyimpan nilai.",
        type: "warning",
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitQuizAttempt(
        roadmapSlug,
        nodeId,
        quiz._id,
        answersArray,
        timeSpent
      );

      if (res.success && res.score !== undefined) {
        const passed = res.passed ?? false;
        setScoreData({
          score: res.score,
          passed,
          correctCount: res.correctCount || 0,
          totalCount: res.totalCount || 0,
        });

        // Update highscore and last score locally
        setLastScore(res.score);
        if (highestScore === null || res.score > highestScore) {
          setHighestScore(res.score);
        }

        setGameState("results");
        onCompleted?.();
      } else {
        showModal({
          title: "Gagal Mengirim Kuis",
          message: res.error || "Gagal memproses jawaban ujian Anda.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      showModal({
        title: "Kesalahan Koneksi",
        message: "Gagal mengirim kuis karena kesalahan internal database.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining.toString().padStart(2, "0")}`;
  };

  const activeQuestion = quiz.questions[currentIdx];
  const allAnswered = quiz.questions.every((_, idx) => selectedAnswers[idx] !== undefined);

  // Framer Motion Variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.25 } }
  };

  const cardVariants = {
    hidden: { scale: 0.95, opacity: 0, y: 15 },
    visible: { scale: 1, opacity: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 25 } },
    exit: { scale: 0.95, opacity: 0, y: -15, transition: { duration: 0.2 } }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 120 : -120,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { x: { type: "spring" as any, stiffness: 350, damping: 30 }, opacity: { duration: 0.2 } }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 120 : -120,
      opacity: 0,
      transition: { x: { type: "spring" as any, stiffness: 350, damping: 30 }, opacity: { duration: 0.15 } }
    })
  };

  const [slideDirection, setSlideDirection] = useState(1);

  const goNext = () => {
    if (currentIdx < quiz.questions.length - 1) {
      setSlideDirection(1);
      setCurrentIdx((p) => p + 1);
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) {
      setSlideDirection(-1);
      setCurrentIdx((p) => p - 1);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md overflow-y-auto px-4 py-8 select-none"
      >
        {/* Header Bar */}
        <div className="absolute top-0 left-0 right-0 h-16 border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <span className="font-extrabold text-[16px] text-foreground tracking-tight">{quiz.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Keluar dari Kuis"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Focus Mode Content Area */}
        <motion.div 
          variants={cardVariants}
          className="max-w-[700px] w-full bg-card border border-border shadow-2xl rounded-2xl overflow-hidden mt-12 flex flex-col min-h-[450px]"
        >
          {/* INTRO SCREEN */}
          {gameState === "intro" && (
            <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6 flex-1">
              {!isLoggedIn ? (
                <>
                  <div className="p-5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl">
                    <Lock className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="text-[24px] font-black text-foreground">Login untuk Mengerjakan Kuis</h3>
                    <p className="text-[15px] text-muted-foreground max-w-sm mt-3 leading-relaxed">
                      Nilai kuis akan dicatat di database dan dihubungkan ke profil belajarmu untuk melacak progres kelulusan.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 w-full max-w-xs pt-2">
                    <button
                      onClick={() => signIn("google", { callbackUrl: window.location.href })}
                      className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      <LogIn className="h-5 w-5" />
                      Masuk dengan Google
                    </button>
                    <p className="text-xs text-muted-foreground">
                      Latihan Praktek (Code Editor) tetap bisa digunakan tanpa login.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-5 bg-primary/10 border border-primary/20 text-primary rounded-2xl">
                    <Trophy className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="text-[26px] font-black text-foreground leading-tight">Ujian Pemahaman Kuis</h3>
                    <p className="text-[16px] text-muted-foreground max-w-md mt-2.5 leading-relaxed">
                      Uji pemahaman teorimu mengenai materi ini. Skor kelulusan minimal adalah <strong className="text-primary">70%</strong>.
                    </p>
                  </div>

                  {/* Previous attempts scores */}
                  {(highestScore !== null || lastScore !== null) && (
                    <div className="flex items-center justify-center gap-6 w-full max-w-sm py-4 px-6 rounded-xl bg-secondary/50 border border-border">
                      {lastScore !== null && (
                        <div className="text-center flex-1">
                          <span className="block text-[11px] text-muted-foreground uppercase font-bold tracking-widest">Nilai Terakhir</span>
                          <strong className="text-[20px] font-black text-foreground">{lastScore}%</strong>
                        </div>
                      )}
                      {highestScore !== null && (
                        <div className="text-center flex-1 border-l border-border pl-6">
                          <span className="block text-[11px] text-muted-foreground uppercase font-bold tracking-widest">Nilai Tertinggi</span>
                          <strong className="text-[20px] font-black text-primary">{highestScore}%</strong>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm max-w-xs w-full py-4 border-y border-border">
                    <div className="text-center border-r border-border">
                      <span className="block text-muted-foreground">Jumlah Soal</span>
                      <strong className="text-foreground text-[16px] font-extrabold">{quiz.questions.length} Butir</strong>
                    </div>
                    <div className="text-center">
                      <span className="block text-muted-foreground">Batas Waktu</span>
                      <strong className="text-foreground text-[16px] font-extrabold">
                        {quiz.timeLimit > 0 ? `${formatTime(quiz.timeLimit)} Menit` : "Tanpa Batas"}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={startQuiz}
                    className="px-8 py-3.5 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold rounded-xl cursor-pointer transition-colors shadow-lg"
                  >
                    Mulai Ujian Sekarang
                  </button>
                </>
              )}
            </div>
          )}

          {/* PLAYING SCREEN */}
          {gameState === "playing" && activeQuestion && (
            <div className="p-6 md:p-8 flex flex-col justify-between flex-1 overflow-hidden">
              {/* Question progress and timer */}
              <div className="flex justify-between items-center pb-4 border-b border-border mb-6">
                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                  Pertanyaan {currentIdx + 1} dari {quiz.questions.length}
                </span>
                {quiz.timeLimit > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-xs">
                    <Timer className="h-4 w-4" />
                    <span className="font-mono">{formatTime(timeLeft)}</span>
                  </div>
                )}
              </div>

              {/* Animating the question slides */}
              <div className="flex-1 flex flex-col justify-center min-h-[220px]">
                <AnimatePresence mode="wait" custom={slideDirection}>
                  <motion.div
                    key={currentIdx}
                    custom={slideDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-6"
                  >
                    <h4 className="text-[20px] md:text-[23px] font-extrabold text-foreground leading-[1.4] tracking-tight">
                      {activeQuestion.questionText}
                    </h4>

                    {/* Options list */}
                    <div className="space-y-3">
                      {activeQuestion.options.map((option, idx) => {
                        const isSelected = selectedAnswers[currentIdx] === idx;
                        return (
                          <motion.button
                            key={idx}
                            onClick={() => handleSelectAnswer(idx)}
                            whileTap={{ scale: 0.985 }}
                            className={`w-full flex items-center justify-between px-6 py-4 rounded-xl border text-[16px] font-semibold text-left cursor-pointer transition-all duration-150 ${
                              isSelected
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span>{option}</span>
                            <div
                              className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ml-4 ${
                                isSelected ? "border-primary text-primary" : "border-border"
                              }`}
                            >
                              {isSelected && <div className="h-3 w-3 bg-primary rounded-full" />}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom navigation controls */}
              <div className="flex justify-between items-center border-t border-border pt-6 mt-8">
                <button
                  disabled={currentIdx === 0}
                  onClick={goPrev}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-border rounded-xl hover:bg-muted text-xs font-bold disabled:opacity-30 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Sebelumnya</span>
                </button>

                {currentIdx < quiz.questions.length - 1 ? (
                  <button
                    onClick={goNext}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary hover:bg-muted rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <span>Lanjut</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Mengirim..." : "Selesai & Kirim Ujian"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* RESULTS / EVALUATION SCREEN */}
          {gameState === "results" && scoreData && (
            <div className="p-8 md:p-12 flex flex-col justify-between flex-1 text-center">
              <div className="space-y-6">
                <div className="mx-auto flex justify-center">
                  <AnimatePresence>
                    {scoreData.passed ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 15 } }}
                        className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-3xl shadow-xl"
                      >
                        <CheckCircle2 className="h-14 w-14" />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0, rotate: 45 }}
                        animate={{ scale: 1, rotate: 0, transition: { type: "spring", stiffness: 200, damping: 15 } }}
                        className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-3xl shadow-xl"
                      >
                        <AlertTriangle className="h-14 w-14" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <h3 className="text-[25px] font-black text-foreground">
                    {scoreData.passed ? "Luar Biasa, Kamu Lulus!" : "Belum Berhasil Lulus"}
                  </h3>
                  <p className="text-[15px] text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                    {scoreData.passed
                      ? "Pemahaman teorimu sangat matang! Progres belajar modul ini resmi ditandai selesai."
                      : "Jangan berkecil hati. Bacalah kembali materi pelajaran di halaman sebelumnya dan coba lagi."}
                  </p>
                </div>

                {/* Score panel */}
                <div className="flex flex-col items-center justify-center gap-2 max-w-[260px] mx-auto py-5 px-6 border border-border rounded-2xl bg-secondary/40">
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                    Nilai Kelulusan
                  </span>
                  <strong className={`text-[36px] font-black leading-none ${
                    scoreData.passed ? "text-emerald-500" : "text-destructive"
                  }`}>
                    {scoreData.score}%
                  </strong>
                  <span className="text-xs text-muted-foreground font-semibold mt-1">
                    {scoreData.correctCount} benar dari {scoreData.totalCount} soal
                  </span>
                </div>

                {/* High score updates */}
                <div className="flex items-center justify-center gap-8 max-w-sm mx-auto text-xs py-2">
                  {lastScore !== null && (
                    <div>
                      <span className="text-muted-foreground">Nilai Baru:</span>{" "}
                      <strong className="text-foreground font-bold">{lastScore}%</strong>
                    </div>
                  )}
                  {highestScore !== null && (
                    <div className="border-l border-border pl-8">
                      <span className="text-muted-foreground">Nilai Tertinggi:</span>{" "}
                      <strong className="text-primary font-bold">{highestScore}%</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-border pt-8 mt-10">
                <button
                  onClick={startQuiz}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-3 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Ulangi Kuis</span>
                </button>

                {scoreData.passed && nextNode ? (
                  // Direct Next Navigation Button
                  <Link
                    href={`/roadmaps/${roadmapSlug}/${nextNode.id}`}
                    onClick={onClose}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-7 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg"
                  >
                    <span>Lanjut ke Materi Berikutnya</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-7 py-3 bg-secondary hover:bg-muted text-foreground border border-border rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Kembali ke Materi
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ConsoleQuiz;
