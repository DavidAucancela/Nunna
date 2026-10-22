"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "framer-motion";

// Instancia activa (una por página) — para quien necesite mover o frenar el scroll
// sin pelearse con la animación de Lenis (p. ej. lib/scroll-por-pasos.ts).
let lenisActual: Lenis | null = null;
export function getLenis(): Lenis | null {
  return lenisActual;
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });
    lenisActual = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      if (lenisActual === lenis) lenisActual = null;
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}
