"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Sliders,
  FlaskConical as Flask,
  BarChart3,
  X,
  ChevronRight,
  Archive,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavItem = {
  href: `/${string}`;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calibration", label: "Calibration", icon: Sliders },
  { href: "/experiment", label: "Experiment", icon: Flask },
  { href: "/dashboard", label: "Dashboard", icon: Archive },
  { href: "/metrics", label: "Metrics", icon: BarChart3 },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* ✅ Overlay - pointer events only when visible */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
            style={{ pointerEvents: isOpen ? "auto" : "none" }}
          />
        )}
      </AnimatePresence>

      {/* ✅ Sidebar container */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : "-100%",
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="fixed left-0 top-16 bottom-0 w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 z-50 shadow-[4px_0_30px_rgba(0,0,0,0.1)]"
        style={{ pointerEvents: "auto" }} // allow clicking inside
      >
        <div className="flex flex-col h-full p-4">
          {/* Header for mobile */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Navigation
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ✅ Nav Links */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={onClose}
                  aria-label={`Navigate to ${item.label}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <motion.div
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-[#4A8FFF]/20 to-[#FF7E47]/20 text-white border border-[#4A8FFF]/40 shadow-[0_0_20px_rgba(74,143,255,0.25)]"
                        : "text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                    }`}
                    style={{ cursor: "pointer", position: "relative" }}
                    whileHover={{ x: 4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    {/* ✅ Background animation layer (non-blocking) */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-[#4A8FFF]/10 to-[#FF7E47]/10 rounded-lg"
                        style={{ pointerEvents: "none" }} // ensure it never blocks clicks
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Icon + Label */}
                    <Icon className="w-5 h-5 relative z-10" aria-hidden="true" />
                    <span className="font-medium relative z-10">
                      {item.label}
                    </span>

                    {/* Chevron on hover */}
                    <ChevronRight
                      className={`w-4 h-4 ml-auto relative z-10 transition-opacity ${
                        isActive
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-50"
                      }`}
                      aria-hidden="true"
                    />
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Footer Info */}
          <div className="pt-4 border-t border-white/10">
            <div className="p-4 rounded-lg bg-gradient-to-br from-[#4A8FFF]/10 to-[#FF7E47]/10 border border-[#4A8FFF]/20">
              <p className="text-xs text-gray-400 mb-1">Assessment Project</p>
              <p className="text-sm font-semibold gradient-text-precision">
                GenAI.Labs Technical
              </p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
