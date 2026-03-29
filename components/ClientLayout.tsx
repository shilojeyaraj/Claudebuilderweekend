"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/bills/trending", label: "Trending Bills" },
  { href: "/mp", label: "Find Your MP" },
  { href: "/bills/house", label: "House Bills" },
  { href: "/bills/senate", label: "Senate Bills" },
];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 flex flex-row items-center px-4 py-3 gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors mr-2 focus:outline-none focus:ring-2 focus:ring-red-500 flex-shrink-0"
          aria-label="Toggle Sidebar"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center w-full max-w-5xl">
          <Image src="/logo.png" alt="Parliament Watch Logo" width={128} height={128} className="object-contain" />
          <Link href="/" className="font-bold text-lg tracking-tight hover:text-red-700 transition-colors truncate -ml-8 relative z-10">
            Parliament Watch
          </Link>
          <span className="text-gray-400 text-sm ml-auto hidden sm:inline-block truncate">
            45th Parliament · Live data
          </span>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar backdrop for mobile */}
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/20 z-10 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <aside 
          className={`
            absolute md:static inset-y-0 left-0 z-20 
            bg-white border-r border-gray-200 
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
                    className="block px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors font-medium"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
            <p>Data sourced from LEGISinfo API.</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
          
          <footer className="border-t border-gray-200 bg-white mt-12">
            <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-gray-500 flex flex-col sm:flex-row gap-4 justify-between">
              <span>Data sourced from the official Parliament of Canada LEGISinfo API.</span>
              <span>AI summaries are for informational purposes only — not legal advice.</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
