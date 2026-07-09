import type { Metadata } from "next";
import { Nunito, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

// Nunito — fun, rounded, perfect for learning platforms (Duolingo, Codecademy use similar fonts)
const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// JetBrains Mono — used by JetBrains IDEs, great for code readability
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MulaiDariNol - AI-First Roadmap & Learning Platform",
  description: "Accelerate your developer career with structured, interactive learning paths and AI-first workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${nunito.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
