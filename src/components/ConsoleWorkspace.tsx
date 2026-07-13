"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Edit2,
  Sparkles,
  ExternalLink,
  BookOpen,
  Trophy,
  Code2,
  LogIn
} from "lucide-react";
import CompletionButton from "./CompletionButton";
import { ThemeToggle } from "./ThemeToggle";
import { signIn } from "next-auth/react";

interface Node {
  id: string;
  label: string;
  type: string;
  parentId?: string;
}

interface ConsoleWorkspaceProps {
  roadmap: {
    title: string;
    slug: string;
    nodes: Node[];
  };
  currentNode: Node;
  completedNodes: string[];
  materialContent: string;
  safeQuiz: any;
  safeChallenge: any;
  isLoggedIn: boolean;
  userRole?: string;
}

export function ConsoleWorkspace({
  roadmap,
  currentNode,
  completedNodes,
  materialContent,
  safeQuiz,
  safeChallenge,
  isLoggedIn,
  userRole
}: ConsoleWorkspaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");

  useEffect(() => {
    // Open sidebar by default on desktop screens (>= 768px)
    if (window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);

  // Resize & Split Layout States
  const [sidebarWidth, setSidebarWidth] = useState(250); // in pixels

  // Filter topic nodes to handle navigation ordering (include materials, quizzes, and challenges)
  const topics = roadmap.nodes.filter((n) => n.type !== "phase");
  const currentIdx = topics.findIndex((t) => t.id === currentNode.id);
  const prevNode = currentIdx > 0 ? topics[currentIdx - 1] : null;
  const nextNode = currentIdx < topics.length - 1 ? topics[currentIdx + 1] : null;

  // Group nodes by phase for the sidebar
  const phases = roadmap.nodes.filter((n) => n.type === "phase");
  const getPhaseChildren = (phaseId: string) => {
    return topics.filter((t) => t.parentId === phaseId);
  };

  const hasPractice = !!(safeQuiz || safeChallenge);

  // Drag handlers
  const handleSidebarDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newWidth = startWidth + deltaX;
      newWidth = Math.max(180, Math.min(450, newWidth));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // ──────────────────────────────────────────────────────────────
  // Custom Markdown components — premium sanbercode-style reader
  // ──────────────────────────────────────────────────────────────
  const MarkdownComponents = {
    // Paragraphs → div to avoid nesting hydration issues
    // Target: ~20.5px like Dicoding/Sanbercode, line-height 1.9 for comfort
    p: ({ children }: any) => {
      // Detect [!NOTE] callout blocks
      const childText = typeof children === "string" ? children : (Array.isArray(children) ? children.join("") : "");
      if (childText.startsWith("[!NOTE]")) {
        const noteText = childText.replace(/^\[!NOTE\]\s*/, "");
        return (
          <div className="my-8 flex gap-4 rounded-r-xl border-l-4 border-primary bg-primary/[0.07] px-6 py-5">
            <svg className="w-5 h-5 text-primary shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div className="text-[18px] text-foreground/85 leading-relaxed">{noteText}</div>
          </div>
        );
      }
      return (
        <div className="text-[20.5px] leading-[1.9] text-foreground/80 mb-7 font-normal tracking-[0.01em]">{children}</div>
      );
    },

    // Headings — generous spacing before/after so sections breathe
    h1: ({ children }: any) => (
      <h1 className="text-[36px] md:text-[42px] font-black tracking-tight text-foreground mb-8 mt-0 leading-[1.1]">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-[26px] md:text-[30px] font-extrabold tracking-tight text-foreground mt-16 mb-6 leading-snug">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-[21.5px] md:text-[24px] font-bold text-foreground mt-14 mb-4 leading-snug">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-[19px] font-bold text-foreground mt-12 mb-3">{children}</h4>
    ),

    // Lists — breathing room between items
    ul: ({ children }: any) => (
      <ul className="my-7 ml-1 space-y-3.5">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="my-7 ml-1 space-y-3.5 list-decimal list-inside">{children}</ol>
    ),
    li: ({ ordered, index, children }: any) => (
      <li className="flex items-start gap-3.5 text-[20.5px] text-foreground/80 leading-[1.85]">
        {ordered ? (
          <span className="mt-[2px] shrink-0 font-bold text-primary font-mono text-[18px] select-none">{(index ?? 0) + 1}.</span>
        ) : (
          <span className="mt-[11px] shrink-0 w-2 h-2 rounded-full bg-primary/60" />
        )}
        <span>{children}</span>
      </li>
    ),

    // Blockquote — generous padding, clear visual separation
    blockquote: ({ children }: any) => (
      <div className="my-9 flex gap-4 rounded-r-xl border-l-4 border-primary bg-primary/[0.07] px-6 py-6">
        <div className="text-[19.5px] text-foreground/80 leading-[1.85] [&>div]:mb-0">{children}</div>
      </div>
    ),

    // Horizontal rule — strong visual divider between sections
    hr: () => <hr className="my-14 border-border" />,

    // Bold / strong
    strong: ({ children }: any) => (
      <strong className="font-extrabold text-foreground">{children}</strong>
    ),

    // Italic
    em: ({ children }: any) => (
      <em className="italic text-foreground/75">{children}</em>
    ),

    // Inline code
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      const lang = match ? match[1] : "";
      const codeString = String(children).replace(/\n$/, "");

      // Block code — VSCode Dark+ syntax highlighting — extra breathing room
      if (!inline && match) {
        return (
          <div className="code-block-wrapper my-10 rounded-xl overflow-hidden border border-white/[0.07] shadow-2xl">
            {/* macOS-style title bar */}
            <div className="flex items-center justify-between bg-[#1e1e2e] px-4 py-2.5 border-b border-white/6">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57] hover:opacity-80 transition-opacity cursor-default" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e] hover:opacity-80 transition-opacity cursor-default" />
                <span className="w-3 h-3 rounded-full bg-[#28c840] hover:opacity-80 transition-opacity cursor-default" />
              </div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-white/25 font-mono">{lang}</span>
              <span className="text-[10px] text-white/15 font-mono select-none">code</span>
            </div>
            {/* VSCode Dark+ highlighted code */}
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={lang}
              PreTag="div"
              customStyle={{
                margin: 0,
                padding: "1.25rem 1.5rem",
                background: "#1e1e2e",
                fontSize: "13.5px",
                lineHeight: "1.8",
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              }}
              codeTagProps={{
                style: {
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                }
              }}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      }
      // Inline code
      return (
        <code
          className="mx-0.5 rounded-md bg-primary/12 border border-primary/20 px-[5px] py-[2px] text-[13.5px] font-mono font-semibold text-primary"
          {...props}
        >
          {children}
        </code>
      );
    },

    // Links with special handling
    a: ({ href, children }: any) => {
      // ── YouTube embed ──
      if (href && (href.includes("youtube.com/watch") || href.includes("youtu.be") || href.includes("youtube.com/embed"))) {
        let videoId = "";
        if (href.includes("youtube.com/watch")) {
          videoId = new URLSearchParams(href.split("?")[1] || "").get("v") || "";
        } else {
          videoId = href.split("/").pop()?.split("?")[0] || "";
        }
        if (videoId) {
          return (
            // Video embed — generous top/bottom margin like Sanbercode
            <div className="my-10">
              <div className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-2.75 12.84 12.84 0 0 0-1.81-.17H10a12.84 12.84 0 0 0-1.81.17 4.83 4.83 0 0 1-3.77 2.75A4.86 4.86 0 0 0 2 11.09V13a4.86 4.86 0 0 0 2.42 4.4 4.83 4.83 0 0 1 3.77 2.75 12.84 12.84 0 0 0 1.81.17H14a12.84 12.84 0 0 0 1.81-.17 4.83 4.83 0 0 1 3.77-2.75A4.86 4.86 0 0 0 22 13v-1.91a4.86 4.86 0 0 0-2.41-4.4ZM10 15.5v-7l6 3.5Z"/></svg>
                Video Materi
              </div>
              <div className="relative w-full aspect-video overflow-hidden rounded-2xl border border-border shadow-2xl bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                  title="Video Materi"
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          );
        }
      }

      // ── CTA Button ──
      if (href && (href.endsWith("#cta") || href.endsWith("#button"))) {
        const cleanHref = href.replace(/#(cta|button)$/, "");
        return (
          <div className="my-6">
            <a
              href={cleanHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground hover:bg-primary/95 text-[15px] font-bold rounded-xl shadow-lg transition-colors no-underline cursor-pointer"
            >
              <span>{children}</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        );
      }

      // ── Link Card (any URL with #linkcard) ──
      if (href && href.endsWith("#linkcard")) {
        const cleanHref = href.replace(/#linkcard$/, "");
        let domain = "";
        let badge = "Tautan";
        let badgeColor = "bg-violet-500/10 text-violet-400 border-violet-500/20";
        try { domain = new URL(cleanHref).hostname.replace("www.", ""); badge = domain; } catch {}
        if (cleanHref.includes("w3schools.com")) { badge = "W3Schools"; badgeColor = "bg-green-500/10 text-green-400 border-green-500/20"; }
        if (cleanHref.includes("mozilla.org")) { badge = "MDN Web Docs"; badgeColor = "bg-orange-500/10 text-orange-400 border-orange-500/20"; }
        if (cleanHref.includes("freecodecamp.org")) { badge = "freeCodeCamp"; badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20"; }
        return (
          <a
            href={cleanHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-5 my-6 p-5 rounded-2xl border border-primary/20 bg-primary/4 hover:bg-primary/8 hover:border-primary/40 transition-all duration-200 no-underline cursor-pointer"
          >
            <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <ExternalLink className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[11px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-md ${badgeColor}`}>{badge}</span>
                <span className="text-[11px] text-muted-foreground">Belajar Lengkap di Sini</span>
              </div>
              <span className="text-[16px] font-semibold text-foreground group-hover:text-primary transition-colors truncate block">{children}</span>
            </div>
            <svg className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </a>
        );
      }

      // ── External learning resource card ──
      const isLearningResource = href && (
        href.includes("w3schools.com") ||
        href.includes("mozilla.org") ||
        href.includes("freecodecamp.org") ||
        href.includes("developer.chrome.com") ||
        href.includes("css-tricks.com")
      );
      if (isLearningResource) {
        let badge = "Dokumentasi";
        let badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
        if (href.includes("w3schools.com")) { badge = "W3Schools"; badgeColor = "bg-green-500/10 text-green-400 border-green-500/20"; }
        if (href.includes("mozilla.org")) { badge = "MDN Web Docs"; badgeColor = "bg-orange-500/10 text-orange-400 border-orange-500/20"; }
        if (href.includes("freecodecamp.org")) { badge = "freeCodeCamp"; badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20"; }

        return (
          // Resource card — generous margin for visual separation
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-5 my-9 p-5 rounded-2xl border border-primary/20 bg-primary/4 hover:bg-primary/8 hover:border-primary/40 transition-all duration-200 no-underline cursor-pointer"
          >
            <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <ExternalLink className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[11px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-md ${badgeColor}`}>{badge}</span>
                <span className="text-[11px] text-muted-foreground">Belajar Lengkap di Sini</span>
              </div>
              <span className="text-[16px] font-semibold text-foreground group-hover:text-primary transition-colors truncate block">{children}</span>
            </div>
            <svg className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </a>
        );
      }

      // Default link
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold underline-offset-2 hover:underline"
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div className="flex h-dvh w-full max-w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Workspace Header — scaled to h-16 for vertical comfort */}
      <header className="min-h-16 border-b border-border bg-card flex flex-wrap items-center justify-between gap-3 px-3 py-2 sm:px-5 shrink-0 z-10">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
          
          <Link
            href={`/roadmaps/${roadmap.slug}`}
            className="p-1.5 rounded border border-border bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Kembali ke Roadmap"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
 
          <div className="flex min-w-0 flex-col justify-center pl-1 gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 tracking-wider">
                {currentNode.type}
              </span>
              <span className="hidden sm:block text-[10px] font-bold text-muted-foreground truncate max-w-[150px] tracking-wide">{roadmap.title}</span>
            </div>
            <h1 className="text-[12px] sm:text-[13px] font-extrabold text-foreground tracking-tight leading-none line-clamp-1 max-w-[42vw] sm:max-w-[260px]">{currentNode.label}</h1>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          {/* Theme toggle — always visible in workspace */}
          <ThemeToggle />

          {userRole && userRole !== "user" && (
            <Link
              href="/cms/materials"
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Edit di CMS</span>
            </Link>
          )}

          <CompletionButton
            roadmapSlug={roadmap.slug}
            nodeId={currentNode.id}
            initialCompleted={completedNodes.includes(currentNode.id)}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex min-h-0 flex-1 overflow-hidden relative">
        
        {/* LEFT SIDEBAR: Topic Tree Navigation */}
        {sidebarOpen && (
        <>
        <button
          aria-label="Tutup daftar materi"
          className="fixed inset-x-0 bottom-0 top-16 z-10 bg-black/25 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className="fixed bottom-0 left-0 top-16 z-20 flex flex-col border-r border-border bg-card shadow-2xl md:relative md:inset-auto md:shadow-none shrink-0 h-[calc(100dvh-4rem)] md:h-full"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Sidebar title */}
          <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-extrabold text-foreground uppercase tracking-widest">
              Daftar Materi
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pt-3 pb-24 space-y-5 px-2">
            {phases.map((phase) => {
              const children = getPhaseChildren(phase.id);
              if (children.length === 0) return null;
              return (
                <div key={phase.id} className="space-y-0.5">
                  {/* Phase label — like "Pekan 1" in sanbercode */}
                  <div className="px-2 pt-1 pb-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                      {phase.label}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {children.map((child) => {
                      const isCurrent = child.id === currentNode.id;
                      const isCompleted = completedNodes.includes(child.id);
                      return (
                        <Link
                          key={child.id}
                          href={`/roadmaps/${roadmap.slug}/${child.id}`}
                          className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all ${
                            isCurrent
                              ? "bg-primary text-primary-foreground font-bold shadow-sm"
                              : isCompleted
                              ? "text-emerald-500 hover:bg-emerald-500/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="shrink-0">
                            {isCompleted ? (
                              <CheckCircle2 className={`h-3.5 w-3.5 ${isCurrent ? "text-primary-foreground/70" : "text-emerald-500"}`} />
                            ) : (
                              <Circle className={`h-3.5 w-3.5 ${isCurrent ? "text-primary-foreground/70" : "text-muted-foreground/40"}`} />
                            )}
                          </div>
                          <span className="truncate leading-snug">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
        </>
        )}

        {/* DRAGGABLE SIDEBAR HANDLE */}
        {sidebarOpen && (
          <div
            onMouseDown={handleSidebarDrag}
            className="hidden md:block w-1.5 hover:w-2 bg-border hover:bg-primary/50 cursor-col-resize h-full shrink-0 select-none z-10"
            title="Seret untuk mengatur lebar sidebar"
          />
        )}

        {/* RIGHT AREA: Material Reader & Practice Split Panel */}
        <div className="min-w-0 flex-1 flex-row overflow-hidden">
          {/* MIDDLE CONTENT: Material Reader */}
          <div 
            className="flex h-full min-w-0 w-full flex-col overflow-y-auto bg-background"
            style={{ width: "100%" }}
          >
            <div className="px-5 sm:px-8 md:px-10 lg:px-12 py-8 md:py-12 max-w-[900px] xl:max-w-[980px] mx-auto w-full flex flex-col justify-between min-h-full pb-20">
              <div>
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest mb-8">
                  <span>Roadmap</span>
                  <span className="text-muted-foreground/40">/</span>
                  <span className="hover:text-foreground transition-colors cursor-pointer">{roadmap.title}</span>
                  <span className="text-muted-foreground/40">/</span>
                  <span className="text-primary font-bold">{currentNode.label}</span>
                </nav>

                {/* Markdown Content — custom styled, VSCode syntax highlighting, optimized for reading */}
                <article className="mb-12 material-reader">
                  <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>{materialContent}</ReactMarkdown>
                </article>
              </div>

              {/* Bottom Actions Layout — optimized spacing with clear bottom margin */}
              <div className="border-t border-border pt-8 mt-12 mb-4 pb-16">
                {/* Optional practice callout inside reader */}
                {hasPractice && (
                  <div className="mb-10 rounded-2xl bg-primary/5 border border-primary/10 p-4 sm:p-5">
                    <div className="text-center">
                      <h4 className="text-sm font-bold text-primary inline-flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        Asah Kemampuanmu!
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
                        Materi ini punya latihan fokus di halaman terpisah supaya ruang ujian dan editor kode lebih lega.
                      </p>
                    </div>

                    <div className={`mt-4 ${safeQuiz && safeChallenge ? 'grid gap-3 sm:grid-cols-2' : 'flex justify-center'}`}>
                      {safeQuiz && (
                        isLoggedIn ? (
                          <Link
                            href={`/roadmaps/${roadmap.slug}/${currentNode.id}/quiz`}
                            className={`flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-card px-4 py-3 text-xs font-bold text-foreground hover:bg-primary/10 transition-colors ${!safeChallenge ? 'w-full sm:max-w-xs' : ''}`}
                          >
                            <Trophy className="h-4 w-4 text-primary" />
                            <span>Mulai Ujian Kuis</span>
                          </Link>
                        ) : (
                          <button
                            onClick={() => {
                              setRedirectUrl(`/roadmaps/${roadmap.slug}/${currentNode.id}/quiz`);
                              setShowLoginPrompt(true);
                            }}
                            className={`flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-card px-4 py-3 text-xs font-bold text-foreground hover:bg-primary/10 transition-colors cursor-pointer ${!safeChallenge ? 'w-full sm:max-w-xs' : ''}`}
                          >
                            <Trophy className="h-4 w-4 text-primary" />
                            <span>Mulai Ujian Kuis</span>
                          </button>
                        )
                      )}
                      {safeChallenge && (
                        isLoggedIn ? (
                          <Link
                            href={`/roadmaps/${roadmap.slug}/${currentNode.id}/challenge`}
                            className={`flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors ${!safeQuiz ? 'w-full sm:max-w-xs' : ''}`}
                          >
                            <Code2 className="h-4 w-4" />
                            <span>Buka Code Challenge</span>
                          </Link>
                        ) : (
                          <button
                            onClick={() => {
                              setRedirectUrl(`/roadmaps/${roadmap.slug}/${currentNode.id}/challenge`);
                              setShowLoginPrompt(true);
                            }}
                            className={`flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors cursor-pointer ${!safeQuiz ? 'w-full sm:max-w-xs' : ''}`}
                          >
                            <Code2 className="h-4 w-4" />
                            <span>Buka Code Challenge</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Prev / Next Material Navigation */}
                <div className="flex items-center justify-between gap-4">
                  {prevNode ? (
                    <Link
                      href={`/roadmaps/${roadmap.slug}/${prevNode.id}`}
                      className="flex items-center gap-1.5 px-4 py-2.5 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Sebelumnya</span>
                    </Link>
                  ) : (
                    <div />
                  )}

                  {nextNode ? (
                    <Link
                      href={`/roadmaps/${roadmap.slug}/${nextNode.id}`}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary border border-border rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-all cursor-pointer"
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      href={`/roadmaps/${roadmap.slug}`}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary border border-border rounded-xl text-xs font-bold text-primary hover:bg-muted transition-all cursor-pointer"
                    >
                      <span>Selesai Belajar</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Login prompt modal for practice */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center text-center gap-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-foreground mb-2">Login Diperlukan</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Untuk pengerjaan kuis pilihan ganda atau tantangan coding, kamu perlu login terlebih dahulu dengan akun Google agar progres nilaimu tersimpan.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => signIn("google", { callbackUrl: redirectUrl })}
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
    </div>
  );
}

export default ConsoleWorkspace;
