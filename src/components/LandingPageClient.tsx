"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import * as Icons from "lucide-react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import PartnerForm from "./PartnerForm";

interface RoadmapCardData {
  title: string;
  slug: string;
  description: string;
  iconName: string;
  color: string;
  badge: string;
  isActive: boolean;
}

interface LandingPageClientProps {
  roadmaps: RoadmapCardData[];
}

export function LandingPageClient({ roadmaps }: LandingPageClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic Lucide Icon Resolver
  const getIcon = (name: string) => {
    const IconComponent = (Icons as any)[name];
    return IconComponent || Icons.Compass;
  };

  useEffect(() => {
    // Entry animations with GSAP
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.fromTo(
        ".hero-badge",
        { opacity: 0, y: -25, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.5)" }
      )
      .fromTo(
        ".hero-title",
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power4.out" },
        "-=0.4"
      )
      .fromTo(
        ".hero-desc",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
        "-=0.5"
      )
      .fromTo(
        ".hero-btn",
        { opacity: 0, y: 15, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.15, ease: "power2.out" },
        "-=0.4"
      )
      .fromTo(
        ".roadmap-card",
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" },
        "-=0.3"
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      <Navbar />

      {/* Modern Glowing Grid Background Elements */}
      <div className="absolute inset-0 grid-bg opacity-[0.22] pointer-events-none z-0" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none z-0" />
      <div className="absolute top-[30vh] right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-3xl pointer-events-none z-0" />

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden z-10">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="hero-badge inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-primary/10 border border-primary/20 text-primary mb-8 select-none">
            <Icons.Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>AI-First Developer Path 2026</span>
          </div>

          <h1 className="hero-title text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08] mb-6">
            Kuasai Karir Developer <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-indigo-600 to-violet-700 dark:via-indigo-400 dark:to-violet-300">
              Di Era Artificial Intelligence
            </span>
          </h1>

          <p className="hero-desc text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Mulai karir IT impian Anda dengan peta jalan belajar yang terstruktur rapi dari nol sampai siap kerja. 
            Pelajari teori esensial, uji pemahaman lewat kuis interaktif, dan langsung praktek coding di browser Anda tanpa ribet.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="#roadmaps"
              className="hero-btn px-6 py-3.5 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 transform active:scale-95 cursor-pointer"
            >
              Lihat Peta Jalan Belajar
            </Link>
            <Link
              href="#partner"
              className="hero-btn px-6 py-3.5 text-xs font-bold uppercase tracking-wider border border-border bg-card hover:bg-muted text-foreground rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer"
            >
              Gabung Jadi Partner
            </Link>
          </div>
        </div>
      </section>

      {/* ROADMAPS GRID SECTION */}
      <section id="roadmaps" className="py-20 border-t border-border/80 bg-background relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-3">
              Peta Jalan Pembelajaran (Roadmaps)
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl font-medium">
              Pilih fokus karir Anda. Peta jalan di bawah dirancang berdasarkan standar tren industri modern dan workflow berbasis AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((card) => {
              const Icon = getIcon(card.iconName);
              return (
                <motion.div
                  key={card.slug}
                  whileHover={card.isActive ? { y: -8, scale: 1.015, borderColor: "var(--primary)" } : {}}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className={`roadmap-card flex flex-col justify-between p-6 rounded-2xl bg-card/90 dark:bg-card/65 backdrop-blur-xs shadow-xs relative ${
                    card.isActive
                      ? "border border-border/80 dark:border-border/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
                      : "border border-border/40 dark:border-border/15 opacity-70"
                  }`}
                >
                  {/* Decorative card glow */}
                  {card.isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-primary/0 via-primary/0 to-primary/3 pointer-events-none" />
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="p-2.5 rounded-xl bg-secondary border border-border text-primary shadow-xs">
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      {card.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <Icons.BookOpen className="h-3 w-3" />
                          <span>{card.badge}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                          <Icons.Lock className="h-3 w-3" />
                          <span>Coming Soon</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">
                      {card.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-6 font-medium">
                      {card.description}
                    </p>
                  </div>

                  <div>
                    {card.isActive ? (
                      <Link
                        href={`/roadmaps/${card.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                      >
                        <span>Mulai Belajar</span>
                        <Icons.ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Segera Hadir</span>
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PARTNER PROGRAM SECTION */}
      <section id="partner" className="py-24 border-t border-border/80 bg-secondary/35 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 inline-block">
                Creator & Community Program
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                Bagikan Keahlian Anda <br />
                Sebagai Mitra Kontributor
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                Kami percaya bahwa ilmu terbaik datang dari para praktisi aktif yang berpengalaman di industri. Sebagai Mentor / Partner di MulaiDariNol, 
                Anda dapat berkontribusi menyusun peta jalan belajar yang realistis, membagikan modul materi yang terstruktur, kuis evaluasi, 
                hingga tantangan coding interaktif untuk membantu talenta baru berkembang.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">✓</div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">Kelola Kurikulum Karir Anda</h4>
                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Tulis dan susun modul pembelajaran secara langsung dengan editor visual interaktif kami yang mudah digunakan.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">✓</div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">Kurasi & Standarisasi Industri</h4>
                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Setiap modul akan ditinjau bersama oleh tim kurator profesional kami untuk memastikan standar materi tetap tinggi, rapi, dan mudah dipahami oleh pemula.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <PartnerForm />
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
