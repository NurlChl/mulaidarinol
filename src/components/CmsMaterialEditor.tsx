"use client";

import { useState, useEffect, useRef } from "react";
import { saveMaterial } from "@/app/actions/cms";
import { 
  BookOpen, 
  Save, 
  Eye, 
  Edit, 
  HelpCircle,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Bold,
  Italic,
  Code,
  Link as LinkIcon,
  Play,
  FileText,
  MousePointerClick,
  Quote,
  List,
  ListOrdered,
  Columns,
  Layout,
  Underline,
  Info,
  Globe
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ExternalLink } from "lucide-react";
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

interface MaterialData {
  title: string;
  slug: string;
  content: string;
}

interface CmsMaterialEditorProps {
  roadmaps: RoadmapData[];
  materialsCache: Record<string, MaterialData>;
}

export function CmsMaterialEditor({ roadmaps, materialsCache }: CmsMaterialEditorProps) {
  const { showModal } = useModal();
  const [selectedRoadmapId, setSelectedRoadmapId] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  
  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");

  const [activeTab, setActiveTab] = useState<"edit" | "visual" | "split" | "preview">("edit");
  const [saving, setSaving] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualEditorRef = useRef<HTMLDivElement>(null);

  // Custom Prompt Modal State to fully replace native window.prompt()
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptTitle, setPromptTitle] = useState("");
  const [promptFields, setPromptFields] = useState<Array<{ key: string; label: string; placeholder?: string; defaultValue?: string }>>([]);
  const [promptValues, setPromptValues] = useState<Record<string, string>>({});
  const [promptSubmitHandler, setPromptSubmitHandler] = useState<((values: Record<string, string>) => void) | null>(null);

  const openCustomPrompt = (
    title: string,
    fields: Array<{ key: string; label: string; placeholder?: string; defaultValue?: string }>,
    onSubmit: (values: Record<string, string>) => void
  ) => {
    setPromptTitle(title);
    setPromptFields(fields);
    const initialVals: Record<string, string> = {};
    fields.forEach((f) => {
      initialVals[f.key] = f.defaultValue || "";
    });
    setPromptValues(initialVals);
    setPromptSubmitHandler(() => onSubmit);
    setPromptOpen(true);
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promptSubmitHandler) {
      promptSubmitHandler(promptValues);
    }
    setPromptOpen(false);
  };

  // ── Preview click-to-navigate: clicking an element in the live preview
  //    jumps the markdown textarea to the exact source position ──────────
  const handlePreviewClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const clickable = target.closest("[data-offset]") as HTMLElement | null;
    if (!clickable) return;
    const offsetStr = clickable.getAttribute("data-offset");
    if (!offsetStr) return;
    const offset = parseInt(offsetStr, 10);
    if (isNaN(offset)) return;
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(offset, offset);
    // Scroll the textarea so the cursor line is visible
    const textBefore = (ta.value || "").substring(0, offset);
    const lineCount = textBefore.split("\n").length;
    const style = window.getComputedStyle(ta);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    ta.scrollTop = Math.max(0, (lineCount - 4) * lineHeight);
  };

  const selectedRoadmap = roadmaps.find((r) => r._id === selectedRoadmapId);
  const learnableNodes = selectedRoadmap
    ? selectedRoadmap.nodes.filter((n) => n.type !== "phase")
    : [];

  // Auto-generate unique slug helper
  const generateUniqueSlug = (inputTitle: string) => {
    let baseSlug = inputTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!baseSlug) baseSlug = "materi";

    let uniqueSlug = baseSlug;
    let counter = 1;
    
    // Check if this slug is already used by another node in the cache
    const currentCacheKey = `${selectedRoadmapId}-${selectedNodeId}`;
    const isSlugTaken = (slugVal: string) => {
      return Object.entries(materialsCache).some(([key, material]) => {
        if (key === currentCacheKey) return false;
        return material.slug === slugVal;
      });
    };

    while (isSlugTaken(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    return uniqueSlug;
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (selectedRoadmapId && selectedNodeId) {
      const generated = generateUniqueSlug(newTitle);
      setSlug(generated);
    }
  };

  // Load existing material content when selectedRoadmap/Node changes
  useEffect(() => {
    if (!selectedRoadmapId || !selectedNodeId) {
      setTitle("");
      setSlug("");
      setContent("");
      return;
    }

    const cacheKey = `${selectedRoadmapId}-${selectedNodeId}`;
    const cached = materialsCache[cacheKey];

    if (cached) {
      setTitle(cached.title);
      setSlug(cached.slug);
      setContent(cached.content);
    } else {
      const node = learnableNodes.find((n) => n.id === selectedNodeId);
      setTitle(node ? node.label : "");
      setSlug(selectedNodeId);
      setContent(`# ${node ? node.label : ""}\n\nTulis isi materi pembelajaran di sini...`);
    }
  }, [selectedRoadmapId, selectedNodeId]);

  // Sync visual editor content editable innerHTML when activeTab changes to "visual"
  useEffect(() => {
    if (activeTab === "visual" && visualEditorRef.current) {
      visualEditorRef.current.innerHTML = parseMarkdownToHtml(content);
    }
  }, [activeTab]);

  const handleSave = async () => {
    if (!selectedRoadmapId || !selectedNodeId || !title || !slug || !content) {
      showModal({
        title: "Validasi Gagal",
        message: "Semua field input wajib diisi sebelum menyimpan materi.",
        type: "warning",
      });
      return;
    }

    try {
      setSaving(true);
      const res = await saveMaterial({
        roadmapId: selectedRoadmapId,
        nodeId: selectedNodeId,
        title,
        slug,
        content,
      });

      if (res.success) {
        showModal({
          title: "Materi Berhasil Disimpan",
          message: "Konten bacaan modul berhasil diperbarui.",
          type: "success",
        });
        const cacheKey = `${selectedRoadmapId}-${selectedNodeId}`;
        materialsCache[cacheKey] = { title, slug, content };
      } else {
        showModal({
          title: "Penyimpanan Gagal",
          message: res.error || "Gagal memperbarui konten materi di server.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      showModal({
        title: "Kesalahan Database",
        message: "Terjadi gangguan koneksi internet atau server.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // Helper to insert markdown elements at cursor selection
  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const scrollTop = textarea.scrollTop; // Save scroll position to prevent jumping
    const text = textarea.value;
    const selected = text.substring(start, end);
    
    const replacement = before + (selected || "") + after;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    
    setContent(newValue);

    // Re-focus and set selection range
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + (selected ? selected.length : 0);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.scrollTop = scrollTop; // Restore scroll position
    }, 50);
  };

  // ------------------------------------------------------------------
  // Markdown <-> HTML Translation for WYSIWYG
  // ------------------------------------------------------------------
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const parseMarkdownToHtml = (markdown: string): string => {
    // Use placeholder system to protect multi-line widgets from paragraph wrapping
    const widgets: string[] = [];
    const placeholder = (html: string) => {
      const idx = widgets.length;
      widgets.push(html);
      return `%%WIDGET_${idx}%%`;
    };

    let html = markdown;

    // 1. Block code styled with macOS title bar
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const displayLang = lang || "html";
      return placeholder(`<div class="code-block-wrapper my-10 rounded-xl overflow-hidden border border-white/[0.07] shadow-2xl" contenteditable="false" data-widget="code-block"><div class="flex items-center justify-between bg-[#1e1e2e] px-4 py-2.5 border-b border-white/6 select-none cursor-pointer"><div class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-[#ff5f57]"></span><span class="w-3 h-3 rounded-full bg-[#febc2e]"></span><span class="w-3 h-3 rounded-full bg-[#28c840]"></span></div><span class="text-[11px] font-bold tracking-widest uppercase text-white/25 font-mono select-none" data-lang-label="true">${displayLang}</span><span class="text-[10px] text-white/15 font-mono select-none">(Klik header untuk ubah bahasa)</span></div><pre style="margin: 0 !important; padding: 1.25rem 1.5rem !important; background: #1e1e2e !important; font-size: 13.5px !important; line-height: 1.8 !important; font-family: var(--font-mono, 'JetBrains Mono', monospace) !important; color: #fff !important;"><code contenteditable="true" data-code-content="true" data-lang="${displayLang}" style="font-family: inherit; color: inherit; outline: none; display: block; white-space: pre-wrap; background: transparent; border: none; padding: 0;">${escapeHtml(code.trim())}</code></pre></div>`);
    });

    // 2. Note callout widget: [!NOTE] text
    html = html.replace(/^\[!NOTE\](.*)$/gm, (match, text) => {
      const noteText = text.trim();
      return placeholder(`<div data-widget="note" data-text="${escapeHtml(noteText)}" class="my-8" contenteditable="false"><div class="flex gap-4 rounded-r-xl border-l-4 border-primary bg-primary/[0.07] px-6 py-5 cursor-pointer"><svg class="w-5 h-5 text-primary shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><div class="text-[15px] text-foreground/85 leading-relaxed" data-note-text="true">${noteText}</div></div><span class="text-[10px] text-muted-foreground select-none ml-2">(Klik catatan untuk mengubah)</span></div>`);
    });

    // 3. Link card widget: [label](url#linkcard)
    html = html.replace(/\[([^\]]+)\]\(([^)]+?#linkcard)\)/g, (match, label, href) => {
      const cleanHref = href.replace(/#linkcard$/, "");
      let domain = "";
      try { domain = new URL(cleanHref).hostname.replace("www.", ""); } catch {}
      return placeholder(`<div data-widget="linkcard" data-url="${cleanHref}" data-label="${label}" data-domain="${domain}" class="my-6" contenteditable="false"><a href="${cleanHref}" target="_blank" rel="noopener noreferrer" class="group flex items-center gap-5 p-5 rounded-2xl border border-primary/20 bg-primary/4 hover:bg-primary/8 hover:border-primary/40 transition-all duration-200 no-underline cursor-pointer"><div class="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></div><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1.5"><span class="text-[11px] font-bold uppercase tracking-wider border border-primary/30 px-2 py-0.5 rounded-md bg-primary/10 text-primary">${domain || "Tautan"}</span><span class="text-[11px] text-muted-foreground">Belajar Lengkap di Sini</span></div><span class="text-[16px] font-semibold text-foreground truncate block" data-linkcard-label="true">${label}</span></div><svg class="h-5 w-5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></a><span class="text-[10px] text-muted-foreground select-none ml-2">(Klik kartu untuk menyunting)</span></div>`);
    });

    // 4. YouTube video widget
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s)]+)\)/g, (match, label, href) => {
      let videoId = "";
      if (href.includes("youtube.com/watch")) {
        videoId = new URLSearchParams(href.split("?")[1] || "").get("v") || "";
      } else {
        videoId = href.split("/").pop()?.split("?")[0] || "";
      }
      return placeholder(`<div data-widget="youtube" data-video-id="${videoId}" class="my-10" contenteditable="false"><div class="text-[12px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2 select-none"><svg class="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-2.75 12.84 12.84 0 0 0-1.81-.17H10a12.84 12.84 0 0 0-1.81.17 4.83 4.83 0 0 1-3.77 2.75A4.86 4.86 0 0 0 2 11.09V13a4.86 4.86 0 0 0 2.42 4.4 4.83 4.83 0 0 1 3.77 2.75 12.84 12.84 0 0 0 1.81.17H14a12.84 12.84 0 0 0 1.81-.17 4.83 4.83 0 0 1 3.77-2.75A4.86 4.86 0 0 0 22 13v-1.91a4.86 4.86 0 0 0-2.41-4.4ZM10 15.5v-7l6 3.5Z"/></svg><span>Video Player Widget (Klik untuk mengubah video)</span></div><div class="relative w-full aspect-video overflow-hidden rounded-2xl border border-border shadow-2xl bg-black"><iframe src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1" class="absolute inset-0 w-full h-full border-0 pointer-events-none"></iframe><div class="absolute inset-0 bg-transparent cursor-pointer"></div></div></div>`);
    });

    // 5. CTA Button widget
    html = html.replace(/\[([^\]]+)\]\(([^)]+?#(?:button|cta))\)/g, (match, label, href) => {
      const cleanHref = href.replace(/#(button|cta)$/, "");
      return placeholder(`<div data-widget="cta" data-url="${cleanHref}" data-label="${label}" class="my-6" contenteditable="false"><button type="button" class="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg transition-colors cursor-pointer border-0"><span>${label}</span><svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></button><span class="text-[10px] text-muted-foreground ml-3 select-none">(Klik tombol untuk mengubah teks/link)</span></div>`);
    });

    // 6. Resource Cards widget (specific domains)
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/(?:www\.)?(?:mozilla\.org|w3schools\.com|freecodecamp\.org)[^\s)]+)\)/g, (match, label, href) => {
      return placeholder(`<div data-widget="resource" data-url="${href}" data-label="${label}" class="my-9" contenteditable="false"><div class="flex items-center gap-5 p-5 rounded-2xl border border-primary/20 bg-primary/4 cursor-pointer"><div class="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></div><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1.5 select-none"><span class="text-[11px] font-bold uppercase tracking-wider border border-primary/30 px-2 py-0.5 rounded-md bg-primary/10 text-primary">Dokumentasi</span></div><span class="text-[16px] font-semibold text-foreground truncate block text-left">${label}</span></div><span class="text-[10px] text-muted-foreground select-none ml-2">(Klik kartu untuk menyunting)</span></div></div>`);
    });

    // 7. Headings (H6 to H1)
    html = html.replace(/^###### (.*?)$/gm, "<h6>$1</h6>");
    html = html.replace(/^##### (.*?)$/gm, "<h5>$1</h5>");
    html = html.replace(/^#### (.*?)$/gm, "<h4>$1</h4>");
    html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

    // 8. Horizontal rules
    html = html.replace(/^---$/gm, "<hr />");

    // 9. Blockquotes (non-NOTE)
    html = html.replace(/^> (.*?)$/gm, "<blockquote>$1</blockquote>");

    // 10. Lists
    html = html.replace(/^\* (.*?)$/gm, "<li>$1</li>");
    html = html.replace(/^1\. (.*?)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>");

    // 11. Regular Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // 12. Inline Code
    html = html.replace(/`([^`]+)`/g, '<code class="mx-0.5 rounded-md bg-primary/12 border border-primary/20 px-[5px] py-[2px] text-[13.5px] font-mono font-semibold text-primary" style="font-family: var(--font-mono, monospace); display: inline-block;">$1</code>');

    // 13. Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // 14. Wrap plain lines in paragraphs (skip widget placeholders and block tags)
    const lines = html.split("\n");
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return "<br />";
      // Skip widget placeholders
      if (/^%%WIDGET_\d+%%$/.test(trimmed)) return line;
      if (trimmed.startsWith("<h") || trimmed.startsWith("<li") || trimmed.startsWith("<pre") || trimmed.startsWith("<div") || trimmed.startsWith("<ul") || trimmed.startsWith("<hr") || trimmed.startsWith("<blockquote")) {
        return line;
      }
      return `<p>${line}</p>`;
    });

    let result = processedLines.join("\n");

    // 15. Restore widget HTML from placeholders
    widgets.forEach((widgetHtml, idx) => {
      result = result.replace(`%%WIDGET_${idx}%%`, widgetHtml);
    });

    return result;
  };

  const domToMarkdown = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue || "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    // Check widgets to prevent deep tree parsing of layouts
    if (el.getAttribute("data-widget") === "youtube") {
      const videoId = el.getAttribute("data-video-id") || "";
      return `\n[Video Penjelasan](https://www.youtube.com/watch?v=${videoId})\n`;
    }
    if (el.getAttribute("data-widget") === "note") {
      const text = el.getAttribute("data-text") || "";
      // Try to get updated text from the DOM element itself
      const noteTextEl = el.querySelector("[data-note-text]");
      const liveText = noteTextEl ? (noteTextEl as HTMLElement).innerText.trim() : text;
      return `\n[!NOTE] ${liveText}\n`;
    }
    if (el.getAttribute("data-widget") === "linkcard") {
      const url = el.getAttribute("data-url") || "";
      const label = el.getAttribute("data-label") || "Tautan";
      // Try to get updated label from the DOM
      const labelEl = el.querySelector("[data-linkcard-label]");
      const liveLabel = labelEl ? (labelEl as HTMLElement).innerText.trim() : label;
      return `\n[${liveLabel}](${url}#linkcard)\n`;
    }
    if (el.getAttribute("data-widget") === "resource") {
      const url = el.getAttribute("data-url") || "";
      const label = el.getAttribute("data-label") || "Dokumentasi";
      return `\n[${label}](${url})\n`;
    }
    if (el.getAttribute("data-widget") === "cta") {
      const url = el.getAttribute("data-url") || "";
      const label = el.getAttribute("data-label") || "Mulai";
      return `\n[${label}](${url}#button)\n`;
    }
    if (el.classList.contains("code-block-wrapper") || el.getAttribute("data-widget") === "code-block") {
      const codeEl = el.querySelector("code");
      const codeLang = codeEl?.getAttribute("data-lang") || "html";
      const codeContent = codeEl ? codeEl.innerText : el.innerText;
      return `\n\`\`\`${codeLang}\n${codeContent.trim()}\n\`\`\`\n`;
    }

    let childrenMarkdown = "";
    el.childNodes.forEach((child) => {
      childrenMarkdown += domToMarkdown(child);
    });

    switch (tagName) {
      case "h1": return `\n# ${childrenMarkdown}\n`;
      case "h2": return `\n## ${childrenMarkdown}\n`;
      case "h3": return `\n### ${childrenMarkdown}\n`;
      case "h4": return `\n#### ${childrenMarkdown}\n`;
      case "h5": return `\n##### ${childrenMarkdown}\n`;
      case "h6": return `\n###### ${childrenMarkdown}\n`;
      case "p":
      case "div":
        if (!childrenMarkdown.trim()) return "\n";
        return `\n${childrenMarkdown}\n`;
      case "strong":
      case "b":
        return `**${childrenMarkdown}**`;
      case "em":
      case "i":
        return `*${childrenMarkdown}*`;
      case "u":
        return `<u>${childrenMarkdown}</u>`;
      case "pre":
        const codeEl = el.querySelector("code");
        const codeLang = codeEl?.getAttribute("data-lang") || "html";
        const codeContent = codeEl ? codeEl.innerText : el.innerText;
        return `\n\`\`\`${codeLang}\n${codeContent.trim()}\n\`\`\`\n`;
      case "code":
        return `\`${childrenMarkdown}\``;
      case "blockquote":
        return `\n> ${childrenMarkdown.split("\n").join("\n> ")}\n`;
      case "hr":
        return `\n---\n`;
      case "ul":
        return `\n${childrenMarkdown}\n`;
      case "ol":
        return `\n${childrenMarkdown}\n`;
      case "li":
        const parentTag = el.parentElement?.tagName.toLowerCase();
        if (parentTag === "ol") {
          return `1. ${childrenMarkdown}\n`;
        }
        return `* ${childrenMarkdown}\n`;
      case "a":
        const href = el.getAttribute("href") || "";
        return `[${childrenMarkdown}](${href})`;
      case "br":
        return "\n";
      default:
        return childrenMarkdown;
    }
  };

  const handleVisualEditorInput = () => {
    if (visualEditorRef.current) {
      const markdown = domToMarkdown(visualEditorRef.current);
      // Clean up multiple sequential empty lines to keep markdown clean
      const cleanedMarkdown = markdown.replace(/\n{3,}/g, "\n\n");
      setContent(cleanedMarkdown);
    }
  };

  // Click handler inside visual editor (word-press style in-place card settings update)
  const handleVisualEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Handle clicks on empty background areas of the editor below the content
    if (target === visualEditorRef.current) {
      const editor = visualEditorRef.current;
      if (editor && editor.lastChild) {
        const lastEl = editor.lastChild as HTMLElement;
        if (lastEl.nodeType === Node.ELEMENT_NODE && lastEl.getAttribute("contenteditable") === "false") {
          // Force append an editable paragraph at the end to allow writing more content
          const p = document.createElement("p");
          p.innerHTML = "<br>";
          editor.appendChild(p);
          
          const range = document.createRange();
          const selection = window.getSelection();
          range.setStart(p, 0);
          range.collapse(true);
          selection?.removeAllRanges();
          selection?.addRange(range);
          
          handleVisualEditorInput();
          return;
        }
      }
    }

    const ctaWidget = target.closest('[data-widget="cta"]');
    const youtubeWidget = target.closest('[data-widget="youtube"]');
    const resourceWidget = target.closest('[data-widget="resource"]');
    const noteWidget = target.closest('[data-widget="note"]');
    const linkcardWidget = target.closest('[data-widget="linkcard"]');
    const codeHeader = target.closest('.code-block-wrapper div.flex');

    if (ctaWidget) {
      e.preventDefault();
      e.stopPropagation();
      const currentLabel = ctaWidget.getAttribute("data-label") || "";
      const currentUrl = ctaWidget.getAttribute("data-url") || "";

      openCustomPrompt(
        "Edit Tombol CTA",
        [
          { key: "label", label: "Teks Tombol", defaultValue: currentLabel },
          { key: "url", label: "Link Target", defaultValue: currentUrl }
        ],
        (values) => {
          const newLabel = values.label;
          const newUrl = values.url;
          if (!newLabel || !newUrl) return;

          ctaWidget.setAttribute("data-label", newLabel);
          ctaWidget.setAttribute("data-url", newUrl);
          
          const btnSpan = ctaWidget.querySelector("button span");
          if (btnSpan) {
            btnSpan.textContent = newLabel;
          }
          handleVisualEditorInput();
        }
      );
      return;
    }

    if (youtubeWidget) {
      e.preventDefault();
      e.stopPropagation();
      const currentVideoId = youtubeWidget.getAttribute("data-video-id") || "";

      openCustomPrompt(
        "Edit Video YouTube",
        [
          { key: "url", label: "Link / ID Video YouTube", defaultValue: `https://www.youtube.com/watch?v=${currentVideoId}` }
        ],
        (values) => {
          const newUrl = values.url;
          if (!newUrl) return;
          let newVideoId = "";
          if (newUrl.includes("youtube.com/watch")) {
            newVideoId = new URLSearchParams(newUrl.split("?")[1] || "").get("v") || "";
          } else if (newUrl.includes("youtu.be")) {
            newVideoId = newUrl.split("/").pop()?.split("?")[0] || "";
          } else {
            newVideoId = newUrl;
          }

          if (newVideoId) {
            youtubeWidget.setAttribute("data-video-id", newVideoId);
            const iframe = youtubeWidget.querySelector("iframe");
            if (iframe) {
              iframe.src = `https://www.youtube.com/embed/${newVideoId}?rel=0&modestbranding=1`;
            }
            handleVisualEditorInput();
          }
        }
      );
      return;
    }

    if (resourceWidget) {
      e.preventDefault();
      e.stopPropagation();
      const currentLabel = resourceWidget.getAttribute("data-label") || "";
      const currentUrl = resourceWidget.getAttribute("data-url") || "";

      openCustomPrompt(
        "Edit Kartu Referensi",
        [
          { key: "label", label: "Judul Referensi", defaultValue: currentLabel },
          { key: "url", label: "URL Link", defaultValue: currentUrl }
        ],
        (values) => {
          const newLabel = values.label;
          const newUrl = values.url;
          if (!newLabel || !newUrl) return;

          resourceWidget.setAttribute("data-label", newLabel);
          resourceWidget.setAttribute("data-url", newUrl);

          const titleText = resourceWidget.querySelector("span.text-\\[16px\\]");
          if (titleText) {
            titleText.textContent = newLabel;
          }
          handleVisualEditorInput();
        }
      );
      return;
    }

    if (noteWidget) {
      e.preventDefault();
      e.stopPropagation();
      const currentText = noteWidget.getAttribute("data-text") || "";
      const noteTextEl = noteWidget.querySelector("[data-note-text]");
      const liveText = noteTextEl ? (noteTextEl as HTMLElement).innerText.trim() : currentText;

      openCustomPrompt(
        "Edit Catatan (Note)",
        [
          { key: "text", label: "Isi Catatan", defaultValue: liveText }
        ],
        (values) => {
          const newText = values.text;
          if (!newText) return;
          noteWidget.setAttribute("data-text", newText);
          if (noteTextEl) {
            (noteTextEl as HTMLElement).innerText = newText;
          }
          handleVisualEditorInput();
        }
      );
      return;
    }

    if (linkcardWidget) {
      e.preventDefault();
      e.stopPropagation();
      const currentLabel = linkcardWidget.getAttribute("data-label") || "";
      const currentUrl = linkcardWidget.getAttribute("data-url") || "";

      openCustomPrompt(
        "Edit Kartu Tautan",
        [
          { key: "label", label: "Judul Tautan", defaultValue: currentLabel },
          { key: "url", label: "URL Link", defaultValue: currentUrl }
        ],
        (values) => {
          const newLabel = values.label;
          const newUrl = values.url;
          if (!newLabel || !newUrl) return;
          linkcardWidget.setAttribute("data-label", newLabel);
          linkcardWidget.setAttribute("data-url", newUrl);
          let domain = "";
          try { domain = new URL(newUrl).hostname.replace("www.", ""); } catch {}
          linkcardWidget.setAttribute("data-domain", domain);
          const labelEl = linkcardWidget.querySelector("[data-linkcard-label]");
          if (labelEl) (labelEl as HTMLElement).innerText = newLabel;
          handleVisualEditorInput();
        }
      );
      return;
    }

    if (codeHeader) {
      e.preventDefault();
      e.stopPropagation();
      const codeBlock = codeHeader.closest('.code-block-wrapper');
      const codeEl = codeBlock?.querySelector('code');
      const currentLang = codeEl?.getAttribute('data-lang') || "html";

      openCustomPrompt(
        "Edit Bahasa Pemrograman",
        [
          { key: "lang", label: "Bahasa", defaultValue: currentLang }
        ],
        (values) => {
          const newLang = values.lang;
          if (newLang) {
            codeEl?.setAttribute('data-lang', newLang);
            const langLabel = codeHeader.querySelector('[data-lang-label="true"]');
            if (langLabel) {
              langLabel.textContent = newLang;
            }
            handleVisualEditorInput();
          }
        }
      );
      return;
    }
  };

  // WYSIWYG command triggers
  const executeFormatCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    handleVisualEditorInput();
  };

  const executeHeaderCommand = (headerTag: string) => {
    document.execCommand("formatBlock", false, headerTag);
    handleVisualEditorInput();
  };

  const insertHtmlAtCursor = (html: string) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const div = document.createElement("div");
    div.innerHTML = html;
    
    const frag = document.createDocumentFragment();
    let node;
    while ( (node = div.firstChild) ) {
      frag.appendChild(node);
    }
    
    range.insertNode(frag);
    handleVisualEditorInput();
  };

  const insertCodeBlockWidgetPrompt = () => {
    openCustomPrompt(
      "Buat Blok Kode Baru",
      [
        { key: "lang", label: "Bahasa Pemrograman", defaultValue: "html", placeholder: "html, css, javascript, python" }
      ],
      (values) => {
        const lang = values.lang || "html";
        const initialCode = "/* Tulis kode program di sini */";

        const html = `<div class="code-block-wrapper my-10 rounded-xl overflow-hidden border border-white/[0.07] shadow-2xl" contenteditable="false" data-widget="code-block">
          <div class="flex items-center justify-between bg-[#1e1e2e] px-4 py-2.5 border-b border-white/6 select-none cursor-pointer">
            <div class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span class="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span class="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span class="text-[11px] font-bold tracking-widest uppercase text-white/25 font-mono select-none" data-lang-label="true">${lang}</span>
            <span class="text-[10px] text-white/15 font-mono select-none">(Klik header untuk ubah bahasa)</span>
          </div>
          <pre style="margin: 0 !important; padding: 1.25rem 1.5rem !important; background: #1e1e2e !important; font-size: 13.5px !important; line-height: 1.8 !important; font-family: var(--font-mono, 'JetBrains Mono', monospace) !important; color: #fff !important;"><code contenteditable="true" data-code-content="true" data-lang="${lang}" style="font-family: inherit; color: inherit; outline: none; display: block; white-space: pre-wrap; background: transparent; border: none; padding: 0;">${initialCode}</code></pre>
        </div><p><br></p>`;
        
        insertHtmlAtCursor(html);
      }
    );
  };

  const insertYoutubeWidgetPrompt = () => {
    openCustomPrompt(
      "Masukkan Video YouTube",
      [
        { key: "url", label: "Link/ID Video YouTube", placeholder: "https://www.youtube.com/watch?v=..." }
      ],
      (values) => {
        const url = values.url;
        if (!url) return;

        let videoId = "";
        if (url.includes("youtube.com/watch")) {
          videoId = new URLSearchParams(url.split("?")[1] || "").get("v") || "";
        } else if (url.includes("youtu.be")) {
          videoId = url.split("/").pop()?.split("?")[0] || "";
        } else {
          videoId = url;
        }

        if (!videoId) return;

        const html = `<div data-widget="youtube" data-video-id="${videoId}" class="my-10" contenteditable="false">
          <div class="text-[12px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2 select-none">
            <svg class="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-2.75 12.84 12.84 0 0 0-1.81-.17H10a12.84 12.84 0 0 0-1.81.17 4.83 4.83 0 0 1-3.77 2.75A4.86 4.86 0 0 0 2 11.09V13a4.86 4.86 0 0 0 2.42 4.4 4.83 4.83 0 0 1 3.77 2.75 12.84 12.84 0 0 0 1.81.17H14a12.84 12.84 0 0 0 1.81-.17 4.83 4.83 0 0 1 3.77-2.75A4.86 4.86 0 0 0 22 13v-1.91a4.86 4.86 0 0 0-2.41-4.4ZM10 15.5v-7l6 3.5Z"/></svg>
            <span>Video Player Widget (Klik untuk mengubah video)</span>
          </div>
          <div class="relative w-full aspect-video overflow-hidden rounded-2xl border border-border shadow-2xl bg-black">
            <iframe src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1" class="absolute inset-0 w-full h-full border-0 pointer-events-none" />
            <div class="absolute inset-0 bg-transparent cursor-pointer" />
          </div>
        </div><p><br></p>`;
        
        insertHtmlAtCursor(html);
      }
    );
  };

  const insertCtaWidgetPrompt = () => {
    openCustomPrompt(
      "Buat Tombol CTA Baru",
      [
        { key: "label", label: "Teks Tombol", defaultValue: "Mulai Ujian" },
        { key: "url", label: "Link Target", defaultValue: "https://" }
      ],
      (values) => {
        const label = values.label;
        const url = values.url;
        if (!label || !url) return;

        const html = `<div data-widget="cta" data-url="${url}" data-label="${label}" class="my-6" contenteditable="false">
          <button type="button" class="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg transition-colors cursor-pointer border-0">
            <span>${label}</span>
            <svg class="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          </button>
          <span class="text-[10px] text-muted-foreground ml-3 select-none">(Klik tombol untuk mengubah teks/link)</span>
        </div><p><br></p>`;

        insertHtmlAtCursor(html);
      }
    );
  };

  const insertResourceCardPrompt = () => {
    openCustomPrompt(
      "Buat Kartu Referensi",
      [
        { key: "label", label: "Judul Referensi", defaultValue: "Dokumentasi HTML" },
        { key: "url", label: "URL Link", defaultValue: "https://" }
      ],
      (values) => {
        const label = values.label;
        const url = values.url;
        if (!label || !url) return;

        const html = `<div data-widget="resource" data-url="${url}" data-label="${label}" class="my-9" contenteditable="false">
          <div class="flex items-center gap-5 p-5 rounded-2xl border border-primary/20 bg-primary/4 cursor-pointer">
            <div class="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1.5 select-none">
                <span class="text-[11px] font-bold uppercase tracking-wider border border-primary/30 px-2 py-0.5 rounded-md bg-primary/10 text-primary">Dokumentasi</span>
              </div>
              <span class="text-[16px] font-semibold text-foreground truncate block text-left">${label}</span>
            </div>
            <span class="text-[10px] text-muted-foreground select-none ml-2">(Klik kartu untuk menyunting)</span>
          </div>
        </div><p><br></p>`;

        insertHtmlAtCursor(html);
      }
    );
  };

  const insertLinkPrompt = () => {
    openCustomPrompt(
      "Masukkan Tautan Link",
      [
        { key: "url", label: "URL Link", defaultValue: "https://" }
      ],
      (values) => {
        const url = values.url;
        if (!url) return;
        executeFormatCommand("createLink", url);
      }
    );
  };

  const insertNotePrompt = () => {
    openCustomPrompt(
      "Buat Catatan (Note)",
      [
        { key: "text", label: "Isi Catatan", placeholder: "Tulis catatan penting di sini..." }
      ],
      (values) => {
        const text = values.text;
        if (!text) return;

        if (activeTab === "visual") {
          const escapedText = text.replace(/"/g, "&quot;");
          const html = `<div data-widget="note" data-text="${escapedText}" class="my-8" contenteditable="false"><div class="flex gap-4 rounded-r-xl border-l-4 border-primary bg-primary/[0.07] px-6 py-5 cursor-pointer"><svg class="w-5 h-5 text-primary shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><div class="text-[15px] text-foreground/85 leading-relaxed" data-note-text="true">${text}</div></div><span class="text-[10px] text-muted-foreground select-none ml-2">(Klik catatan untuk mengubah)</span></div><p><br></p>`;
          insertHtmlAtCursor(html);
        } else {
          insertMarkdown(`\n[!NOTE] ${text}\n`);
        }
      }
    );
  };

  const insertLinkCardPrompt = () => {
    openCustomPrompt(
      "Buat Kartu Tautan (Link Card)",
      [
        { key: "label", label: "Judul Tautan", placeholder: "Contoh: W3Schools HTML Tutorial" },
        { key: "url", label: "URL Link", defaultValue: "https://" }
      ],
      (values) => {
        const label = values.label;
        const url = values.url;
        if (!label || !url) return;

        if (activeTab === "visual") {
          let domain = "";
          try { domain = new URL(url).hostname.replace("www.", ""); } catch {}
          const html = `<div data-widget="linkcard" data-url="${url}" data-label="${label}" data-domain="${domain}" class="my-6" contenteditable="false"><a href="${url}" target="_blank" rel="noopener noreferrer" class="group flex items-center gap-5 p-5 rounded-2xl border border-primary/20 bg-primary/4 hover:bg-primary/8 hover:border-primary/40 transition-all duration-200 no-underline cursor-pointer"><div class="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></div><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1.5"><span class="text-[11px] font-bold uppercase tracking-wider border border-primary/30 px-2 py-0.5 rounded-md bg-primary/10 text-primary">${domain || "Tautan"}</span><span class="text-[11px] text-muted-foreground">Belajar Lengkap di Sini</span></div><span class="text-[16px] font-semibold text-foreground truncate block" data-linkcard-label="true">${label}</span></div><svg class="h-5 w-5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></a><span class="text-[10px] text-muted-foreground select-none ml-2">(Klik kartu untuk menyunting)</span></div><p><br></p>`;
          insertHtmlAtCursor(html);
        } else {
          insertMarkdown(`\n[${label}](${url}#linkcard)\n`);
        }
      }
    );
  };

  // Render formatting toolbar (toolbar itself is NOT sticky; sticky is applied by the caller wrapper)
  const renderToolbar = (isVisualMode = false) => (
    <div className="flex flex-wrap gap-1 items-center p-2 bg-secondary/95 backdrop-blur-sm border border-border rounded-lg text-foreground shadow-sm w-full">
      {/* Headings H1 - H6 */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? executeHeaderCommand("h1") : insertMarkdown("# ", "")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? executeHeaderCommand("h2") : insertMarkdown("## ", "")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? executeHeaderCommand("h3") : insertMarkdown("### ", "")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? executeHeaderCommand("h4") : insertMarkdown("#### ", "")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
        title="Heading 4"
      >
        <Heading4 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? executeHeaderCommand("h5") : insertMarkdown("##### ", "")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors text-[10px] font-black font-mono leading-none flex items-center justify-center w-[28px] h-[28px]"
        title="Heading 5"
      >
        H5
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? executeHeaderCommand("h6") : insertMarkdown("###### ", "")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors text-[10px] font-black font-mono leading-none flex items-center justify-center w-[28px] h-[28px]"
        title="Heading 6"
      >
        H6
      </button>
      <span className="w-px h-4 bg-border mx-1" />
      
      {/* Bold, Italic, Underline */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? executeFormatCommand("bold") : insertMarkdown("**", "**")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
        title="Tebal"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? executeFormatCommand("italic") : insertMarkdown("*", "*")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
        title="Miring"
      >
        <Italic className="h-4 w-4" />
      </button>
      {isVisualMode && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeFormatCommand("underline")}
          className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
          title="Garis Bawah"
        >
          <Underline className="h-4 w-4" />
        </button>
      )}
      <span className="w-px h-4 bg-border mx-1" />

      {/* Paragraph and Line Dividers */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? executeHeaderCommand("p") : insertMarkdown("\n\nParagraph baru...\n")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors text-[10px] font-bold"
        title="Paragraph Baru"
      >
        P
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? executeFormatCommand("insertHorizontalRule") : insertMarkdown("\n---\n")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors text-[10px] font-black flex items-center justify-center w-[28px] h-[28px]"
        title="Garis Pembatas (Divider)"
      >
        HR
      </button>
      
      {/* Block Code */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? insertCodeBlockWidgetPrompt() : insertMarkdown("```html\n", "\n```")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
        title="Blok Kode (VSCode style)"
      >
        <Code className="h-4 w-4" />
      </button>
      {/* Inline Code */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          if (isVisualMode) {
            const sel = window.getSelection();
            const selected = sel && sel.toString() ? sel.toString() : "kode";
            const codeHtml = `<code class="mx-0.5 rounded-md bg-primary/12 border border-primary/20 px-[5px] py-[2px] text-[13.5px] font-mono font-semibold text-primary">${selected}</code>`;
            document.execCommand("insertHTML", false, codeHtml);
          } else {
            insertMarkdown("`", "`");
          }
        }}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors font-mono text-[11px] font-bold"
        title="Kode Inline (inline code)"
      >
        {"</>"}
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? insertCtaWidgetPrompt() : insertMarkdown("[", "](https://link#button)")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors text-[9px] font-black font-mono leading-none flex items-center justify-center gap-1 border border-primary/20 px-2 py-1 bg-primary/10 text-primary"
        title="Tombol Utama CTA (Button)"
      >
        <MousePointerClick className="h-3 w-3 shrink-0" />
        <span>TOMBOL</span>
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? insertLinkPrompt() : insertMarkdown("[", "](https://url)")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
        title="Link Biasa"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      <span className="w-px h-4 bg-border mx-1" />
      
      {/* Media Widgets */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? insertYoutubeWidgetPrompt() : insertMarkdown("\n[Video Penjelasan](https://www.youtube.com/watch?v=VIDEO_ID)\n")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors text-red-500"
        title="Embed YouTube"
      >
        <Play className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? insertResourceCardPrompt() : insertMarkdown("\n- [MDN Web Docs](https://developer.mozilla.org/en-US/docs/...) \n")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors text-orange-500"
        title="Referensi MDN (Dokumentasi)"
      >
        <FileText className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? insertNotePrompt() : insertMarkdown("\n[!NOTE] Tulis catatan penting di sini\n")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors text-primary"
        title="Catatan / Note Block"
      >
        <Info className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertLinkCardPrompt}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors text-violet-500"
        title="Kartu Tautan (Link Card)"
      >
        <Globe className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? executeHeaderCommand("blockquote") : insertMarkdown("\n> Kutipan / referensi di sini...\n")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
        title="Kutipan (Blockquote)"
      >
        <Quote className="h-4 w-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => isVisualMode ? executeFormatCommand("insertUnorderedList") : insertMarkdown("\n* [Teks Citasi](https://url-sumber-kamu) \n")}
        className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors text-[10px] font-bold uppercase tracking-widest text-primary"
        title={isVisualMode ? "Daftar Poin" : "Sitasi / Sumber"}
      >
        {isVisualMode ? <List className="h-4 w-4" /> : "CIT"}
      </button>
      
      {/* Lists */}
      {!isVisualMode && (
        <>
          <span className="w-px h-4 bg-border mx-1" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertMarkdown("\n* ", "")}
            className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertMarkdown("\n1. ", "")}
            className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </>
      )}
      {isVisualMode && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeFormatCommand("insertOrderedList")}
          className="p-1.5 rounded hover:bg-muted cursor-pointer transition-colors"
          title="Daftar Angka"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  // ──────────────────────────────────────────────────────────────
  // Custom Markdown Components for matching exact frontend styling
  // Each element gets data-offset from AST so clicking in the live
  // preview panel jumps the textarea editor to that source position.
  // ──────────────────────────────────────────────────────────────
  const PreviewMarkdownComponents = {
    p: ({ node, children }: any) => (
      <div data-offset={node?.position?.start?.offset} className="text-[20.5px] leading-[1.9] text-foreground/80 mb-7 font-normal tracking-[0.01em] rounded transition-colors">{children}</div>
    ),
    h1: ({ node, children }: any) => (
      <h1 data-offset={node?.position?.start?.offset} className="text-[36px] md:text-[42px] font-black tracking-tight text-foreground mb-8 mt-0 leading-[1.1] rounded transition-colors">
        {children}
      </h1>
    ),
    h2: ({ node, children }: any) => (
      <h2 data-offset={node?.position?.start?.offset} className="text-[26px] md:text-[30px] font-extrabold tracking-tight text-foreground mt-16 mb-6 leading-snug rounded transition-colors">
        {children}
      </h2>
    ),
    h3: ({ node, children }: any) => (
      <h3 data-offset={node?.position?.start?.offset} className="text-[21.5px] md:text-[24px] font-bold text-foreground mt-14 mb-4 leading-snug rounded transition-colors">
        {children}
      </h3>
    ),
    h4: ({ node, children }: any) => (
      <h4 data-offset={node?.position?.start?.offset} className="text-[19px] font-bold text-foreground mt-12 mb-3 rounded transition-colors">{children}</h4>
    ),
    h5: ({ node, children }: any) => (
      <h5 data-offset={node?.position?.start?.offset} className="text-[17px] font-bold text-foreground mt-10 mb-2 rounded transition-colors">{children}</h5>
    ),
    h6: ({ node, children }: any) => (
      <h6 data-offset={node?.position?.start?.offset} className="text-[15px] font-bold text-foreground mt-8 mb-2 uppercase tracking-wide rounded transition-colors">{children}</h6>
    ),
    ul: ({ node, children }: any) => (
      <ul data-offset={node?.position?.start?.offset} className="my-7 ml-1 space-y-3.5 rounded transition-colors">{children}</ul>
    ),
    ol: ({ node, children }: any) => (
      <ol data-offset={node?.position?.start?.offset} className="my-7 ml-1 space-y-3.5 list-decimal list-inside rounded transition-colors">{children}</ol>
    ),
    li: ({ node, children }: any) => (
      <li data-offset={node?.position?.start?.offset} className="flex items-start gap-3.5 text-[20.5px] text-foreground/80 leading-[1.85] rounded transition-colors">
        <span className="mt-[11px] shrink-0 w-2 h-2 rounded-full bg-primary/60" />
        <span>{children}</span>
      </li>
    ),
    hr: ({ node }: any) => <hr data-offset={node?.position?.start?.offset} className="my-14 border-border" />,
    strong: ({ node, children }: any) => (
      <strong data-offset={node?.position?.start?.offset} className="font-extrabold text-foreground">{children}</strong>
    ),
    em: ({ node, children }: any) => (
      <em data-offset={node?.position?.start?.offset} className="italic text-foreground/75">{children}</em>
    ),
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      const lang = match ? match[1] : "";
      const codeString = String(children).replace(/\n$/, "");

      if (!inline && match) {
        return (
          <div data-offset={node?.position?.start?.offset} className="code-block-wrapper my-10 rounded-xl overflow-hidden border border-white/[0.07] shadow-2xl">
            <div className="flex items-center justify-between bg-[#1e1e2e] px-4 py-2.5 border-b border-white/6">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-white/25 font-mono">{lang}</span>
              <span className="text-[10px] text-white/15 font-mono select-none">code</span>
            </div>
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
      return (
        <code
          data-offset={node?.position?.start?.offset}
          className="mx-0.5 rounded-md bg-primary/12 border border-primary/20 px-[5px] py-[2px] text-[13.5px] font-mono font-semibold text-primary"
          style={{ fontFamily: "var(--font-mono, monospace)" }}
          {...props}
        >
          {children}
        </code>
      );
    },
    a: ({ node, href, children }: any) => {
      // CTA Button
      if (href && (href.endsWith("#cta") || href.endsWith("#button"))) {
        const cleanHref = href.replace(/#(cta|button)$/, "");
        return (
          <div data-offset={node?.position?.start?.offset} className="my-6">
            <a
              href={cleanHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground hover:bg-primary/95 text-[15px] font-bold rounded-xl shadow-lg transition-colors no-underline cursor-pointer"
            >
              <span>{children}</span>
              <ExternalLink className="h-4.5 w-4.5" />
            </a>
          </div>
        );
      }

      // YouTube embed
      if (href && (href.includes("youtube.com/watch") || href.includes("youtu.be") || href.includes("youtube.com/embed"))) {
        let videoId = "";
        if (href.includes("youtube.com/watch")) {
          videoId = new URLSearchParams(href.split("?")[1] || "").get("v") || "";
        } else {
          videoId = href.split("/").pop()?.split("?")[0] || "";
        }
        if (videoId) {
          return (
            <div data-offset={node?.position?.start?.offset} className="my-10">
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

      // Link card: href ends with #linkcard
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
            data-offset={node?.position?.start?.offset}
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

      // External doc card (specific known domains)
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
          <a
            data-offset={node?.position?.start?.offset}
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
          data-offset={node?.position?.start?.offset}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold underline-offset-2 hover:underline"
        >
          {children}
        </a>
      );
    },
    // Note/callout block rendered from blockquote with [!NOTE]
    blockquote: ({ node, children }: any) => {
      // Check if this is a [!NOTE] style callout
      const childStr = String(children);
      void childStr;
      return (
        <div data-offset={node?.position?.start?.offset} className="my-9 flex gap-4 rounded-r-xl border-l-4 border-primary bg-primary/[0.07] px-6 py-6 rounded transition-colors">
          <div className="text-[19.5px] text-foreground/80 leading-[1.85] [&>div]:mb-0">{children}</div>
        </div>
      );
    },
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-xs animate-in fade-in duration-300">
      
      {/* LEFT: Selectors */}
      <div className={`transition-all duration-300 ${
        activeTab === "split" || activeTab === "visual" ? "hidden" : "lg:col-span-4"
      } bg-card border border-border rounded-lg p-5 shadow-sm space-y-4`}>
        <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
          <BookOpen className="h-4.5 w-4.5 text-primary" />
          <span>Pilih Target Modul</span>
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
                ...roadmaps.map((r) => ({ value: r._id, label: r.title })),
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

        {selectedRoadmapId && selectedNodeId && (
          <div className="border-t border-border pt-4 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded font-semibold cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? "Menyimpan..." : "Simpan Materi"}</span>
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Editor Workspace (overflow-visible enables sticky toolbar to stick relative to CMS <main> scrollbar) */}
      <div className={`bg-card border border-border rounded-lg shadow-sm flex flex-col min-h-[580px] transition-all duration-300 overflow-visible ${
        activeTab === "split" || activeTab === "visual" ? "lg:col-span-12" : "lg:col-span-8"
      }`}>
        {selectedRoadmapId && selectedNodeId ? (
          <>
            {/* Header tab controller */}
            <div className="px-5 py-3 border-b border-border bg-secondary flex justify-between items-center shrink-0">
              <span className="font-semibold text-foreground flex items-center gap-2">
                <span>Editor Materi: {learnableNodes.find(n => n.id === selectedNodeId)?.label}</span>
                {activeTab === "split" && (
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold uppercase tracking-wider">Split View</span>
                )}
                {activeTab === "visual" && (
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold uppercase tracking-wider">Visual WYSIWYG</span>
                )}
              </span>

              <div className="flex items-center gap-3">
                {(activeTab === "split" || activeTab === "visual") && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground hover:bg-primary/95 rounded text-[11px] font-bold cursor-pointer disabled:opacity-50 shadow"
                  >
                    <Save className="h-3 w-3" />
                    <span>{saving ? "Simpan..." : "Simpan"}</span>
                  </button>
                )}

                <div className="flex border border-border rounded bg-background p-0.5">
                  <button
                    onClick={() => setActiveTab("edit")}
                    className={`flex items-center gap-1 px-3 py-1 rounded transition-all cursor-pointer ${
                      activeTab === "edit" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"
                    }`}
                    title="Editor Markdown biasa"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Editor</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("visual")}
                    className={`flex items-center gap-1 px-3 py-1 rounded transition-all cursor-pointer ${
                      activeTab === "visual" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"
                    }`}
                    title="Editor visual langsung seperti Wordpress"
                  >
                    <Layout className="h-3.5 w-3.5" />
                    <span>Visual Editor</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("split")}
                    className={`flex items-center gap-1 px-3 py-1 rounded transition-all cursor-pointer ${
                      activeTab === "split" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"
                    }`}
                    title="Editor & Pratinjau Bersamaan"
                  >
                    <Columns className="h-3.5 w-3.5" />
                    <span>Split Screen</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`flex items-center gap-1 px-3 py-1 rounded transition-all cursor-pointer ${
                      activeTab === "preview" ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground"
                    }`}
                    title="Hanya Pratinjau"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Pratinjau</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Inputs & Textarea panels */}
            <div className="p-5 flex-1 flex flex-col gap-4 overflow-visible">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">
                    Judul Halaman Materi
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="Judul materi..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">
                    Slug Link
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="slug-materi"
                  />
                </div>
              </div>

              {activeTab === "visual" ? (
                /* VISUAL WYSIWYG EDITOR MODE */
                <div className="flex-1 flex flex-col min-h-[480px]">
                  <span className="font-bold text-[9px] uppercase text-muted-foreground tracking-wider mb-2">Visual WYSIWYG Panel (Ketik langsung di bawah)</span>
                  {/* Toolbar always visible — sits above scrollable content, no sticky needed */}
                  <div className="shrink-0 mb-2">
                    {renderToolbar(true)}
                  </div>
                  {/* Independently scrollable content area — toolbar never disappears */}
                  <div
                    id="wysiwyg-editor"
                    ref={visualEditorRef}
                    contentEditable
                    onInput={handleVisualEditorInput}
                    onClick={handleVisualEditorClick}
                    className="flex-1 p-8 pb-16 border border-border rounded-lg bg-background max-w-none material-reader focus:outline-none focus:ring-1 focus:ring-primary/30 overflow-y-auto"
                    style={{ minHeight: '500px', maxHeight: 'calc(100vh - 290px)' }}
                  />
                </div>
              ) : activeTab === "split" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch flex-1 min-h-[480px]">
                  {/* LEFT PANE: Editor */}
                  <div className="flex flex-col h-full border border-border rounded-lg p-3.5 bg-background/50">
                    <span className="font-bold text-[9px] uppercase text-muted-foreground tracking-wider mb-2">Editor Panel</span>
                    <div className="sticky top-0 z-30 mb-2 bg-background/50">
                      {renderToolbar(false)}
                    </div>
                    <textarea
                      id="markdown-editor-split"
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="flex-1 min-h-[380px] w-full p-4 bg-background border border-border rounded-lg font-mono text-[13px] focus:outline-none focus:border-primary resize-y leading-relaxed"
                      placeholder="# Tulis isi materi Anda menggunakan Markdown di sini..."
                    />
                  </div>

                  {/* RIGHT PANE: Live Preview — click any element to jump editor to that line */}
                  <div className="flex flex-col h-full border border-border rounded-lg p-3.5 bg-background">
                    <span className="font-bold text-[9px] uppercase text-muted-foreground tracking-wider mb-2">
                      Pratinjau Langsung
                      <span className="ml-2 text-primary/60 normal-case font-normal">(klik elemen → lompat ke editor)</span>
                    </span>
                    <div
                      onClick={handlePreviewClick}
                      className="flex-1 min-h-[380px] max-h-[520px] overflow-y-auto p-6 border border-border rounded-lg bg-background max-w-none material-reader preview-click-container cursor-default"
                    >
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={PreviewMarkdownComponents}
                      >
                        {content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : activeTab === "edit" ? (
                <div className="flex-1 flex flex-col">
                  <div className="sticky top-0 z-30 mb-2 bg-card">
                    {renderToolbar(false)}
                  </div>
                  <textarea
                    id="markdown-editor"
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1 min-h-[380px] w-full p-5 bg-background border border-border rounded-lg font-mono text-[13px] focus:outline-none focus:border-primary resize-y leading-relaxed"
                    placeholder="# Tulis isi materi Anda menggunakan Markdown di sini..."
                  />
                </div>
              ) : (
                <div
                  onClick={handlePreviewClick}
                  className="flex-1 p-8 border border-border rounded-lg bg-background max-h-[500px] overflow-y-auto max-w-none material-reader animate-in fade-in duration-200 preview-click-container cursor-default"
                >
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={PreviewMarkdownComponents}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Placeholder display when no selection */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground animate-fade-in">
            <HelpCircle className="h-10 w-10 text-muted-foreground mb-3 animate-pulse" />
            <h4 className="font-semibold text-foreground">Pilih target modul belajar</h4>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-xs">
              Pilih peta jalan di panel kiri dan klik node topik/materi spesifik untuk mulai menyunting.
            </p>
          </div>
        )}
      </div>

      {/* CUSTOM INPUT PROMPT MODAL */}
      {promptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPromptOpen(false)} />
          <form
            onSubmit={handlePromptSubmit}
            className="relative w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl z-10 space-y-4 animate-in scale-in duration-200"
          >
            <h3 className="text-sm font-extrabold text-foreground leading-snug">
              {promptTitle}
            </h3>
            <div className="space-y-3 text-xs">
              {promptFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={promptValues[field.key] || ""}
                    onChange={(e) =>
                      setPromptValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
                    required
                    autoFocus
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPromptOpen(false)}
                className="flex-1 py-2 px-3 border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-primary/10"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default CmsMaterialEditor;
