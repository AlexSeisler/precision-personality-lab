import dynamic from "next/dynamic";

// ✅ Core motion wrappers
export const MotionDiv = dynamic(() => import("framer-motion").then(m => m.motion.div), { ssr: false });
export const MotionSpan = dynamic(() => import("framer-motion").then(m => m.motion.span), { ssr: false });
export const MotionSection = dynamic(() => import("framer-motion").then(m => m.motion.section), { ssr: false });
export const MotionButton = dynamic(() => import("framer-motion").then(m => m.motion.button), { ssr: false });
export const MotionTr = dynamic(() => import("framer-motion").then(m => m.motion.tr), { ssr: false });

// ✅ Optional extras for text areas & lists (used in prompt-input, export-modal, etc.)
export const MotionTextArea = dynamic(() => import("framer-motion").then(m => m.motion.textarea), { ssr: false });
export const MotionLi = dynamic(() => import("framer-motion").then(m => m.motion.li), { ssr: false });

// ✅ You can safely add more as needed (e.g. MotionUl, MotionImg, MotionNav)
// Each one will be dynamically loaded client-side, never during SSR.
