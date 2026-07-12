"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowLeft, Trophy, Zap, Code, Layers } from "lucide-react";

interface NodeData {
  id: string;
  label: string;
  type: "phase" | "topic" | "quiz" | "challenge";
  parentId?: string;
  x?: number;
  y?: number;
}

interface RoadmapCanvasProps {
  roadmap: {
    title: string;
    slug: string;
    description: string;
    nodes: NodeData[];
    color?: string;
  };
  completedNodes: string[];
  isLoggedIn: boolean;
}

// Node visual dimensions
const NODE_DIM = {
  phase: { w: 260, h: 52 },
  topic: { w: 220, h: 62 },
  quiz: { w: 220, h: 62 },
  challenge: { w: 220, h: 62 },
};

// Spacing constants
const PHASE_X_CENTER = 600;    // Phases centered at this X
const PHASE_Y_GAP = 200;       // Vertical gap between phase starts
const PHASE_FIRST_Y = 40;

const TOPIC_H_GAP = 40;        // Horizontal gap between topics in same phase
const TOPIC_Y_OFFSET = 100;    // Topics start this many px below their phase

function computeLayout(nodes: NodeData[]): NodeData[] {
  const result: NodeData[] = [];
  let phaseY = PHASE_FIRST_Y;

  // group topics by phase
  const phases = nodes.filter((n) => n.type === "phase");
  const topicsByPhase: Record<string, NodeData[]> = {};
  nodes.forEach((n) => {
    if (n.type !== "phase") {
      const key = n.parentId || "__orphan__";
      if (!topicsByPhase[key]) topicsByPhase[key] = [];
      topicsByPhase[key].push(n);
    }
  });

  phases.forEach((phase) => {
    const dim = NODE_DIM.phase;
    const phaseX = PHASE_X_CENTER - dim.w / 2;
    result.push({ ...phase, x: phaseX, y: phaseY });

    const children = topicsByPhase[phase.id] || [];
    if (children.length > 0) {
      const totalW =
        children.length * NODE_DIM.topic.w +
        (children.length - 1) * TOPIC_H_GAP;
      let startX = PHASE_X_CENTER - totalW / 2;
      const childY = phaseY + dim.h + TOPIC_Y_OFFSET;

      children.forEach((child) => {
        const childDim = NODE_DIM[child.type as keyof typeof NODE_DIM] || NODE_DIM.topic;
        result.push({ ...child, x: startX, y: childY });
        startX += childDim.w + TOPIC_H_GAP;
      });

      phaseY = childY + NODE_DIM.topic.h + PHASE_Y_GAP;
    } else {
      phaseY += dim.h + PHASE_Y_GAP;
    }
  });

  // Orphan topics (no phase parent)
  const orphans = topicsByPhase["__orphan__"] || [];
  if (orphans.length > 0) {
    const totalW =
      orphans.length * NODE_DIM.topic.w + (orphans.length - 1) * TOPIC_H_GAP;
    let startX = PHASE_X_CENTER - totalW / 2;
    orphans.forEach((child) => {
      result.push({ ...child, x: startX, y: phaseY });
      startX += NODE_DIM.topic.w + TOPIC_H_GAP;
    });
  }

  return result;
}

