"use client";

import { useState, useEffect } from "react";
import { saveQuiz, saveCodeChallenge, deleteQuiz, deleteCodeChallenge } from "@/app/actions/cms";
import { Trophy, Save, Plus, Trash2, HelpCircle, Code, ListPlus, Trash } from "lucide-react";
import { useModal } from "@/components/ModalProvider";
import { SearchableSelect } from "./SearchableSelect";

interface NodeData {
  id: string;
  label: string;
  type: string;
}

interface RoadmapData {
  _id: string;
  title: string;
  nodes: NodeData[];
}

interface CmsExerciseEditorProps {
  roadmaps: RoadmapData[];
  quizzesCache: Record<string, any>;
  challengesCache: Record<string, any>;
}

export function CmsExerciseEditor({ roadmaps, quizzesCache, challengesCache }: CmsExerciseEditorProps) {
  const { showModal } = useModal();
  const [selectedRoadmapId, setSelectedRoadmapId] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [activeTab, setActiveTab] = useState<"quiz" | "challenge">("quiz");

  const [saving, setSaving] = useState(false);

  // ----------------------------------------------------
  // QUIZ STATE
  // ----------------------------------------------------
  const [quizTitle, setQuizTitle] = useState("");
  const [quizTimeLimit, setQuizTimeLimit] = useState(300); // 5 mins default
  const [questions, setQuestions] = useState<any[]>([]);

  // Question Form State (Temporary)
  const [qText, setQText] = useState("");
  const [qOptions, setQOptions] = useState<string[]>(["", ""]);
  const [qCorrect, setQCorrect] = useState(0);
  const [qExplanation, setQExplanation] = useState("");

  // ----------------------------------------------------
  // CHALLENGE STATE
  // ----------------------------------------------------
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDesc, setChallengeDesc] = useState("");
  const [challengeLang, setChallengeLang] = useState<"javascript" | "html" | "css">("javascript");
  const [challengeInitialCode, setChallengeInitialCode] = useState("");
  const [testCases, setTestCases] = useState<any[]>([]);

  // Test Case Form State (Temporary)
  const [tcDesc, setTcDesc] = useState("");
  const [tcAssert, setTcAssert] = useState("");
  const [tcExpected, setTcExpected] = useState("");

  const selectedRoadmap = roadmaps.find((r) => r._id === selectedRoadmapId);
  const learnableNodes = selectedRoadmap
    ? selectedRoadmap.nodes.filter((n) => n.type !== "phase")
    : [];

  // Load existing records from Cache on selection change
  useEffect(() => {
    if (!selectedRoadmapId || !selectedNodeId) return;

    const cacheKey = `${selectedRoadmapId}-${selectedNodeId}`;
    
    // 1. Load Quiz
    const cachedQuiz = quizzesCache[cacheKey];
    if (cachedQuiz) {
      setQuizTitle(cachedQuiz.title);
      setQuizTimeLimit(cachedQuiz.timeLimit);
      setQuestions(cachedQuiz.questions || []);
    } else {
      const nodeObj = learnableNodes.find((n) => n.id === selectedNodeId);
      setQuizTitle(`Ujian Evaluasi: ${nodeObj ? nodeObj.label : ""}`);
      setQuizTimeLimit(300);
      setQuestions([]);
    }

    // 2. Load Challenge
    const cachedChallenge = challengesCache[cacheKey];
    if (cachedChallenge) {
      setChallengeTitle(cachedChallenge.title);
      setChallengeDesc(cachedChallenge.description);
      setChallengeLang(cachedChallenge.language);
      setChallengeInitialCode(cachedChallenge.initialCode);
      setTestCases(cachedChallenge.testCases || []);
    } else {
      const nodeObj = learnableNodes.find((n) => n.id === selectedNodeId);
      setChallengeTitle(`Praktik Mandiri: ${nodeObj ? nodeObj.label : ""}`);
      setChallengeDesc(`Tulis solusi coding untuk topik ${nodeObj ? nodeObj.label : ""} di sini.`);
      setChallengeLang("javascript");
      setChallengeInitialCode("");
      setTestCases([]);
    }
  }, [selectedRoadmapId, selectedNodeId]);

  // Quiz question builder handlers
  const handleAddOptionField = () => {
    setQOptions((prev) => [...prev, ""]);
  };

  const handleOptionChange = (idx: number, val: string) => {
    setQOptions((prev) => prev.map((o, i) => (i === idx ? val : o)));
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText || qOptions.some((o) => !o.trim())) {
      showModal({
        title: "Pertanyaan Belum Lengkap",
        message: "Silakan isi teks pertanyaan beserta seluruh opsi pilihan jawaban terlebih dahulu.",
        type: "warning",
      });
      return;
    }

    const newQuestion = {
      id: `q-${Date.now()}`,
      questionText: qText,
      options: [...qOptions],
      correctOptionIndex: qCorrect,
      explanation: qExplanation,
    };

    setQuestions((prev) => [...prev, newQuestion]);
    
    // Clear question inputs
    setQText("");
    setQOptions(["", ""]);
    setQCorrect(0);
    setQExplanation("");
  };

  const handleDeleteQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Code challenge test case builder handlers
  const handleAddTestCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tcDesc || !tcAssert || !tcExpected) {
      showModal({
        title: "Test Case Belum Lengkap",
        message: "Deskripsi, kode penguji (assertion), dan keluaran yang diharapkan wajib diisi semuanya.",
        type: "warning",
      });
      return;
    }

    const newTestCase = {
      inputDescription: tcDesc,
      assertionCode: tcAssert,
      expectedOutput: tcExpected,
    };

    setTestCases((prev) => [...prev, newTestCase]);

    // Clear inputs
    setTcDesc("");
    setTcAssert("");
    setTcExpected("");
  };

  const handleDeleteTestCase = (idx: number) => {
    setTestCases((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDeleteOptionField = (idx: number) => {
    if (qOptions.length <= 2) return;
    setQOptions((prev) => prev.filter((_, i) => i !== idx));
    if (qCorrect >= qOptions.length - 1) {
      setQCorrect(Math.max(0, qOptions.length - 2));
    }
  };

  const handleDeleteQuiz = async () => {
    const isConfirmed = confirm("Apakah Anda yakin ingin menghapus kuis ujian untuk topik ini? Data akan dihapus permanen.");
    if (!isConfirmed) return;

    try {
      setSaving(true);
      const res = await deleteQuiz(selectedRoadmapId, selectedNodeId);
      if (res.success) {
        showModal({
          title: "Kuis Berhasil Dihapus",
          message: "Data kuis ujian telah dihapus dari database. Tipe node diatur kembali menjadi topik biasa.",
          type: "success",
        });
        
        // Reset local states
        const nodeObj = learnableNodes.find((n) => n.id === selectedNodeId);
        setQuizTitle(`Ujian Evaluasi: ${nodeObj ? nodeObj.label : ""}`);
        setQuizTimeLimit(300);
        setQuestions([]);

        // Clear cache
        const cacheKey = `${selectedRoadmapId}-${selectedNodeId}`;
        delete quizzesCache[cacheKey];
      } else {
        showModal({
          title: "Gagal Menghapus",
          message: res.error || "Gagal menghapus kuis.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      showModal({
        title: "Kesalahan internal",
        message: "Gagal menghapus kuis.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChallenge = async () => {
    const isConfirmed = confirm("Apakah Anda yakin ingin menghapus tantangan coding untuk topik ini? Data akan dihapus permanen.");
    if (!isConfirmed) return;

    try {
      setSaving(true);
      const res = await deleteCodeChallenge(selectedRoadmapId, selectedNodeId);
      if (res.success) {
        showModal({
          title: "Tantangan Dihapus",
          message: "Tantangan coding telah dihapus. Tipe node dikembalikan menjadi topik biasa.",
          type: "success",
        });

        // Reset local states
        const nodeObj = learnableNodes.find((n) => n.id === selectedNodeId);
        setChallengeTitle(`Praktik Mandiri: ${nodeObj ? nodeObj.label : ""}`);
        setChallengeDesc(`Tulis solusi coding untuk topik ${nodeObj ? nodeObj.label : ""} di sini.`);
        setChallengeLang("javascript");
        setChallengeInitialCode("");
        setTestCases([]);

        // Clear cache
        const cacheKey = `${selectedRoadmapId}-${selectedNodeId}`;
        delete challengesCache[cacheKey];
      } else {
        showModal({
          title: "Gagal Menghapus",
          message: res.error || "Gagal menghapus tantangan.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      showModal({
        title: "Kesalahan internal",
        message: "Gagal menghapus tantangan.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // Save submissions
  const handleSaveQuiz = async () => {
    if (questions.length === 0) {
      showModal({
        title: "Pertanyaan Kosong",
        message: "Tambahkan minimal satu butir pertanyaan sebelum menyimpan konfigurasi kuis.",
        type: "warning",
      });
      return;
    }

    try {
      setSaving(true);
      const res = await saveQuiz({
        roadmapId: selectedRoadmapId,
        nodeId: selectedNodeId,
        title: quizTitle,
        timeLimit: quizTimeLimit,
        questions,
      });

      if (res.success) {
        showModal({
          title: "Kuis Berhasil Disimpan",
          message: "Data ujian kuis berhasil diperbarui dalam database.",
          type: "success",
        });
        const cacheKey = `${selectedRoadmapId}-${selectedNodeId}`;
        quizzesCache[cacheKey] = {
          title: quizTitle,
          timeLimit: quizTimeLimit,
          questions,
        };
      } else {
        showModal({
          title: "Penyimpanan Gagal",
          message: res.error || "Gagal menyimpan konfigurasi kuis ke server.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      showModal({
        title: "Kesalahan Database",
        message: "Terjadi gangguan koneksi data saat menyimpan kuis.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChallenge = async () => {
    if (testCases.length === 0) {
      showModal({
        title: "Test Case Kosong",
        message: "Tambahkan minimal satu butir penguji (test case) sebelum menyimpan konfigurasi tantangan kode.",
        type: "warning",
      });
      return;
    }

    try {
      setSaving(true);
      const res = await saveCodeChallenge({
        roadmapId: selectedRoadmapId,
        nodeId: selectedNodeId,
        title: challengeTitle,
        description: challengeDesc,
        language: challengeLang,
        initialCode: challengeInitialCode,
        testCases,
      });

      if (res.success) {
        showModal({
          title: "Tantangan Kode Disimpan",
          message: "Konfigurasi tantangan coding berhasil diperbarui.",
          type: "success",
        });
        const cacheKey = `${selectedRoadmapId}-${selectedNodeId}`;
        challengesCache[cacheKey] = {
          title: challengeTitle,
          description: challengeDesc,
          language: challengeLang,
          initialCode: challengeInitialCode,
          testCases,
        };
      } else {
        showModal({
          title: "Gagal Menyimpan",
          message: res.error || "Gagal menyimpan konfigurasi coding challenge.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      showModal({
        title: "Kesalahan internal",
        message: "Gagal memproses tantangan kode.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-xs">
      
      {/* LEFT PANEL: Selectors */}
      <div className="lg:col-span-4 bg-card border border-border rounded-lg p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
          <Trophy className="h-4.5 w-4.5 text-primary" />
          <span>Pilih Target Node</span>
        </h3>

        <div className="space-y-3 pt-2">
          <div>
            <label className="block font-semibold text-muted-foreground uppercase mb-1">
              Pilih Peta Jalan (Roadmap)
            </label>
            <SearchableSelect
              value={selectedRoadmapId}
              onChange={(val) => {
                setSelectedRoadmapId(val);
                setSelectedNodeId("");
              }}
              options={[
                { value: "", label: "-- Pilih Roadmap --" },
                ...roadmaps.map((r) => ({ value: r._id || "", label: r.title })),
              ]}
              placeholder="Pilih Roadmap"
            />
          </div>

          <div>
            <label className="block font-semibold text-muted-foreground uppercase mb-1">
              Pilih Node Modul
            </label>
            <SearchableSelect
              disabled={!selectedRoadmapId}
              value={selectedNodeId}
              onChange={(val) => setSelectedNodeId(val)}
              options={[
                { value: "", label: "-- Pilih Node --" },
                ...learnableNodes.map((n) => ({ value: n.id, label: `${n.label} (${n.id})` })),
              ]}
              placeholder="Pilih Node"
            />
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Workspace Editors */}
      <div className="lg:col-span-8 bg-card border border-border rounded-lg shadow-sm overflow-hidden min-h-[480px] flex flex-col">
        {selectedRoadmapId && selectedNodeId ? (
          <>
            {/* Tab Swapper */}
            <div className="px-5 py-3 border-b border-border bg-secondary flex justify-between items-center shrink-0">
              <span className="font-semibold text-foreground">
                Ujian & Latihan: {learnableNodes.find(n => n.id === selectedNodeId)?.label}
              </span>

              <div className="flex border border-border rounded bg-background p-0.5">
                <button
                  onClick={() => setActiveTab("quiz")}
                  className={`flex items-center gap-1 px-3 py-1 rounded transition-all cursor-pointer ${
                    activeTab === "quiz" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  <ListPlus className="h-3.5 w-3.5" />
                  <span>Kuis Pilihan Ganda</span>
                </button>
                <button
                  onClick={() => setActiveTab("challenge")}
                  className={`flex items-center gap-1 px-3 py-1 rounded transition-all cursor-pointer ${
                    activeTab === "challenge" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>Tantangan Code Editor</span>
                </button>
              </div>
            </div>

            {/* Content areas */}
            <div className="p-5 flex-1 space-y-6">
              
              {/* TAB 1: QUIZ CONFIGURATION */}
              {activeTab === "quiz" && (
                <div className="space-y-6">
                  {/* Basic Quiz Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-muted-foreground uppercase mb-1">
                        Judul Kuis Ujian
                      </label>
                      <input
                        type="text"
                        value={quizTitle}
                        onChange={(e) => setQuizTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
                        placeholder="Ujian Kuis..."
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-muted-foreground uppercase mb-1">
                        Batas Waktu (Detik, 0 = Unlimited)
                      </label>
                      <input
                        type="number"
                        value={quizTimeLimit}
                        onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Add Question form */}
                  <form onSubmit={handleAddQuestion} className="p-4 bg-secondary border border-border rounded space-y-3">
                    <h4 className="font-semibold text-foreground">Tambah Butir Soal</h4>
                    
                    <div>
                      <label className="block text-[9px] font-semibold text-muted-foreground uppercase mb-1">
                        Pertanyaan Soal
                      </label>
                      <input
                        type="text"
                        required
                        value={qText}
                        onChange={(e) => setQText(e.target.value)}
                        className="w-full px-3 py-1.5 bg-background border border-border rounded text-[11px] text-foreground focus:outline-none"
                        placeholder="e.g. Manakah yang termasuk semantic tag di HTML?"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[9px] font-semibold text-muted-foreground uppercase mb-0.5">
                        Pilihan Jawaban (Choices)
                      </label>
                      {qOptions.map((option, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="font-mono text-muted-foreground w-4">{String.fromCharCode(65 + idx)})</span>
                          <input
                            type="text"
                            required
                            value={option}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-background border border-border rounded text-[11px] text-foreground focus:outline-none"
                            placeholder={`Choice ${idx + 1}...`}
                          />
                          {qOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteOptionField(idx)}
                              className="p-1.5 text-destructive hover:bg-destructive/10 rounded cursor-pointer transition-colors"
                              title="Hapus opsi"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddOptionField}
                        className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        + Tambah Opsi Pilihan
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-[9px] font-semibold text-muted-foreground uppercase mb-1">
                          Kunci Jawaban Benar
                        </label>
                        <SearchableSelect
                          value={String(qCorrect)}
                          onChange={(val) => setQCorrect(Number(val))}
                          options={qOptions.map((_, i) => ({
                            value: String(i),
                            label: `Pilihan ${String.fromCharCode(65 + i)}`,
                          }))}
                          placeholder="Pilih Kunci Jawaban"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-muted-foreground uppercase mb-1">
                          Penjelasan (Explanation)
                        </label>
                        <input
                          type="text"
                          value={qExplanation}
                          onChange={(e) => setQExplanation(e.target.value)}
                          className="w-full px-3 py-1.5 bg-background border border-border rounded text-[11px] text-foreground focus:outline-none"
                          placeholder="e.g. Tag <main> dan <article> adalah semantic tag..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold cursor-pointer"
                      >
                        Simpan Pertanyaan
                      </button>
                    </div>
                  </form>

                  {/* List of current questions */}
                  <div className="border border-border rounded overflow-hidden">
                    <div className="bg-muted/40 p-2.5 font-semibold text-muted-foreground border-b border-border">
                      Soal Terdaftar ({questions.length})
                    </div>
                    <div className="divide-y divide-border bg-card max-h-[200px] overflow-y-auto">
                      {questions.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          Belum ada pertanyaan kuis terdaftar.
                        </div>
                      ) : (
                        questions.map((q, idx) => (
                          <div key={q.id || idx} className="p-3 flex items-center justify-between hover:bg-muted/10">
                            <div>
                              <p className="font-semibold text-foreground">
                                {idx + 1}. {q.questionText}
                              </p>
                              <p className="text-[10px] text-emerald-600 font-medium mt-1">
                                Kunci: {String.fromCharCode(65 + q.correctOptionIndex)}) {q.options[q.correctOptionIndex]}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteQuestion(idx)}
                              className="p-1.5 text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    {quizzesCache[`${selectedRoadmapId}-${selectedNodeId}`] ? (
                      <button
                        onClick={handleDeleteQuiz}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded font-semibold cursor-pointer disabled:opacity-50 transition-all text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus Kuis Ujian</span>
                      </button>
                    ) : (
                      <div />
                    )}
                    <button
                      onClick={handleSaveQuiz}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded font-semibold cursor-pointer disabled:opacity-50 text-xs"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Simpan Kuis Ujian</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: CODE CHALLENGE CONFIGURATION */}
              {activeTab === "challenge" && (
                <div className="space-y-6">
                  {/* Basic challenge fields */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block font-semibold text-muted-foreground uppercase mb-1">
                        Judul Tantangan Coding
                      </label>
                      <input
                        type="text"
                        value={challengeTitle}
                        onChange={(e) => setChallengeTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
                        placeholder="Tantangan coding..."
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-muted-foreground uppercase mb-1">
                        Bahasa Pemrograman
                      </label>
                        <SearchableSelect
                          value={challengeLang}
                          onChange={(val) => setChallengeLang(val as any)}
                          options={[
                            { value: "javascript", label: "JavaScript" },
                            { value: "html", label: "HTML" },
                            { value: "css", label: "CSS" },
                          ]}
                          placeholder="Pilih Bahasa"
                        />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-muted-foreground uppercase mb-1">
                      Deskripsi Panduan Kerja (Markdown)
                    </label>
                    <textarea
                      value={challengeDesc}
                      onChange={(e) => setChallengeDesc(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-background border border-border rounded text-xs text-foreground focus:outline-none resize-y font-mono leading-relaxed"
                      placeholder="Tulis instruksi pengerjaan challenge..."
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-muted-foreground uppercase mb-1">
                      Kode Kerangka Awal (Initial Template)
                    </label>
                    <textarea
                      value={challengeInitialCode}
                      onChange={(e) => setChallengeInitialCode(e.target.value)}
                      rows={5}
                      className="w-full p-3 bg-background border border-border rounded text-xs text-foreground focus:outline-none resize-y font-mono leading-relaxed"
                      placeholder="// Tulis kode template awal untuk murid di sini..."
                    />
                  </div>

                  {/* Add Test Case Form */}
                  <form onSubmit={handleAddTestCase} className="p-4 bg-secondary border border-border rounded space-y-3">
                    <h4 className="font-semibold text-foreground">Tambah Test Case Pemeriksa</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] font-semibold text-muted-foreground uppercase mb-1">
                          Deskripsi Cek (Input)
                        </label>
                        <input
                          type="text"
                          required
                          value={tcDesc}
                          onChange={(e) => setTcDesc(e.target.value)}
                          className="w-full px-3 py-1.5 bg-background border border-border rounded text-[11px] text-foreground focus:outline-none"
                          placeholder="e.g. sum(2, 3) returns 5"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-muted-foreground uppercase mb-1">
                          Assertion Code (JS statement)
                        </label>
                        <input
                          type="text"
                          required
                          value={tcAssert}
                          onChange={(e) => setTcAssert(e.target.value)}
                          className="w-full px-3 py-1.5 bg-background border border-border rounded text-[11px] text-foreground focus:outline-none font-mono"
                          placeholder="e.g. typeof sum === 'function' && sum(2,3) === 5"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-muted-foreground uppercase mb-1">
                          Hasil Ekspektasi (Output string)
                        </label>
                        <input
                          type="text"
                          required
                          value={tcExpected}
                          onChange={(e) => setTcExpected(e.target.value)}
                          className="w-full px-3 py-1.5 bg-background border border-border rounded text-[11px] text-foreground focus:outline-none"
                          placeholder="e.g. 5"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold cursor-pointer"
                      >
                        Tambahkan Test Case
                      </button>
                    </div>
                  </form>

                  {/* List of current test cases */}
                  <div className="border border-border rounded overflow-hidden">
                    <div className="bg-muted/40 p-2.5 font-semibold text-muted-foreground border-b border-border">
                      Test Case Terdaftar ({testCases.length})
                    </div>
                    <div className="divide-y divide-border bg-card max-h-[180px] overflow-y-auto">
                      {testCases.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          Belum ada test case pemeriksaan terdaftar.
                        </div>
                      ) : (
                        testCases.map((tc, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between hover:bg-muted/10 font-mono text-[10px]">
                            <div>
                              <p className="font-semibold text-foreground text-xs font-sans">
                                Cek: {tc.inputDescription}
                              </p>
                              <p className="text-primary mt-1">
                                Assert: {tc.assertionCode}
                              </p>
                              <p className="text-emerald-500">
                                Output: {tc.expectedOutput}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteTestCase(idx)}
                              className="p-1.5 text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 shrink-0" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    {challengesCache[`${selectedRoadmapId}-${selectedNodeId}`] ? (
                      <button
                        onClick={handleDeleteChallenge}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded font-semibold cursor-pointer disabled:opacity-50 transition-all text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus Tantangan Coding</span>
                      </button>
                    ) : (
                      <div />
                    )}
                    <button
                      onClick={handleSaveChallenge}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded font-semibold cursor-pointer disabled:opacity-50 text-xs"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Simpan Challenge Editor</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          </>
        ) : (
          /* Placeholder display when no selection */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <HelpCircle className="h-10 w-10 text-muted-foreground mb-3 animate-pulse" />
            <h4 className="font-semibold text-foreground">Pilih target modul latihan</h4>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-xs">
              Pilih peta jalan di panel kiri dan klik node topik untuk mulai menyusun kuis atau tantangan coding.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

export default CmsExerciseEditor;
