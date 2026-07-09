import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Roadmap from "@/lib/models/Roadmap";
import PartnerApplication from "@/lib/models/PartnerApplication";
import { getDashboardStats } from "@/app/actions/cms";
import {
  Users,
  Compass,
  FileCheck,
  Award,
  Clock,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default async function CMSDashboardPage() {
  const session = await auth();
  const role = session?.user?.role;

  // Fetch stats via server action
  const statsRes = await getDashboardStats();
  const stats = statsRes.stats || {
    users: 0,
    partners: 0,
    admins: 0,
    roadmaps: 0,
    pendingApps: 0,
    nodeCompletions: 0,
  };

  await dbConnect();

  // Fetch last 5 roadmaps
  const recentRoadmaps = await Roadmap.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("creatorId", "name")
    .lean();

  // Fetch pending partner applications (Admins/Superadmins only)
  let pendingApps: any[] = [];
  if (role === "admin" || role === "superadmin") {
    pendingApps = await PartnerApplication.find({ status: "pending" })
      .populate("userId", "name email image")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
  }

  return (
    <div className="space-y-8">
      {/* Title greeting */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">CMS Overview</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Selamat datang kembali, {session?.user?.name}. Berikut adalah ringkasan performa platform.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Users Count */}
        <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Siswa Terdaftar
            </span>
            <strong className="text-2xl font-bold text-foreground block mt-1">
              {stats.users}
            </strong>
          </div>
          <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Partners Count */}
        <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Mitra Partner
            </span>
            <strong className="text-2xl font-bold text-foreground block mt-1">
              {stats.partners}
            </strong>
          </div>
          <div className="p-3 rounded bg-purple-500/10 border border-purple-500/20 text-purple-500">
            <Award className="h-5 w-5" />
          </div>
        </div>

        {/* Roadmaps Count */}
        <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Total Roadmap
            </span>
            <strong className="text-2xl font-bold text-foreground block mt-1">
              {stats.roadmaps}
            </strong>
          </div>
          <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <Compass className="h-5 w-5" />
          </div>
        </div>

        {/* Node completion Count */}
        <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Penyelesaian Materi
            </span>
            <strong className="text-2xl font-bold text-foreground block mt-1">
              {stats.nodeCompletions}
            </strong>
          </div>
          <div className="p-3 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
            <FileCheck className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Detailed overview blocks split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Recent Roadmaps list */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden lg:col-span-7">
          <div className="px-5 py-4 border-b border-border bg-secondary flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Roadmap Terbaru
            </h3>
            <Link
              href="/cms/roadmaps"
              className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>Semua Roadmap</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recentRoadmaps.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Belum ada roadmap yang dibuat. Klik menu Roadmap untuk membuat baru.
              </div>
            ) : (
              recentRoadmaps.map((r: any) => (
                <div key={r._id.toString()} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-semibold text-foreground">{r.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Dibuat oleh: {r.creatorId?.name || "System"} • {r.nodes.length} Node
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      r.isPublished
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}>
                      {r.isPublished ? "Published" : "Draft"}
                    </span>
                    
                    <Link
                      href={`/cms/roadmaps?id=${r._id.toString()}`}
                      className="p-1 rounded border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Pending applications (if admin) or User info */}
        <div className="space-y-6 lg:col-span-5">
          {role === "admin" || role === "superadmin" ? (
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-secondary flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Pengajuan Partner (Pending: {stats.pendingApps})
                </h3>
                <Link
                  href="/cms/partners"
                  className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Lihat Semua</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-border">
                {pendingApps.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Tidak ada pengajuan partner yang tertunda.
                  </div>
                ) : (
                  pendingApps.map((app: any) => (
                    <div key={app._id.toString()} className="p-4 flex items-start justify-between gap-4 text-xs">
                      <div>
                        <h4 className="font-semibold text-foreground">{app.userId?.name}</h4>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                          {app.userId?.email}
                        </p>
                        <p className="text-[10px] text-primary mt-1 hover:underline truncate max-w-[200px]">
                          <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer">
                            {app.portfolioUrl}
                          </a>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 shrink-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Clock className="h-2.5 w-2.5" />
                          <span>Pending</span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Partner information box */
            <div className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-4 text-xs leading-relaxed">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <ShieldAlert className="h-4 w-4" />
                <span>Informasi Akun Partner</span>
              </div>
              <p className="text-muted-foreground">
                Sebagai Mitra Partner, Anda memiliki akses penuh untuk merancang roadmap kustom dan menambahkan modul materi, kuis ujian, serta tantangan coding interaktif.
              </p>
              <p className="text-muted-foreground">
                Setiap materi yang Anda buat akan ditinjau oleh tim administrator sebelum dipublikasikan untuk umum demi menjaga kualitas kurikulum.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
