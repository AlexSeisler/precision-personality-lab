"use client";

import { useState } from "react";
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
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calibration", label: "Calibration", icon: Sliders },
  { href: "/experiment", label: "Experiment", icon: Flask },
  { href: "/metrics", label: "Metrics", icon: BarChart3 },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

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
        className="fixed left-0 top-16 bottom-0 w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 z-40 lg:translate-x-0 lg:static"
        style={{
          boxShadow: "4px 0 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Navigation
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href} onClick={onClose}>
                  <motion.div
                    className={`
                      relative flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-colors cursor-pointer group
                      ${
                        isActive
                          ? "bg-[#4A8FFF]/20 text-[#4A8FFF] border border-[#4A8FFF]/30"
                          : "text-gray-300 hover:bg-white/5 hover:text-white border border-transparent"
                      }
                    `}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-[#4A8FFF]/10 to-[#FF7E47]/10 rounded-lg"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}

                    <Icon className="w-5 h-5 relative z-10" />
                    <span className="font-medium relative z-10">
                      {item.label}
                    </span>

                    <ChevronRight
                      className={`
                        w-4 h-4 ml-auto relative z-10
                        transition-opacity
                        ${
                          isActive
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-50"
                        }
                      `}
                    />
                  </motion.div>
                </Link>
              );
            })}
          </nav>

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
