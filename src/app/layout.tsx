import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "bgear.dev — SVG backdrop API",
  description: "Free open source API for generating deterministic SVG backgrounds. Gradients, dots, geo shapes, topographic and more.",
  openGraph: {
    title: "bgear.dev — SVG backdrop API",
    description: "Free open source API for generating deterministic SVG backgrounds. Gradients, dots, geo shapes, topographic and more.",
    images: [{
      url: "/api/v1/gradient/bgear?w=1200&h=630",
      width: 1200,
      height: 630,
    }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased dark",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        figtree.variable
      )}
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-50 selection:bg-neutral-800">
        <header className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="font-bold text-xl tracking-tight text-white hover:opacity-80 transition-opacity cursor-pointer">
            bgear.dev
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white transition-colors p-2"
            aria-label="GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
          </a>
        </header>

        <main className="flex-1 w-full">
          {children}
        </main>

        <footer className="w-full px-6 py-8 text-center text-sm text-neutral-500 border-t border-neutral-900 bg-neutral-950">
          MIT License &middot; Open Source
        </footer>
      </body>
    </html>
  );
}
