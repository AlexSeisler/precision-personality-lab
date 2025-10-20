"use client";

import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { PageTransition } from "./page-transition";
import { ToastContainer } from "@/components/ui/toast";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * 🧩 Layout Finalized – v1.4.0
 * Final baseline alignment and spacing polish:
 * - Top spacing fully compensates for header blur and shadow
 * - Sidebar isolated from content flow
 * - Clean production-ready version
 */

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      {/* Accessibility skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#4A8FFF] focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Background gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Sidebar (kept isolated from layout flow) */}
      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <main
        id="main-content"
        role="main"
        aria-label="Main content"
        className="
          relative flex flex-col items-center justify-start
          w-full
          pt-[9rem] px-6 md:px-8 pb-12
          transition-all duration-300
        "
      >
        <div className="w-full max-w-[1280px] mx-auto relative z-10">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
