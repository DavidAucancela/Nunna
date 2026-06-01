"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import type { TipoOrigen } from "@seres-del-pase/types";
import { getOrigenStyle } from "@/lib/origen-styles";
import { StaggerLetters } from "@/components/ui/FadeUp";

interface FaseNombreProps {
  nombre: string;
  nombreKichwa?: string | undefined;
  origen?: TipoOrigen | undefined;
  onComplete: () => void;
}

export function FaseNombre({ nombre, nombreKichwa, origen, onComplete }: FaseNombreProps) {
  const style = getOrigenStyle(origen);

  useEffect(() => {
    const timer = setTimeout(onComplete, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#050403" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Grain */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <filter id="grain-nom">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-nom)" opacity="0.07" />
      </svg>

      {/* Glow de fondo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${style.bgFrom}44 0%, transparent 65%)`,
        }}
        aria-hidden="true"
      />

      {/* Nombre principal — wipe horizontal */}
      <div className="relative z-10 px-6 text-center overflow-hidden">
        <motion.div
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 1.1, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
        >
          <h1
            className="font-serif font-bold leading-none tracking-tight text-texto-claro"
            style={{ fontSize: "clamp(3.5rem, 14vw, 9rem)" }}
          >
            <StaggerLetters text={nombre} delay={0.3} />
          </h1>
        </motion.div>

        {/* Línea divisora */}
        <motion.div
          className="mx-auto mt-4 h-px"
          style={{ backgroundColor: style.accentColor }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
          aria-hidden="true"
        />

        {/* Nombre Kichwa */}
        {nombreKichwa && nombreKichwa !== nombre && (
          <motion.p
            className="mt-4 font-serif italic"
            style={{
              color: style.accentColor,
              fontSize: "clamp(1.1rem, 4vw, 2rem)",
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            {nombreKichwa}
          </motion.p>
        )}

        {/* Label de origen */}
        <motion.p
          className="mt-6 text-xs uppercase tracking-[0.3em]"
          style={{ color: `${style.accentColor}99` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.5 }}
        >
          {style.label}
        </motion.p>
      </div>

      {/* Barra de progreso */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{ backgroundColor: style.accentColor, opacity: 0.4 }}
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 3.5, ease: "linear" }}
        aria-hidden="true"
      />
    </motion.div>
  );
}
