"use client";

import { Menu, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 backdrop-blur-xl bg-black/40"
      style={{
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="relative">
              <Sparkles className="w-6 h-6 text-[#4A8FFF]" />
              <motion.div
                className="absolute inset-0 bg-[#4A8FFF]/20 rounded-full blur-lg"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text-precision">
                Precision + Personality Lab
              </h1>
              <p className="text-xs text-gray-400">GenAI Parameter Explorer</p>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-4">
          <motion.div
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
            whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-gray-300">System Active</span>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
