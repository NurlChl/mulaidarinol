"use client";

import React, { useState, useEffect, useRef } from "react";
import { submitChallengeCode } from "@/app/actions/progress";
import { Play, CheckCircle2, XCircle, Code, Terminal, Eye, Loader2, Sparkles, Columns, Rows } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Editor from "@monaco-editor/react";

interface TestCase {
  inputDescription: string;
  assertionCode: string;
  expectedOutput: string;
}

interface ConsoleEditorProps {
  roadmapSlug: string;
  nodeId: string;
  challenge: {
    _id: string;
    title: string;
    description: string;
    language: "javascript" | "html" | "css";
    initialCode: string;
    testCases: TestCase[];
  };
  onCompleted?: () => void;
  isLoggedIn: boolean;
}

export function ConsoleEditor({ roadmapSlug, nodeId, challenge, onCompleted, isLoggedIn }: ConsoleEditorProps) {
  const [code, setCode] = useState(challenge.initialCode);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{ passed: boolean; run: boolean }[]>(
    challenge.testCases.map(() => ({ passed: false, run: false }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<"preview" | "console">(
    challenge.language === "javascript" ? "console" : "preview"
  );
  
  const [previewContent, setPreviewContent] = useState("");

  // Resize & layout states
  const [leftWidth, setLeftWidth] = useState(35); // in percentage
  const [editorHeight, setEditorHeight] = useState(55); // in percentage
  const [layoutMode, setLayoutMode] = useState<"horizontal" | "vertical">("horizontal");

  const containerRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);

  // Sync editor with initial code if challenge changes
  useEffect(() => {
    setCode(challenge.initialCode);
    setConsoleLogs([]);
    setSuccessState(false);
    setTestResults(challenge.testCases.map(() => ({ passed: false, run: false })));
  }, [challenge]);

  const runJavaScriptCode = (userCode: string) => {
    const logs: string[] = [];
    
    // Hijack console logs
    const mockConsole = {
      log: (...args: any[]) => {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
      },
      error: (...args: any[]) => {
        logs.push(`[ERROR] ${args.join(' ')}`);
      },
      warn: (...args: any[]) => {
        logs.push(`[WARN] ${args.join(' ')}`);
      }
    };

    try {
      const runFn = new Function("console", userCode);
      runFn(mockConsole);
      if (logs.length === 0) {
        logs.push("(Code executed successfully, but returned no logs. Use console.log() to print outputs.)");
      }
    } catch (err: any) {
      logs.push(`[ERROR RUNTIME] ${err.message}`);
    }

    setConsoleLogs(logs);
  };

  const updateIframePreview = (htmlCode: string) => {
    let content = "";
    if (challenge.language === "html") {
      content = htmlCode;
    } else if (challenge.language === "css") {
      content = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>${htmlCode}</style>
        </head>
        <body>
          <div class="preview-box">
            <h1>CSS Preview Window</h1>
            <p>Styling applied successfully.</p>
            <button class="btn">Demo Button</button>
          </div>
        </body>
        </html>
      `;
    }
    setPreviewContent(content);
  };

  const handleRunCode = () => {
    if (challenge.language === "javascript") {
      runJavaScriptCode(code);
    } else {
      updateIframePreview(code);
    }
  };

  // Trigger initial code run on mount
  useEffect(() => {
    handleRunCode();
  }, [code, challenge.language]);

  const handleRunTests = async () => {
    const newResults = challenge.testCases.map((tc) => {
      let passed = false;
      try {
        if (challenge.language === "javascript") {
          const evaluator = new Function(`
            ${code}
            return (${tc.assertionCode});
          `);
          passed = !!evaluator();
        } else {
          const parser = new DOMParser();
          const doc = parser.parseFromString(code, "text/html");
          const evaluator = new Function("doc", `return (${tc.assertionCode});`);
          passed = !!evaluator(doc);
        }
      } catch (err) {
        console.error(err);
      }
      return { passed, run: true };
    });

    setTestResults(newResults);
    const allPassed = newResults.every((r) => r.passed);

    if (allPassed) {
      setSuccessState(true);
      if (isLoggedIn) {
        try {
          setSubmitting(true);
          await submitChallengeCode(roadmapSlug, nodeId, challenge._id, code, true);
          onCompleted?.();
        } catch (err) {
          console.error(err);
        } finally {
          setSubmitting(false);
        }
      } else {
        onCompleted?.();
      }
    }
  };

  // Resize Handlers
  const handleMainDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const startWidth = leftWidth;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (layoutMode === "horizontal") {
        const deltaX = moveEvent.clientX - startX;
        let newWidth = startWidth + (deltaX / containerRect.width) * 100;
        newWidth = Math.max(20, Math.min(80, newWidth));
        setLeftWidth(newWidth);
      } else {
        const deltaY = moveEvent.clientY - startY;
        let newHeight = startWidth + (deltaY / containerRect.height) * 100;
        newHeight = Math.max(20, Math.min(80, newHeight));
        setLeftWidth(newHeight);
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleEditorDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const rightPaneRect = rightPaneRef.current?.getBoundingClientRect();
    if (!rightPaneRect) return;

    const startHeight = editorHeight;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      let newHeight = startHeight + (deltaY / rightPaneRect.height) * 100;
      newHeight = Math.max(20, Math.min(80, newHeight));
      setEditorHeight(newHeight);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full flex bg-card border border-border rounded-lg overflow-hidden min-h-[600px] relative ${
        layoutMode === "horizontal" ? "flex-col lg:flex-row" : "flex-col"
      }`}
    >
      {/* LEFT PANE: Instructions and Test Cases */}
      <div 
        className="w-full flex flex-col justify-between bg-secondary overflow-y-auto"
        style={layoutMode === "horizontal" ? { width: `${leftWidth}%` } : { height: `${leftWidth}%` }}
      >
        <div className="p-4 space-y-4 flex-1">
          <div>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
              Instruksi Kerja
            </span>
            <h3 className="text-sm font-bold text-foreground mt-2">{challenge.title}</h3>
          </div>
          
          <div className="text-xs text-muted-foreground prose dark:prose-invert leading-relaxed">
            <ReactMarkdown>{challenge.description}</ReactMarkdown>
          </div>
        </div>

        {/* Test cases progress */}
        <div className="p-4 border-t border-border bg-card">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2.5">
            Test Case Pemeriksaan
          </h4>
          <div className="space-y-2">
            {challenge.testCases.map((tc, idx) => {
              const res = testResults[idx];
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 p-2 rounded text-xs border ${
                    res.run
                      ? res.passed
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-500"
                        : "border-destructive/20 bg-destructive/5 text-destructive"
                      : "border-border bg-secondary text-muted-foreground"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {res.run ? (
                      res.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-border" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{tc.inputDescription}</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Ekspektasi: {tc.expectedOutput}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DRAGGABLE MAIN DIVIDER */}
      <div
        onMouseDown={handleMainDividerMouseDown}
        className={`bg-border hover:bg-primary/50 transition-all shrink-0 select-none z-10 ${
          layoutMode === "horizontal" 
            ? "hidden lg:block w-1.5 hover:w-2 cursor-col-resize h-full" 
            : "w-full h-1.5 hover:h-2 cursor-row-resize"
        }`}
        title="Geser untuk mengubah ukuran panel"
      />

      {/* RIGHT PANE: Code Editor and Console / Output */}
      <div 
        ref={rightPaneRef}
        className="flex-1 flex flex-col justify-between overflow-hidden"
        style={layoutMode === "horizontal" ? { width: `${100 - leftWidth}%` } : { height: `${100 - leftWidth}%` }}
      >
        {/* Editor Area */}
        <div 
          className="flex flex-col min-h-[200px]"
          style={{ height: `${editorHeight}%` }}
        >
          <div className="px-4 py-2 border-b border-border bg-secondary flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <div className="flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5 text-primary" />
              <span>Workspace Editor ({challenge.language})</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLayoutMode(layoutMode === "horizontal" ? "vertical" : "horizontal")}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title={layoutMode === "horizontal" ? "Ubah ke tata letak vertikal" : "Ubah ke tata letak horizontal"}
              >
                {layoutMode === "horizontal" ? <Rows className="h-3.5 w-3.5" /> : <Columns className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={handleRunCode}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground hover:bg-primary/95 rounded text-[10px] cursor-pointer"
              >
                <Play className="h-2.5 w-2.5" />
                <span>Jalankan</span>
              </button>
            </div>
          </div>

          <div className="flex-1 relative bg-card overflow-hidden">
            <Editor
              height="100%"
              language={challenge.language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              loading={
                <div className="absolute inset-0 flex items-center justify-center bg-card">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              }
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                lineHeight: 1.6,
                padding: { top: 12, bottom: 12 },
                scrollbar: {
                  verticalScrollbarSize: 6,
                  horizontalScrollbarSize: 6,
                },
                roundedSelection: true,
                automaticLayout: true,
                wordWrap: "on",
                renderLineHighlight: "all",
                tabSize: 2,
              }}
            />
          </div>
        </div>

        {/* DRAGGABLE EDITOR DIVIDER */}
        <div
          onMouseDown={handleEditorDividerMouseDown}
          className="w-full h-1.5 hover:h-2 bg-border hover:bg-primary/50 cursor-row-resize transition-all shrink-0 select-none z-10"
          title="Geser untuk mengatur tinggi editor"
        />

        {/* Console / Output Area */}
        <div className="flex-1 border-t border-border flex flex-col bg-secondary overflow-hidden">
          {/* Tab Selector */}
          <div className="flex items-center justify-between border-b border-border px-4 py-1.5 text-xs font-semibold">
            <div className="flex gap-2">
              {challenge.language !== "javascript" && (
                <button
                  onClick={() => setActiveRightTab("preview")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer ${
                    activeRightTab === "preview" ? "bg-card text-foreground border border-border" : "text-muted-foreground"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </button>
              )}
              <button
                onClick={() => setActiveRightTab("console")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer ${
                  activeRightTab === "console" ? "bg-card text-foreground border border-border" : "text-muted-foreground"
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>Console Logs</span>
              </button>
            </div>
            
            {/* Run Test Button */}
            <button
              onClick={handleRunTests}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded text-[10px] font-semibold cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              <span>Periksa Tantangan</span>
            </button>
          </div>

          <div className="flex-1 overflow-auto bg-card">
            {activeRightTab === "preview" && challenge.language !== "javascript" ? (
              <iframe
                title="Sandbox preview"
                className="w-full h-full bg-white"
                sandbox="allow-scripts"
                srcDoc={previewContent}
              />
            ) : (
              <div className="p-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1">
                {consoleLogs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap leading-relaxed">{log}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Success Overlays */}
        {successState && (
          <div className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in duration-200">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full mb-4">
              <CheckCircle2 className="h-12 w-12 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Tantangan Terselesaikan!</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1.5 mb-6">
              Kode Anda berhasil melewati seluruh test case pemeriksaan. Progres belajar Anda dicentang!
            </p>
            <button
              onClick={() => setSuccessState(false)}
              className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded cursor-pointer"
            >
              Ubah Kode / Ulangi
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default ConsoleEditor;
