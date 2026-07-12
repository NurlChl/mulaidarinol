import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";
import CmsNotificationListener from "@/components/CmsNotificationListener";

import {
  Compass,
  LayoutDashboard,
  Map,
  BookOpen,
  Trophy,
  Users,
  UserCheck,
  Globe,
  LogOut,
  ChevronRight
} from "lucide-react";

interface CMSLayoutProps {
  children: React.ReactNode;
}

export default async function CMSLayout({ children }: CMSLayoutProps) {
  const session = await auth();

  // Guard: if not logged in or role is user, redirect (as fallback to middleware)
  if (!session || session.user.role === "user") {
    redirect("/cms/login");
  }

  const role = session.user.role;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* CMS SIDEBAR */}
      <aside className="w-64 border-r border-border bg-card flex flex-col justify-between shrink-0 h-screen sticky top-0">
        
        {/* Upper nav list */}
        <div className="flex flex-col flex-1">
          {/* Logo & Portal name */}
          <div className="h-14 border-b border-border flex items-center px-6 justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/MulaiDariNol.svg?v=2"
                alt="MulaiDariNol Logo"
                className="h-7 w-auto dark:hidden"
              />
              <img
                src="/MulaiDariNolLight.svg?v=2"
                alt="MulaiDariNol Logo"
                className="h-7 w-auto hidden dark:block"
              />
            </Link>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {role}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            <Link
              href="/cms"
              className="flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>Overview</span>
            </Link>

            <Link
              href="/cms/roadmaps"
              className="flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <Map className="h-4 w-4 shrink-0" />
              <span>Roadmaps</span>
            </Link>

            <Link
              href="/cms/materials"
              className="flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>Materials Content</span>
            </Link>

            <Link
              href="/cms/quizzes"
              className="flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <Trophy className="h-4 w-4 shrink-0" />
              <span>Quizzes & Challenges</span>
            </Link>

            {/* Admin and Superadmin Only Links */}
            {(role === "admin" || role === "superadmin") && (
              <Link
                href="/cms/partners"
                className="flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <UserCheck className="h-4 w-4 shrink-0" />
                <span>Partner Applications</span>
              </Link>
            )}

            {/* Superadmin Only Links */}
            {role === "superadmin" && (
              <Link
                href="/cms/users"
                className="flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <Users className="h-4 w-4 shrink-0" />
                <span>User Management</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-border space-y-2">
          <Link
            href="/"
            className="flex items-center justify-between px-3 py-2 rounded border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              <span>Back to Website</span>
            </div>
            <ChevronRight className="h-3 w-3" />
          </Link>

          <div className="flex items-center justify-between px-3 py-1">
            <div className="flex items-center gap-2 truncate">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || "User Avatar"}
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="truncate text-left">
                <p className="text-[10px] font-bold text-foreground leading-tight truncate">
                  {session.user.name}
                </p>
                <p className="text-[8px] text-muted-foreground leading-tight truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* CMS MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header toolbar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-8 z-10 shrink-0">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Admin CMS Workspace
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* CMS Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
        <CmsNotificationListener />
      </div>
    </div>
  );
}
