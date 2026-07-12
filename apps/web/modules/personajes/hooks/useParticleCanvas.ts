"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

type ParticleMode = "drift" | "orbit";

interface UseParticleCanvasOptions {
  count: number;
  /** Color base en hex #RRGGBB — el alpha lo modula cada partícula. */
  color: string;
  mode: ParticleMode;
  enabled?: boolean;
}

interface Particula {
  x: number; // drift: posición normalizada 0..1 | orbit: sin uso
  y: number;
  angle: number; // orbit: ángulo actual (rad)
  radius: number; // orbit: radio normalizado 0..1 respecto al semieje menor
  size: number; // px CSS
  speed: number;
  phase: number; // desfase del parpadeo
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Sistema de partículas en canvas nativo (sin librerías) para los momentos
 * rituales de la ficha: puntos de luz en el hero ("drift") y polvo dorado
 * orbitando el secreto del artesano ("orbit"). `converge()` acelera las
 * partículas hacia el centro (el instante del desbloqueo del secreto).
 * Respeta prefers-reduced-motion (no dibuja nada) y limpia rAF/observers.
 */
export function useParticleCanvas({ count, color, mode, enabled = true }: UseParticleCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particula[]>([]);
  const convergeRef = useRef<{ start: number; onDone?: (() => void) | undefined } | null>(null);
  const reduced = useReducedMotion();
  const active = enabled && !reduced;

  const converge = useCallback((onDone?: () => void) => {
    if (!active) {
      onDone?.();
      return;
    }
    convergeRef.current = { start: performance.now(), onDone };
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [r, g, b] = hexToRgb(color);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const sync = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);

    particlesRef.current = Array.from({ length: count }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      angle: (i / count) * Math.PI * 2,
      radius: 0.55 + Math.random() * 0.4,
      size: 1 + Math.random() * 2,
      speed: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
    }));

    const CONVERGE_MS = 400;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const conv = convergeRef.current;
      // 0 → 1 durante la convergencia; permanece en 1 al terminar
      const convP = conv ? Math.min((now - conv.start) / CONVERGE_MS, 1) : 0;

      for (const p of particlesRef.current) {
        let px: number;
        let py: number;

        if (mode === "drift") {
          // Puntos de luz que ascienden lento con vaivén lateral
          p.y -= p.speed * dt * 0.045;
          if (p.y < -0.05) p.y = 1.05;
          px = (p.x + Math.sin(now / 2600 + p.phase) * 0.015) * w;
          py = p.y * h;
        } else {
          // Polvo orbitando el centro; converge acelera el ángulo y cierra el radio
          p.angle += p.speed * dt * (0.6 + convP * 7);
          const radius = p.radius * (1 - convP) * Math.min(w, h) * 0.5 * 0.82;
          px = w / 2 + Math.cos(p.angle) * radius * 1.6; // elipse: más ancho que alto
          py = h / 2 + Math.sin(p.angle) * radius * 0.7;
        }

        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(now / 900 + p.phase));
        const alpha = mode === "orbit" ? twinkle * (0.5 + convP * 0.5) : twinkle * 0.8;
        const size = p.size * dpr * (1 + convP * 0.6);

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
        ctx.shadowBlur = 6 * dpr;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (conv && convP >= 1) {
        convergeRef.current = null;
        ctx.clearRect(0, 0, w, h);
        conv.onDone?.();
        return; // la convergencia es el final del sistema
      }
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [active, color, count, mode]);

  return { canvasRef, converge, active };
}
