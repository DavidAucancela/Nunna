"use client";

import { useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { MouseEvent } from "react";

/**
 * Tilt 3D suave calculado con la posición del mouse relativa al elemento.
 * Devuelve estilos (rotateX/rotateY con spring) y handlers para un
 * motion.div con transformPerspective. Inerte con prefers-reduced-motion.
 */
export function useTilt3D(maxDeg = 7) {
  const reduced = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 220, damping: 24, mass: 0.5 });
  const sy = useSpring(py, { stiffness: 220, damping: 24, mass: 0.5 });

  const rotateX = useTransform(sy, [0, 1], reduced ? [0, 0] : [maxDeg, -maxDeg]);
  const rotateY = useTransform(sx, [0, 1], reduced ? [0, 0] : [-maxDeg, maxDeg]);

  function onMouseMove(e: MouseEvent<HTMLElement>) {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function onMouseLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return { rotateX, rotateY, onMouseMove, onMouseLeave };
}