export function RoadmapCanvas({ roadmap, completedNodes, isLoggedIn }: RoadmapCanvasProps) {
  const [activeTab, setActiveTab] = useState<"canvas" | "list">("canvas");

  // Compute layout from hierarchy (ignore stored x/y completely)
  const processedNodes = React.useMemo(() => computeLayout(roadmap.nodes), [roadmap.nodes]);

  // Calculate canvas bounding box
  const dimensions = React.useMemo(() => {
    let maxX = 800;
    let maxY = 600;
    processedNodes.forEach((n) => {
      const dim = NODE_DIM[n.type as keyof typeof NODE_DIM] || NODE_DIM.topic;
      maxX = Math.max(maxX, (n.x || 0) + dim.w);
      maxY = Math.max(maxY, (n.y || 0) + dim.h);
    });
    return { width: maxX + 120, height: maxY + 120 };
  }, [processedNodes]);

  const getNodeCenter = (node: NodeData) => {
    const dim = NODE_DIM[node.type as keyof typeof NODE_DIM] || NODE_DIM.topic;
    const x = node.x || 0;
    const y = node.y || 0;
    return {
      cx: x + dim.w / 2,
      cy: y + dim.h / 2,
      topY: y,
      bottomY: y + dim.h,
    };
  };

  // Group nodes into phases for the mobile list view
  const groupedPhases = React.useMemo(() => {
    const phases: { phaseNode: NodeData; children: NodeData[] }[] = [];
    const phaseNodes = roadmap.nodes.filter((n) => n.type === "phase");
    phaseNodes.forEach((phase) => {
      const children = roadmap.nodes.filter(
        (n) => n.type !== "phase" && n.parentId === phase.id
      );
      phases.push({ phaseNode: phase, children });
    });
    return phases;
  }, [roadmap.nodes]);

  const nonPhaseNodes = roadmap.nodes.filter((n) => n.type !== "phase");
  const completionPercentage =
    nonPhaseNodes.length > 0
      ? Math.round((completedNodes.length / nonPhaseNodes.length) * 100)
      : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      {/* Grid Overlay background */}
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

      {/* Top sticky action header */}
      <header className="sticky top-0 z-30 w-full border-b border-border glass-panel">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-1.5 rounded hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-foreground">
                {roadmap.title}
              </h1>
              <p className="text-[10px] text-muted-foreground">Roadmap Karir Interactive</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Tab Swapper */}
            <div className="flex items-center border border-border rounded bg-secondary p-0.5 text-xs">
              <button
                onClick={() => setActiveTab("canvas")}
                className={`px-3 py-1 rounded transition-all cursor-pointer font-medium ${
                  activeTab === "canvas"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Canvas Flow
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`px-3 py-1 rounded transition-all cursor-pointer font-medium ${
                  activeTab === "list"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                List Timeline
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Stats Panel */}
      <section className="bg-card border-b border-border py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1.5">
              {roadmap.title}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{roadmap.description}</p>
          </div>

          {isLoggedIn ? (
            <div className="flex items-center gap-4 border border-border rounded-lg p-4 bg-background min-w-[260px]">
              <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-full shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="w-full">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span>Progres Belajar</span>
                  <span className="text-primary">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {completedNodes.length} dari {nonPhaseNodes.length} materi selesai
                </p>
              </div>
            </div>
          ) : (
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-4 max-w-sm flex gap-3">
              <Zap className="h-5 w-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  Login Google Untuk Akses Kuis &amp; Code Editor
                </h4>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Simpan riwayat belajar dan sertifikasi progres dengan masuk menggunakan akun
                  Google Anda.
                </p>
                <Link
                  href="/login"
                  className="inline-block mt-2 text-[10px] font-bold text-primary hover:underline"
                >
                  Sign In Sekarang &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Workspace Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 relative z-10">
        {activeTab === "canvas" ? (
          /* CANVAS VIEW */
          <div
            className="hidden lg:block overflow-auto border border-border rounded-2xl bg-card/60 shadow-xl relative min-h-[650px] h-[75vh] p-8 scroll-smooth"
            style={{
              backgroundImage: "radial-gradient(var(--border) 1px, transparent 1.5px)",
              backgroundSize: "20px 20px",
            }}
          >
            <div
              className="relative mx-auto my-6"
              style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
            >
              {/* SVG Connections */}
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
              >
                <defs>
                  <linearGradient id="completed-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>

                {processedNodes.map((node) => {
                  if (!node.parentId) return null;
                  const parent = processedNodes.find((p) => p.id === node.parentId);
                  if (!parent) return null;

                  const parentCenter = getNodeCenter(parent);
                  const childCenter = getNodeCenter(node);

                  const startX = parentCenter.cx;
                  const startY = parentCenter.bottomY;
                  const endX = childCenter.cx;
                  const endY = childCenter.topY;
                  const midY = (startY + endY) / 2;
                  const isCompleted = completedNodes.includes(node.id);

                  return (
                    <g key={`link-${parent.id}-${node.id}`}>
                      {isCompleted && (
                        <path
                          d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
                          fill="none"
                          stroke="url(#completed-grad)"
                          strokeWidth="4"
                          className="opacity-25 blur-[2px]"
                        />
                      )}
                      <path
                        d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
                        fill="none"
                        strokeWidth="2"
                        className={`transition-all duration-300 ${
                          isCompleted
                            ? "stroke-emerald-500"
                            : "stroke-border dark:stroke-zinc-700"
                        }`}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* HTML Nodes Overlay */}
              {processedNodes.map((node) => {
                const dim = NODE_DIM[node.type as keyof typeof NODE_DIM] || NODE_DIM.topic;
                const x = node.x || 0;
                const y = node.y || 0;
                const isCompleted = completedNodes.includes(node.id);

                return (
                  <div
                    key={node.id}
                    className="absolute"
                    style={{ left: `${x}px`, top: `${y}px`, width: `${dim.w}px`, height: `${dim.h}px` }}
                  >
                    {node.type === "phase" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center rounded-2xl bg-slate-900 border-2 border-indigo-500/50 shadow-md shadow-indigo-500/10 text-white font-extrabold text-[10px] tracking-wider uppercase px-4 py-2.5 text-center select-none">
                        <Layers className="h-4 w-4 text-indigo-400 mb-1 shrink-0" />
                        <span className="leading-tight">{node.label}</span>
                      </div>
                    ) : (
                      <Link
                        href={`/roadmaps/${roadmap.slug}/${node.id}`}
                        className={`w-full h-full flex items-center justify-between pl-4 pr-3.5 py-3 border rounded-xl shadow-sm bg-card hover:shadow-md transition-all duration-200 cursor-pointer ${
                          isCompleted
                            ? "border-l-[5px] border-l-emerald-500 border-t-border border-r-border border-b-border bg-emerald-500/5 hover:bg-emerald-500/10"
                            : node.type === "quiz"
                            ? "border-l-[5px] border-l-amber-500 border-t-border border-r-border border-b-border bg-amber-500/5 hover:bg-amber-500/10"
                            : node.type === "challenge"
                            ? "border-l-[5px] border-l-primary border-t-border border-r-border border-b-border bg-primary/5 hover:bg-primary/10"
                            : "border-l-[5px] border-l-muted-foreground/30 border-t-border border-r-border border-b-border hover:border-l-primary hover:bg-muted/50"
                        }`}
                      >
                        <div className="truncate mr-2">
                          <p className="text-[12px] font-extrabold truncate text-foreground/90">
                            {node.label}
                          </p>
                          <span className="text-[8px] text-muted-foreground uppercase font-black tracking-wider block mt-0.5">
                            {node.type === "topic" && "Materi"}
                            {node.type === "quiz" && "Ujian Kuis"}
                            {node.type === "challenge" && "Tantangan Kode"}
                          </span>
                        </div>

                        <div className="shrink-0">
                          {isCompleted ? (
                            <div className="p-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                          ) : node.type === "quiz" ? (
                            <div className="p-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                              <Trophy className="h-3.5 w-3.5" />
                            </div>
                          ) : node.type === "challenge" ? (
                            <div className="p-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                              <Code className="h-3.5 w-3.5" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-border bg-card" />
                          )}
                        </div>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* LIST / MOBILE TIMELINE VIEW */}
        <div
          className={`${activeTab === "canvas" ? "lg:hidden" : ""} max-w-2xl mx-auto space-y-8 relative z-10`}
        >
          {groupedPhases.map(({ phaseNode, children }) => (
            <div key={phaseNode.id} className="space-y-4">
              {/* Phase header card */}
              <div className="px-4 py-2.5 rounded bg-primary text-primary-foreground font-semibold text-xs tracking-wider uppercase shadow-sm inline-block">
                {phaseNode.label}
              </div>

              {/* Topics list timeline */}
              <div className="border-l border-border ml-4 pl-6 space-y-4 relative">
                {children.map((node) => {
                  const isCompleted = completedNodes.includes(node.id);
                  return (
                    <div key={node.id} className="relative">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-[-31px] top-1.5 h-4 w-4 rounded-full border-2 bg-card flex items-center justify-center ${
                          isCompleted
                            ? "border-emerald-500 text-emerald-500"
                            : node.type === "quiz"
                            ? "border-amber-500 text-amber-500"
                            : node.type === "challenge"
                            ? "border-indigo-500 text-indigo-500"
                            : "border-border"
                        }`}
                      >
                        {isCompleted && <div className="h-2 w-2 bg-emerald-500 rounded-full" />}
                      </div>

                      {/* Card block */}
                      <Link
                        href={`/roadmaps/${roadmap.slug}/${node.id}`}
                        className={`block p-4 border rounded-lg bg-card hover:bg-muted transition-all cursor-pointer ${
                          isCompleted ? "border-emerald-500/50 bg-emerald-500/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">{node.label}</h4>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                              {node.type === "topic" && "📚 Modul Materi"}
                              {node.type === "quiz" && "🏆 Ujian Soal Pilihan Ganda"}
                              {node.type === "challenge" && "💻 Tantangan Coding Praktik"}
                            </span>
                          </div>

                          <div>
                            {isCompleted ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                                Selesai
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-secondary text-muted-foreground text-[10px] font-medium border border-border">
                                Mulai
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default RoadmapCanvas;
