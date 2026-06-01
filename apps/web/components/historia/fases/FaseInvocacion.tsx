"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import type { TipoOrigen } from "@seres-del-pase/types";
import { getOrigenStyle } from "@/lib/origen-styles";

interface FaseInvocacionProps {
  origen?: TipoOrigen | undefined;
  onComplete: () => void;
}

function SimboloChakana({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="w-full h-full">
      <path
        d="M40,0 L80,0 L80,40 L120,40 L120,80 L80,80 L80,120 L40,120 L40,80 L0,80 L0,40 L40,40 Z"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <rect x="46" y="46" width="28" height="28" stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="60" cy="60" r="4" fill={color} fillOpacity="0.7" />
    </svg>
  );
}

function SimboloEspiral({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="w-full h-full">
      <circle cx="60" cy="60" r="52" stroke={color} strokeWidth="1.5" />
      <circle cx="60" cy="60" r="37" stroke={color} strokeWidth="1.5" />
      <circle cx="60" cy="60" r="22" stroke={color} strokeWidth="1.5" />
      <circle cx="60" cy="60" r="7" stroke={color} strokeWidth="1.5" />
      <circle cx="60" cy="60" r="3" fill={color} fillOpacity="0.8" />
      <line x1="60" y1="8" x2="60" y2="112" stroke={color} strokeWidth="0.6" strokeDasharray="3 5" />
      <line x1="8" y1="60" x2="112" y2="60" stroke={color} strokeWidth="0.6" strokeDasharray="3 5" />
    </svg>
  );
}

function SimboloRombo({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="w-full h-full">
      <polygon points="60,4 116,60 60,116 4,60" stroke={color} strokeWidth="2" fill="none" />
      <polygon points="60,24 96,60 60,96 24,60" stroke={color} strokeWidth="1.5" fill="none" />
      <polygon points="60,44 76,60 60,76 44,60" fill={color} fillOpacity="0.35" />
      <line x1="4" y1="60" x2="116" y2="60" stroke={color} strokeWidth="0.5" strokeDasharray="2 4" />
      <line x1="60" y1="4" x2="60" y2="116" stroke={color} strokeWidth="0.5" strokeDasharray="2 4" />
    </svg>
  );
}

export function FaseInvocacion({ origen, onComplete }: FaseInvocacionProps) {
  const style = getOrigenStyle(origen);

  useEffect(() => {
    const timer = setTimeout(onComplete, 3800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const Simbolo =
    style.patternId === "chakana"
      ? SimboloChakana
      : style.patternId === "espiral"
        ? SimboloEspiral
        : SimboloRombo;

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Grain de cine */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <filter id="grain-inv">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-inv)" opacity="0.07" />
      </svg>

      {/* Glow de fondo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${style.bgFrom}55 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* Símbolo central */}
      <motion.div
        className="relative"
        style={{ width: "min(55vw, 55vh)", height: "min(55vw, 55vh)" }}
        initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 1.4, ease: [0.215, 0.61, 0.355, 1], delay: 0.3 }}
      >
        {/* Glow detrás del símbolo */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${style.accentColor}30 0%, transparent 70%)`,
            filter: "blur(20px)",
          }}
          aria-hidden="true"
        />

        {/* Pulso outer */}
        <motion.div
          className="absolute inset-0 rounded-full border pointer-events-none"
          style={{ borderColor: `${style.accentColor}25` }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />

        {/* Símbolo con color del origen */}
        <motion.div
          className="absolute inset-0 animate-spin-slow"
          style={{ color: style.accentColor }}
        >
          <Simbolo color={style.accentColor} />
        </motion.div>

        {/* Inner glyph estático */}
        <motion.div
          className="absolute inset-0"
          style={{ color: style.accentColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
            <rect x="56" y="20" width="8" height="80" rx="1" fill={style.accentColor} fillOpacity="0.5" />
            <rect x="20" y="56" width="80" height="8" rx="1" fill={style.accentColor} fillOpacity="0.5" />
            <rect x="50" y="50" width="20" height="20" rx="2" fill={style.accentColor} fillOpacity="0.25" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Línea de progreso inferior */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{ backgroundColor: style.accentColor, opacity: 0.5 }}
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 3.8, ease: "linear" }}
        aria-hidden="true"
      />
    </motion.div>
  );
}
