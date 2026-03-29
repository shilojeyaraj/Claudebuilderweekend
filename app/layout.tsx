import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parliament Watch — Canadian Bill Tracker",
  description:
    "A nonpartisan window into what Parliament is doing right now — explained in plain language by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🍁</span>
            <a href="/" className="font-bold text-lg tracking-tight hover:text-red-700 transition-colors">
              Parliament Watch
            </a>
            <span className="text-gray-400 text-sm ml-auto">
              45th Parliament · Session 1 · Live data
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-white mt-12">
          <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-gray-500 flex flex-col sm:flex-row gap-2 justify-between">
            <span>Data sourced from the official Parliament of Canada LEGISinfo API.</span>
            <span>AI summaries are for informational purposes only — not legal advice.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
