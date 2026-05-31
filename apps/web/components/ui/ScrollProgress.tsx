"use client";

import { motion, useScroll, useSpring } from "framer-motion";

interface ScrollProgressProps {
  /** Color de la barra — por defecto dorado. Pasar el accentColor del origen del personaje. */
  color?: string;
}

export function ScrollProgress({ color = "#C89B3C" }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX, backgroundColor: color }}
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] origin-left shadow-sm"
      aria-hidden="true"
    />
  );
}
