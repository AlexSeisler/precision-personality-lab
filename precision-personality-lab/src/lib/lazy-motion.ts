// src/lib/lazy-motion.ts
import dynamic from "next/dynamic";

export const MotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false }
);

export const MotionSpan = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.span),
  { ssr: false }
);

export const MotionSection = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.section),
  { ssr: false }
);

export const MotionButton = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.button),
  { ssr: false }
);
