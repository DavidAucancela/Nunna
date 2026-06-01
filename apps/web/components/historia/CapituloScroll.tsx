"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import type { TipoOrigen } from "@seres-del-pase/types";
import { getOrigenStyle } from "@/lib/origen-styles";

interface CapituloScrollProps {
  numero: number;
  titulo: string;
  texto: string;
  origen?: TipoOrigen | undefined;
}

export function CapituloScroll({ numero, titulo, texto, origen }: CapituloScrollProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const style = getOrigenStyle(origen);

  const numeroStr = String(numero).padStart(2, "0");

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

      {/* Número de capítulo — fondo gigante */}
      <motion.p
        className="absolute right-4 top-1/2 -translate-y-1/2 font-serif font-bold leading-none select-none pointer-events-none"
        style={{
          fontSize: "clamp(8rem, 35vw, 22rem)",
          color: style.accentColor,
          opacity: 0,
        }}
        animate={inView ? { opacity: 0.06 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        aria-hidden="true"
      >
        {numeroStr}
      </motion.p>

      {/* Contenido */}
      <div className="relative z-10 max-w-lg">
        {/* Número pequeño */}
        <motion.span
          className="block text-[10px] uppercase tracking-[0.35em] mb-5"
          style={{ color: style.accentColor }}
          initial={{ opacity: 0, x: -10 }}
          animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {numeroStr}
        </motion.span>

        {/* Título */}
        <motion.h2
          className="font-serif font-bold text-texto-claro leading-tight mb-6"
          style={{ fontSize: "clamp(1.6rem, 6vw, 3rem)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.65, delay: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
        >
          {titulo}
        </motion.h2>

        {/* Separador */}
        <motion.div
          className="h-px mb-6"
          style={{ backgroundColor: style.accentColor }}
          initial={{ scaleX: 0, originX: 0 }}
          animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          aria-hidden="true"
        />

        {/* Texto */}
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
    </section>
  );
}
