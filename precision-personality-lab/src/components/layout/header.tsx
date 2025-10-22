"use client";

import { Menu, Sparkles, LogOut, User, Archive, FlaskConical } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useUIStore } from "@/store/ui-store";
import { useCalibrationStore } from "@/store/calibration-store";
import { useExperimentStore } from "@/store/experiment-store";
import { supabase } from "@/lib/supabase/client";

// ✅ Lazy motion import
import { MotionDiv, MotionButton, MotionSpan } from "@/lib/lazy-motion";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { isRealtimeConnected, lastSyncTime } = useUIStore();

  const clearUI = useUIStore((s) => s.reset);
  const clearCalibration = useCalibrationStore((s) => s.reset);
  const clearExperiment = useExperimentStore((s) => s.reset);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      clearUI?.();
      clearCalibration?.();
      clearExperiment?.();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const formatSyncTime = (time: number | null) => {
    if (!time) return "Never";
    const diff = Date.now() - time;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const isDashboard = pathname === "/dashboard";
  const isExperiment = pathname === "/experiment";

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
      <MotionDiv
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

        <MotionDiv
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#4A8FFF]" />
            <MotionDiv
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
            <p className="text-xs text-gray-400">GenAI Parameter Explorer</p>
          </div>
        </MotionDiv>
      </MotionDiv>

      {/* Center: Navigation */}
      {user && (
        <nav className="hidden md:flex items-center gap-2 ml-8">
          <Link
            href="/dashboard"
            prefetch
            aria-label="Go to Dashboard"
            aria-current={isDashboard ? "page" : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              isDashboard
                ? "bg-[#4A8FFF]/20 border border-[#4A8FFF]/50 text-[#4A8FFF]"
                : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Archive className="w-4 h-4" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>


            
          {(isDashboard || !isExperiment) && (
            <button
              
              onClick={() => router.push("/experiment")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                isExperiment
                  ? "bg-[#FF7E47]/20 border border-[#FF7E47]/50 text-[#FF7E47]"
                  : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Experiment Studio</span>
            </button>
          )}
        </nav>
      )}

      {/* Right: Status & User */}
      <div className="ml-auto flex items-center gap-3">
        {user && (
          <>
            {/* Connection Status */}
            <MotionDiv
              className="hidden lg:flex flex-col items-end gap-0.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2">
                <MotionSpan
                  className={`text-xs font-medium ${
                    isRealtimeConnected ? "text-green-400" : "text-red-400"
                  }`}
                  animate={{
                    scale: isRealtimeConnected ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 2,
                    repeat: isRealtimeConnected ? Infinity : 0,
                  }}
                >
                  ●
                </MotionSpan>
                <span className="text-xs font-medium text-gray-300">
                  {isRealtimeConnected ? "Live" : "Offline"}
                </span>
              </div>
              <p className="text-[10px] text-gray-500">
                Last sync: {formatSyncTime(lastSyncTime)}
              </p>
            </MotionDiv>

            {/* User Email */}
            <MotionDiv
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
              whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              transition={{ duration: 0.2 }}
            >
              <User className="w-4 h-4 text-[#4A8FFF]" />
              <span className="text-sm text-gray-300">{user.email}</span>
            </MotionDiv>

            {/* Sign Out Button */}
            <MotionButton
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#FF7E47]/50 text-sm text-gray-300 hover:text-white transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </MotionButton>
          </>
        )}
      </div>
    </header>
  );
}
