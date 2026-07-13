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
  title: {
    template: "%s | MulaiDariNol",
    default: "MulaiDariNol - AI-First Roadmap & Learning Platform Indonesia",
  },
  description: "Akselerasikan karir developer Anda dengan peta jalan terstruktur, modul interaktif, dan alur kerja berbasis kecerdasan buatan (AI) gratis di Indonesia.",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MulaiDariNol",
    "url": "https://mulaidarinol.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://mulaidarinol.com/articles?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MulaiDariNol",
    "url": "https://mulaidarinol.com",
    "logo": "https://mulaidarinol.com/MulaiDariNol.svg"
  };

  return (
    <html
      lang="id"
      className={`${nunito.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
