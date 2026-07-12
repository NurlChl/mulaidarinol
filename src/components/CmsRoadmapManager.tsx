"use client";

import { useState, useEffect, useRef } from "react";
import { saveRoadmap, deleteRoadmap } from "@/app/actions/cms";
import { Save, Plus, Trash2, Edit, Map, LayoutGrid, ChevronUp, ChevronDown, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/ModalProvider";
import { SearchableSelect } from "./SearchableSelect";

interface NodeData {
  id: string;
  label: string;
  type: "phase" | "topic";
  parentId?: string;
  x?: number;
  y?: number;
}

interface RoadmapData {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  isPublished: boolean;
  nodes: NodeData[];
}

interface CmsRoadmapManagerProps {
  initialRoadmaps: RoadmapData[];
}

export function CmsRoadmapManager({ initialRoadmaps }: CmsRoadmapManagerProps) {
  const router = useRouter();
  const { showModal } = useModal();
  const [roadmaps, setRoadmaps] = useState<RoadmapData[]>(initialRoadmaps);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapData | null>(null);

  // Sync roadmaps list when initialRoadmaps prop changes (e.g. after router.refresh re-renders the RSC)
  // Use a ref to track the previous value to avoid infinite loops
  const prevInitialRef = useRef(initialRoadmaps);
  useEffect(() => {
    if (prevInitialRef.current !== initialRoadmaps) {
      prevInitialRef.current = initialRoadmaps;
      setRoadmaps(initialRoadmaps);
    }
  }, [initialRoadmaps]);

  // Form Metadata state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Compass");
  const [color, setColor] = useState("#6366f1");
  const [isPublished, setIsPublished] = useState(false);
  const [nodes, setNodes] = useState<NodeData[]>([]);

  // Node form state
  const [nodeId, setNodeId] = useState("");
  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeType, setNodeType] = useState<"phase" | "topic">("topic");
  const [nodeParent, setNodeParent] = useState("");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startNewRoadmap = () => {
    setSelectedRoadmap({
      title: "",
      slug: "",
      description: "",
      icon: "Compass",
      color: "#6366f1",
      isPublished: false,
      nodes: [],
    });
    setTitle("");
    setSlug("");
    setDescription("");
    setIcon("Compass");
    setColor("#6366f1");
    setIsPublished(false);
    setNodes([]);
    setEditingNodeId(null);
  };

  const selectRoadmapForEdit = (roadmap: RoadmapData) => {
    setSelectedRoadmap(roadmap);
    setTitle(roadmap.title);
    setSlug(roadmap.slug);
    setDescription(roadmap.description);
    setIcon(roadmap.icon);
    setColor(roadmap.color);
    setIsPublished(roadmap.isPublished);
    setNodes(roadmap.nodes || []);
    setEditingNodeId(null);
  };

  const generateUniqueIdFromLabel = (label: string) => {
    let baseSlug = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!baseSlug) baseSlug = "node";

    let uniqueSlug = baseSlug;
    let counter = 1;
    while (nodes.some((n) => n.id === uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    return uniqueSlug;
  };

  const handleLabelChange = (val: string) => {
    setNodeLabel(val);
    if (!editingNodeId) {
      const uniqueId = generateUniqueIdFromLabel(val);
      setNodeId(uniqueId);
    }
  };

  const startEditNode = (node: NodeData) => {
    setEditingNodeId(node.id);
    setNodeId(node.id);
    setNodeLabel(node.label);
    setNodeType(node.type);
    setNodeParent(node.parentId || "");
  };

  const cancelEditNode = () => {
    setEditingNodeId(null);
    setNodeId("");
    setNodeLabel("");
    setNodeType("topic");
    setNodeParent("");
  };

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeId || !nodeLabel) {
      showModal({
        title: "Validasi Gagal",
        message: "ID Node dan Label Tampilan wajib diisi.",
        type: "warning",
      });
      return;
    }

    if (editingNodeId) {
      // Edit Mode Update
      setNodes((prev) =>
        prev.map((n) =>
          n.id === editingNodeId
            ? { ...n, label: nodeLabel, type: nodeType, parentId: nodeType === "phase" ? undefined : (nodeParent || undefined) }
            : n
        )
      );
      setEditingNodeId(null);
      setNodeId("");
      setNodeLabel("");
      setNodeType("topic");
      setNodeParent("");
      return;
    }

    // Double check node id uniqueness
    if (nodes.some((n) => n.id === nodeId)) {
      showModal({
        title: "ID Node Duplikat",
        message: "ID Node harus unik dan tidak boleh sama dengan node lain di alur belajar ini.",
        type: "error",
      });
      return;
    }

    // Phase nodes never have a parent
    const effectiveParent = nodeType === "phase" ? undefined : (nodeParent || undefined);

    const newNode: NodeData = {
      id: nodeId,
      label: nodeLabel,
      type: nodeType,
      parentId: effectiveParent,
    };

    setNodes((prev) => [...prev, newNode]);

    // Clear node form
    setNodeId("");
    setNodeLabel("");
    setNodeType("topic");
    setNodeParent("");
  };

  // Build ordered flat list: phases at root, topics indented under their phase
  const buildOrderedDisplay = () => {
    const phases = nodes.filter((n) => n.type === "phase");
    const result: { node: NodeData; indent: boolean }[] = [];

    // We need to build the list preserving the original order of nodes
    // but grouping topics under their phase
    // Strategy: iterate nodes in order, place phases, and for each phase collect its topics
    const placed = new Set<string>();
    const phaseIndices = nodes
      .map((n, idx) => ({ n, idx }))
      .filter(({ n }) => n.type === "phase");

    for (let i = 0; i < phaseIndices.length; i++) {
      const { n: phase, idx: phaseIdx } = phaseIndices[i];
      if (!placed.has(phase.id)) {
        result.push({ node: phase, indent: false });
        placed.add(phase.id);
      }

      // Find topics that belong to this phase, preserving their relative order
      const nextPhaseIdx = phaseIndices[i + 1]?.idx ?? nodes.length;
      nodes.forEach((n, idx) => {
        if (!placed.has(n.id) && n.type !== "phase" && n.parentId === phase.id) {
          result.push({ node: n, indent: true });
          placed.add(n.id);
        }
      });
    }

    // Topics without a phase parent (orphans) at the end
    nodes.forEach((n) => {
      if (!placed.has(n.id)) {
        result.push({ node: n, indent: n.type !== "phase" });
        placed.add(n.id);
      }
    });

    return result;
  };

  const orderedDisplay = buildOrderedDisplay();

  // Move a phase up/down among phases only
  const movePhase = (phaseId: string, direction: "up" | "down") => {
    const phaseNodes = nodes.filter((n) => n.type === "phase");
    const phaseIdx = phaseNodes.findIndex((n) => n.id === phaseId);
    const targetIdx = direction === "up" ? phaseIdx - 1 : phaseIdx + 1;
    if (targetIdx < 0 || targetIdx >= phaseNodes.length) return;

    // We need to swap the entire blocks (phase + its children)
    const buildBlock = (phaseId: string) => {
      const phase = nodes.find((n) => n.id === phaseId)!;
      const children = nodes.filter((n) => n.parentId === phaseId);
      return [phase, ...children];
    };

    const phaseA = phaseNodes[phaseIdx];
    const phaseB = phaseNodes[targetIdx];
    const blockA = buildBlock(phaseA.id);
    const blockB = buildBlock(phaseB.id);

    // Remove both blocks from nodes and rebuild
    const withoutBlocks = nodes.filter(
      (n) => !blockA.some((b) => b.id === n.id) && !blockB.some((b) => b.id === n.id)
    );

    // Find where blockA starts in the original nodes array
    const posA = nodes.findIndex((n) => n.id === phaseA.id);
    const posB = nodes.findIndex((n) => n.id === phaseB.id);

    // Insert blocks at swapped positions
    const newNodes: NodeData[] = [];
    let insertedA = false;
    let insertedB = false;

    withoutBlocks.forEach((n) => {
      const origIdx = nodes.indexOf(n);
      if (!insertedB && direction === "up" && origIdx >= posB) {
        if (!insertedA) { newNodes.push(...blockA); insertedA = true; }
        if (!insertedB) { newNodes.push(...blockB); insertedB = true; }
      }
      if (!insertedA && direction === "down" && origIdx >= posA) {
        // skip - we handle at posB
      }
      newNodes.push(n);
    });

    // Simpler approach: reconstruct full list in phase order
    const newPhaseOrder =
      direction === "up"
        ? [
            ...phaseNodes.slice(0, targetIdx),
            phaseNodes[phaseIdx],
            phaseNodes[targetIdx],
            ...phaseNodes.slice(phaseIdx + 1),
          ]
        : [
            ...phaseNodes.slice(0, phaseIdx),
            phaseNodes[targetIdx],
            phaseNodes[phaseIdx],
            ...phaseNodes.slice(targetIdx + 1),
          ];

    const rebuilt: NodeData[] = [];
    const noPhaseNodes = nodes.filter((n) => n.type !== "phase" && !n.parentId);
    newPhaseOrder.forEach((ph) => {
      rebuilt.push(ph);
      // Add its children in original order
      nodes.filter((n) => n.parentId === ph.id).forEach((n) => rebuilt.push(n));
    });
    // Append orphan topics
    noPhaseNodes.forEach((n) => {
      if (!rebuilt.some((r) => r.id === n.id)) rebuilt.push(n);
    });

    setNodes(rebuilt);
  };

  // Move a topic up/down within same phase
  const moveTopic = (topicId: string, direction: "up" | "down") => {
    const topic = nodes.find((n) => n.id === topicId);
    if (!topic) return;

    const siblings = nodes.filter((n) => n.parentId === topic.parentId && n.type === "topic");
    const sibIdx = siblings.findIndex((n) => n.id === topicId);
    const targetSibIdx = direction === "up" ? sibIdx - 1 : sibIdx + 1;
    if (targetSibIdx < 0 || targetSibIdx >= siblings.length) return;

    const sibA = siblings[sibIdx];
    const sibB = siblings[targetSibIdx];

    const newNodes = [...nodes];
    const idxA = newNodes.findIndex((n) => n.id === sibA.id);
    const idxB = newNodes.findIndex((n) => n.id === sibB.id);
    [newNodes[idxA], newNodes[idxB]] = [newNodes[idxB], newNodes[idxA]];
    setNodes(newNodes);
  };

  const handleDeleteNode = (id: string) => {
    // Delete target and clean up any dangling child nodes parent references
    setNodes((prev) =>
      prev
        .filter((n) => n.id !== id)
        .map((n) => (n.parentId === id ? { ...n, parentId: undefined } : n))
    );
  };

  const handleSaveRoadmap = async () => {
    if (!title || !slug || !description) {
      showModal({
        title: "Metadata Kosong",
        message: "Silakan isi Judul, Slug, dan Deskripsi Peta Jalan terlebih dahulu.",
        type: "warning",
      });
      return;
    }

    try {
      setSaving(true);
      const res = await saveRoadmap({
        id: selectedRoadmap?._id,
        title,
        slug,
        description,
        icon,
        color,
        isPublished,
        nodes,
      });

      if (res.success) {
        // Update local roadmaps state immediately so list is fresh without waiting for page reload
        const updatedRoadmap: RoadmapData = {
          _id: res.roadmapId,
          title,
          slug,
          description,
          icon,
          color,
          isPublished,
          nodes,
        };

        if (selectedRoadmap?._id) {
          // Update existing
          setRoadmaps((prev) =>
            prev.map((r) => (r._id === selectedRoadmap._id ? updatedRoadmap : r))
          );
        } else {
          // Add new
          setRoadmaps((prev) => [updatedRoadmap, ...prev]);
        }

        showModal({
          title: "Peta Jalan Disimpan",
          message: "Alur belajar (roadmap) berhasil disimpan ke dalam database.",
          type: "success",
        });
        setSelectedRoadmap(null);
        router.refresh(); // re-fetch RSC to sync server state
      } else {
        showModal({
          title: "Gagal Menyimpan",
          message: res.error || "Gagal menyimpan perubahan peta jalan.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      showModal({
        title: "Galat Penyimpanan",
        message: "Terjadi kesalahan koneksi database saat menyimpan data.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoadmap = async (id: string) => {
    showModal({
      title: "Hapus Peta Jalan ini?",
      message:
        "Apakah Anda yakin ingin menghapus roadmap ini? Tindakan ini bersifat permanen dan akan menghapus semua materi, kuis, serta riwayat progres belajar terkait.",
      type: "warning",
      confirmText: "Ya, Hapus Permanen",
      cancelText: "Batal",
      onConfirm: async () => {
        try {
          setDeletingId(id);
          const res = await deleteRoadmap(id);
          if (res.success) {
            if (selectedRoadmap?._id === id) {
              setSelectedRoadmap(null);
            }
            // Update local state immediately
            setRoadmaps((prev) => prev.filter((r) => r._id !== id));
            router.refresh(); // re-fetch RSC for other pages
            showModal({
              title: "Berhasil Dihapus",
              message: "Roadmap telah dihapus dari sistem.",
              type: "success",
            });
          } else {
            showModal({
              title: "Gagal Menghapus",
              message: res.error || "Gagal menghapus peta jalan dari server.",
              type: "error",
            });
          }
        } catch (err) {
          console.error(err);
          showModal({
            title: "Kesalahan internal",
            message: "Gagal memproses penghapusan.",
            type: "error",
          });
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  // Phase options for parent select (only phases)
  const phaseOptions = nodes.filter((n) => n.type === "phase");

  return (
    <div className="space-y-6 text-xs">
      {/* 1. ROADMAP LIST VIEW */}
      {!selectedRoadmap && (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-secondary flex justify-between items-center">
            <h3 className="font-bold uppercase tracking-wider text-foreground">
              Daftar Kelola Roadmap
            </h3>
            <button
              onClick={startNewRoadmap}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/95 rounded font-semibold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Buat Roadmap Baru</span>
            </button>
          </div>

          <div className="divide-y divide-border">
            {roadmaps.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                Belum ada roadmap yang dibuat. Mulai dengan mengeklik &quot;Buat Roadmap Baru&quot;.
              </div>
            ) : (
              roadmaps.map((r) => (
                <div key={r._id} className="p-4 flex items-center justify-between hover:bg-muted/5 transition-colors">
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{r.title}</h4>
                    <p className="text-muted-foreground mt-0.5 max-w-xl truncate">
                      {r.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                      <span>Slug: <strong>{r.slug}</strong></span>
                      <span>•</span>
                      <span>Nodes: <strong>{r.nodes?.length || 0} items</strong></span>
                      <span>•</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase ${
                          r.isPublished
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {r.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => selectRoadmapForEdit(r)}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-border rounded hover:bg-muted font-medium cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit Nodes</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRoadmap(r._id!)}
                      disabled={deletingId === r._id}
                      className="p-1.5 text-destructive bg-destructive/10 hover:bg-destructive hover:text-white rounded border border-destructive/20 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. ROADMAP EDIT WORKSPACE */}
      {selectedRoadmap && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Metadata configuration */}
          <div className="lg:col-span-4 bg-card border border-border rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Map className="h-4 w-4 text-primary" />
              <span>Metadata Roadmap</span>
            </h3>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">
                  Judul Roadmap
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
                  placeholder="e.g. Frontend Developer"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary"
                  placeholder="e.g. frontend-developer"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary resize-y"
                  placeholder="Deskripsi singkat roadmap..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">
                    Lucide Icon Name
                  </label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-xs text-foreground focus:outline-none"
                    placeholder="Compass"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1">
                    Accent Color
                  </label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-8 px-1.5 py-0.5 bg-background border border-border rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary cursor-pointer h-4 w-4"
                />
                <label htmlFor="published" className="font-semibold text-foreground cursor-pointer">
                  Publish untuk Publik
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-border pt-4 mt-6">
              <button
                onClick={handleSaveRoadmap}
                disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded font-semibold cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Roadmap</span>
              </button>
              <button
                onClick={() => setSelectedRoadmap(null)}
                className="w-full px-4 py-2 border border-border hover:bg-muted rounded font-semibold cursor-pointer"
              >
                Kembali
              </button>
            </div>
          </div>

          {/* Node hierarchy editor list */}
          <div className="lg:col-span-8 bg-card border border-border rounded-lg p-5 shadow-sm space-y-6">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <LayoutGrid className="h-4 w-4 text-primary" />
                <span>Kelola Node Roadmap ({nodes.length})</span>
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Tambah phase dan materi, atur urutan, serta hubungkan parent-child di alur belajar ini.
              </p>
            </div>

            {/* Quick Add/Edit Node Form */}
            <form
              onSubmit={handleAddNode}
              className="p-4 bg-secondary border border-border rounded space-y-3"
            >
              <h4 className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                {editingNodeId ? "✏️ Edit Node" : "➕ Tambah Node Baru"}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-semibold text-muted-foreground uppercase mb-1">
                    Node ID (Unique, auto-generate)
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={nodeId}
                    className="w-full px-2.5 py-1.5 bg-muted border border-border rounded text-[11px] text-muted-foreground focus:outline-none cursor-not-allowed"
                    placeholder="Dibuat otomatis..."
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-muted-foreground uppercase mb-1">
                    Label Tampilan
                  </label>
                  <input
                    type="text"
                    required
                    value={nodeLabel}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-background border border-border rounded text-[11px] text-foreground focus:outline-none"
                    placeholder="e.g. HTML Dasar"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-muted-foreground uppercase mb-1">
                    Jenis Node
                  </label>
                  <SearchableSelect
                    value={nodeType}
                    onChange={(val) => {
                      setNodeType(val as "phase" | "topic");
                      // Phase has no parent
                      if (val === "phase") setNodeParent("");
                    }}
                    options={[
                      { value: "phase", label: "Phase (Fase/Bab)" },
                      { value: "topic", label: "Topic (Materi)" },
                    ]}
                    placeholder="Pilih Jenis Node"
                  />
                </div>

                {nodeType === "topic" && (
                  <div>
                    <label className="block text-[9px] font-semibold text-muted-foreground uppercase mb-1">
                      Parent Phase (Wajib untuk Topic)
                    </label>
                    <SearchableSelect
                      value={nodeParent}
                      onChange={(val) => setNodeParent(val)}
                      options={[
                        { value: "", label: "-- Tanpa Phase (Root) --" },
                        ...phaseOptions.map((n) => ({
                          value: n.id,
                          label: `${n.label}`,
                        })),
                      ]}
                      placeholder="Pilih Phase"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                {editingNodeId ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEditNode}
                      className="flex items-center gap-1 px-4 py-1.5 bg-secondary hover:bg-muted text-foreground border border-border rounded font-semibold cursor-pointer text-xs"
                    >
                      <X className="h-3.5 w-3.5" />
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold cursor-pointer text-xs"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Perbarui Node</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold cursor-pointer text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambahkan Node</span>
                  </button>
                )}
              </div>
            </form>

            {/* Hierarchy Node List */}
            <div className="border border-border rounded overflow-hidden">
              <div className="bg-muted/40 p-2.5 font-semibold text-muted-foreground border-b border-border flex items-center justify-between">
                <span>Hirarki Node Saat Ini</span>
                <span className="text-[10px]">Phase = Bab Utama | Topic = Materi di dalam Phase</span>
              </div>
              <div className="divide-y divide-border max-h-[450px] overflow-y-auto bg-card">
                {nodes.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Belum ada node modul di dalam roadmap ini.
                  </div>
                ) : (
                  orderedDisplay.map(({ node: n, indent }) => {
                    const isPhase = n.type === "phase";
                    const siblings = isPhase
                      ? nodes.filter((x) => x.type === "phase")
                      : nodes.filter((x) => x.parentId === n.parentId && x.type === "topic");
                    const sibIdx = siblings.findIndex((x) => x.id === n.id);
                    const canMoveUp = sibIdx > 0;
                    const canMoveDown = sibIdx < siblings.length - 1;

                    return (
                      <div
                        key={n.id}
                        className={`flex items-center justify-between hover:bg-muted/10 transition-colors ${
                          isPhase
                            ? "p-3 bg-secondary/50 border-l-4 border-l-primary"
                            : "py-2 px-3 pl-8 border-l-4 border-l-emerald-500"
                        } ${editingNodeId === n.id ? "ring-1 ring-inset ring-indigo-500" : ""}`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            {indent && (
                              <span className="text-muted-foreground text-[10px] mr-0.5">└</span>
                            )}
                            <strong className={`text-foreground ${isPhase ? "text-[12px]" : "text-[11px]"}`}>
                              {n.label}
                            </strong>
                            <span className="text-[9px] text-muted-foreground">({n.id})</span>
                            <span
                              className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                                isPhase
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              }`}
                            >
                              {n.type}
                            </span>
                          </div>
                          {n.parentId && (
                            <p className="text-[10px] text-muted-foreground pl-4">
                              Phase: <strong className="text-foreground">{n.parentId}</strong>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEditNode(n)}
                            className={`p-1 rounded cursor-pointer transition-colors ${
                              editingNodeId === n.id
                                ? "text-indigo-500 bg-indigo-500/10 font-bold"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                            title="Edit node"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={!canMoveUp}
                            onClick={() =>
                              isPhase ? movePhase(n.id, "up") : moveTopic(n.id, "up")
                            }
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                            title="Pindahkan ke atas"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={!canMoveDown}
                            onClick={() =>
                              isPhase ? movePhase(n.id, "down") : moveTopic(n.id, "down")
                            }
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                            title="Pindahkan ke bawah"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNode(n.id)}
                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded cursor-pointer transition-colors"
                            title="Hapus node"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CmsRoadmapManager;
