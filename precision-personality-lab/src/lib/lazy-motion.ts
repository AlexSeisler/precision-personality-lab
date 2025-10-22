import dynamic from "next/dynamic";

export const MotionDiv = dynamic(() => import("framer-motion").then(m => m.motion.div), { ssr: false });
export const MotionSpan = dynamic(() => import("framer-motion").then(m => m.motion.span), { ssr: false });
export const MotionSection = dynamic(() => import("framer-motion").then(m => m.motion.section), { ssr: false });
export const MotionButton = dynamic(() => import("framer-motion").then(m => m.motion.button), { ssr: false });
export const MotionTr = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.tr),
  { ssr: false }
);
