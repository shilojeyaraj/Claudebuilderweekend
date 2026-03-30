"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { InterestsProvider } from "@/components/InterestsProvider";
import { InterestsButton } from "@/components/InterestsButton";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/bills/trending", label: "Trending Bills" },
  { href: "/mp", label: "Find Your MP" },
  { href: "/bills/house", label: "House Bills" },
  { href: "/bills/senate", label: "Senate Bills" },
];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <InterestsProvider>
      <ClientLayoutInner>{children}</ClientLayoutInner>
    </InterestsProvider>
  );
}

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="ui-app-frame flex flex-col min-h-screen">
      <header className="ui-header sticky top-0 z-30 flex flex-row items-center px-3 sm:px-4 py-2.5 sm:py-3 gap-2 sm:gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="ui-menu-toggle flex-shrink-0"
          aria-label="Toggle sidebar"
          aria-expanded={isSidebarOpen}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="flex flex-1 flex-col gap-2 min-w-0 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center min-w-0 gap-1">
            <Image
              src="/logo.png"
              alt=""
              width={112}
              height={112}
              className="object-contain w-24 h-24 sm:w-28 sm:h-28 -mr-6 sm:-mr-8 shrink-0"
            />
            <Link
              href="/"
              className="font-bold text-base sm:text-lg tracking-tight hover:opacity-90 transition-opacity truncate relative z-10"
              style={{ fontFamily: "var(--font-display-stack)" }}
            >
              Parliament Watch
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 sm:ml-auto w-full sm:w-auto min-w-0">
            <InterestsButton />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {isSidebarOpen && (
          <div
            className="absolute inset-0 bg-black/25 z-10 md:hidden"
            aria-hidden
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            ui-sidebar absolute md:static inset-y-0 left-0 z-20 
            transition-all duration-300 ease-in-out
            overflow-hidden flex flex-col
            ${isSidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:border-none"}
          `}
        >
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className="ui-nav-link"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <InterestsButton
                  variant="sidebar"
                  onOpen={() => setIsSidebarOpen(false)}
                />
              </li>
            </ul>
          </nav>
          <div className="p-4 border-t border-[var(--ui-sidebar-border)] ui-legal">
            <p>Data sourced from LEGISinfo API.</p>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto flex flex-col">
          {children}

          <footer className="ui-footer mt-auto">
            <div className="max-w-5xl mx-auto px-4 py-6 ui-legal flex flex-col sm:flex-row gap-4 justify-between">
              <span>
                Data sourced from the official Parliament of Canada LEGISinfo API.
              </span>
              <span>
                AI summaries are for informational purposes only — not legal advice.
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
