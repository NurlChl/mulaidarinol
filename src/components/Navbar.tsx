"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { Compass, User as UserIcon, LogOut, LayoutDashboard, Shield, Menu, X } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/MulaiDariNol.svg"
                alt="MulaiDariNol Logo"
                className="h-8 w-auto dark:brightness-0 dark:invert transition-all"
              />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Roadmaps
              </Link>
              <Link href="/#partner" className="hover:text-foreground transition-colors">
                Partner Program
              </Link>
            </div>
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-muted border border-border transition-colors cursor-pointer"
                >
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User Profile"}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-card p-1 shadow-lg text-sm text-foreground animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="font-medium truncate">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                      {session.user.role !== "user" && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20 rounded">
                          {session.user.role}
                        </span>
                      )}
                    </div>
                    


                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors cursor-pointer text-left mt-0.5"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/95 rounded transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 rounded hover:bg-muted border border-border text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 pt-2 pb-4 space-y-3 animate-in slide-in-from-top duration-200">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded hover:bg-muted text-sm font-medium"
          >
            Roadmaps
          </Link>
          <Link
            href="/#partner"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded hover:bg-muted text-sm font-medium"
          >
            Partner Program
          </Link>
          
          <div className="border-t border-border pt-3">
            {session ? (
              <div className="space-y-2">
                <div className="px-3 py-1 flex items-center gap-3">
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User Profile"}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium truncate">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                </div>



                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 rounded hover:bg-destructive/10 text-destructive text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 bg-primary text-primary-foreground rounded hover:bg-primary/95 text-sm font-medium"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
