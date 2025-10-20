"use client";

import { Menu, Sparkles, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/auth-context";

interface HeaderProps {
  onMenuClick: () => void;
}

/**
 * 🧩 Header Visual Fix – V1.3.9
 * Restores correct vertical padding and optical balance without affecting layout height.
 * Adjustments:
 *  - Increased internal padding (py-3 → 48px content height)
 *  - Reduced header height to auto-fit content (min-h-[64px])
 *  - Ensured text never clips inside blur backdrop
 */

export function Header({ onMenuClick }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-50
        min-h-[64px]
        border-b border-white/10
        backdrop-blur-xl bg-black/40
        shadow-[0_4px_30px_rgba(0,0,0,0.1)]
        flex items-center
        px-6 py-3
      "
    >
      {/* Left: Menu + Brand */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex items-center gap-4"
      >
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
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#4A8FFF]" />
            <motion.div
              className="absolute inset-0 bg-[#4A8FFF]/20 rounded-full blur-lg"
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
          <div className="leading-tight">
            <h1 className="text-xl font-bold gradient-text-precision">
              Precision + Personality Lab
            </h1>
            <p className="text-xs text-gray-400">
              GenAI Parameter Explorer
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Right: User Status */}
      <div className="ml-auto flex items-center gap-3">
        {user && (
          <>
            <motion.div
              className="
                hidden md:flex items-center gap-2
                px-4 py-2 rounded-lg
                bg-white/5 border border-white/10
              "
              whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              transition={{ duration: 0.2 }}
            >
              <User className="w-4 h-4 text-[#4A8FFF]" />
              <span className="text-sm text-gray-300">{user.email}</span>
            </motion.div>

            <motion.button
              onClick={signOut}
              className="
                flex items-center gap-2 px-4 py-2 rounded-lg
                bg-white/5 border border-white/10
                hover:bg-white/10 hover:border-[#FF7E47]/50
                text-sm text-gray-300 hover:text-white
                transition-all
              "
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </motion.button>
          </>
        )}
      </div>
    </header>
  );
}
