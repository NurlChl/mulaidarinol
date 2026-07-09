import Link from "next/link";
import { Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/MulaiDariNol.svg"
              alt="MulaiDariNol Logo"
              className="h-7 w-auto dark:brightness-0 dark:invert"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} MulaiDariNol. All rights reserved. Platform Roadmap & LMS Interaktif.
          </p>

          <div className="flex gap-4 text-xs text-muted-foreground font-medium">
            <Link href="/" className="hover:text-foreground transition-colors">
              Roadmaps
            </Link>
            <Link href="/#partner" className="hover:text-foreground transition-colors">
              Become Partner
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
