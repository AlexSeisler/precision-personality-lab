"use client";

import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { PageTransition } from "./page-transition";
import { ToastContainer } from "@/components/ui/toast";

interface AppShellProps {
  children: React.ReactNode;
}

// ⚠️ Layout Contract: Do not modify container structure
// Centering and overlay alignment tested at V1.2.1 baseline.

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

      {/* --- CORE LAYOUT FIX --- */}
      <div className="relative min-h-screen pt-16">
        {/* Sidebar isolated from layout flow */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Independent main container */}
        <main
          id="main-content"
          role="main"
          aria-label="Main content"
          className="relative flex flex-col items-center justify-start w-full min-h-[calc(100vh-4rem)]"
        >
          {/* True centering wrapper with page transitions */}
          <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 py-8 relative z-10">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
