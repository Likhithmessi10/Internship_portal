import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FillCraft | Professional Template Filling",
  description: "Mark, fill and export templates with precision.",
};

import ThemeToggle from "@/components/ThemeToggle";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const theme = localStorage.getItem('theme') || 'dark';
              document.documentElement.setAttribute('data-theme', theme);
            })()
          `
        }} />
      </head>
      <body className={`${outfit.variable}`}>
        <nav className="glass" style={{
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }} className="gradient-text">FillCraft</h2>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a href="/" style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>Dashboard</a>
            <a href="/admin/upload" style={{ color: 'var(--foreground)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>Upload New</a>
            <ThemeToggle />
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
