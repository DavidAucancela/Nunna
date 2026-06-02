"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import type { TipoOrigen } from "@seres-del-pase/types";
import { getOrigenStyle } from "@/lib/origen-styles";

interface CapituloScrollProps {
  numero: number;
  titulo: string;
  texto: string;
  origen?: TipoOrigen | undefined;
  onInView?: (numero: number) => void;
}

function WatermarkChakana({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="w-full h-full">
      <path d="M40,0 L80,0 L80,40 L120,40 L120,80 L80,80 L80,120 L40,120 L40,80 L0,80 L0,40 L40,40 Z"
        stroke={color} strokeWidth="2" fill="none" />
      <rect x="46" y="46" width="28" height="28" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function WatermarkEspiral({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="w-full h-full">
      <circle cx="60" cy="60" r="52" stroke={color} strokeWidth="1.5" />
      <circle cx="60" cy="60" r="37" stroke={color} strokeWidth="1.5" />
      <circle cx="60" cy="60" r="22" stroke={color} strokeWidth="1.5" />
      <circle cx="60" cy="60" r="7" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function WatermarkRombo({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="w-full h-full">
      <polygon points="60,4 116,60 60,116 4,60" stroke={color} strokeWidth="2" fill="none" />
      <polygon points="60,24 96,60 60,96 24,60" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

const WATERMARK_POSITIONS = [
  { top: "-5%", right: "-10%" },
  { bottom: "-5%", left: "-10%" },
  { top: "20%", left: "30%" },
];

export function CapituloScroll({ numero, titulo, texto, origen, onInView }: CapituloScrollProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const [mostrarScroll, setMostrarScroll] = useState(true);
  const style = getOrigenStyle(origen);
  const numeroStr = String(numero).padStart(2, "0");

  const Watermark =
    style.patternId === "chakana" ? WatermarkChakana
    : style.patternId === "espiral" ? WatermarkEspiral
    : WatermarkRombo;

  const posicion = WATERMARK_POSITIONS[(numero - 1) % WATERMARK_POSITIONS.length];

  if (inView && onInView) {
    onInView(numero);
  }

  return (
    <section
      ref={ref}
      className="relative min-h-svh flex flex-col justify-center px-6 py-20 sm:px-10 sm:py-28"
      style={{
        background: `linear-gradient(180deg, #050403 0%, ${style.bgVia}88 50%, ${style.bgFrom}44 100%)`,
      }}
    >
      {/* Grain */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <filter id={`grain-cap-${numero}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-cap-${numero})`} opacity="0.06" />
      </svg>

      {/* Watermark del símbolo de origen */}
      <motion.div
        className="absolute pointer-events-none select-none overflow-hidden"
        style={{ ...posicion, width: "60vw", height: "60vw", maxWidth: 400, maxHeight: 400, opacity: 0 }}
        animate={inView ? { opacity: 0.025 } : { opacity: 0 }}
        transition={{ duration: 1.2, delay: 0.2 }}
        aria-hidden="true"
      >
        <Watermark color={style.accentColor} />
      </motion.div>

      {/* Número de capítulo — fondo gigante */}
      <motion.p
        className="absolute right-4 top-1/2 -translate-y-1/2 font-serif font-bold leading-none select-none pointer-events-none"
        style={{ fontSize: "clamp(8rem, 35vw, 22rem)", color: style.accentColor, opacity: 0 }}
        animate={inView ? { opacity: 0.06 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        aria-hidden="true"
      >
        {numeroStr}
      </motion.p>

      {/* Contenido */}
      <div className="relative z-10 max-w-lg">
        <motion.span
          className="block text-[10px] uppercase tracking-[0.35em] mb-5"
          style={{ color: style.accentColor }}
          initial={{ opacity: 0, x: -10 }}
          animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {numeroStr}
        </motion.span>

        <motion.h2
          className="font-serif font-bold text-texto-claro leading-tight mb-6"
          style={{ fontSize: "clamp(1.6rem, 6vw, 3rem)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.65, delay: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
        >
          {titulo}
        </motion.h2>

        <motion.div
          className="h-px mb-6"
          style={{ backgroundColor: style.accentColor }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          aria-hidden="true"
        />

        <motion.p
          className="font-sans text-stone-300 leading-relaxed"
          style={{ fontSize: "clamp(1rem, 3.5vw, 1.2rem)" }}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.65, delay: 0.5, ease: "easeOut" }}
        >
          {texto}
        </motion.p>
      </div>

      {/* Indicador scroll — solo en el primer capítulo */}
      <AnimatePresence>
        {numero === 1 && mostrarScroll && (
          <motion.button
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            onClick={() => setMostrarScroll(false)}
            aria-label="Continuar"
          >
            <span
              className="text-[9px] uppercase tracking-[0.3em]"
              style={{ color: `${style.accentColor}70` }}
            >
              scroll
            </span>
            <motion.span
              style={{ color: style.accentColor, fontSize: "1.1rem" }}
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            >
              ↓
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  );
}
