"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import type { TipoOrigen } from "@seres-del-pase/types";
import { getOrigenStyle } from "@/lib/origen-styles";

interface FaseTransicionProps {
  origen?: TipoOrigen | undefined;
  onComplete: () => void;
}

function SimboloChakana({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="w-full h-full">
      <path d="M40,0 L80,0 L80,40 L120,40 L120,80 L80,80 L80,120 L40,120 L40,80 L0,80 L0,40 L40,40 Z"
        stroke={color} strokeWidth="2" fill="none" />
      <circle cx="60" cy="60" r="4" fill={color} fillOpacity="0.7" />
    </svg>
  );
}

function SimboloEspiral({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="w-full h-full">
      <circle cx="60" cy="60" r="45" stroke={color} strokeWidth="1.5" />
      <circle cx="60" cy="60" r="28" stroke={color} strokeWidth="1.5" />
      <circle cx="60" cy="60" r="8" stroke={color} strokeWidth="1.5" />
      <circle cx="60" cy="60" r="3" fill={color} fillOpacity="0.8" />
    </svg>
  );
}

function SimboloRombo({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="w-full h-full">
      <polygon points="60,4 116,60 60,116 4,60" stroke={color} strokeWidth="2" fill="none" />
      <polygon points="60,36 84,60 60,84 36,60" fill={color} fillOpacity="0.25" />
    </svg>
  );
}

export function FaseTransicion({ origen, onComplete }: FaseTransicionProps) {
  const style = getOrigenStyle(origen);

  useEffect(() => {
    const timer = setTimeout(onComplete, 700);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const Simbolo =
    style.patternId === "chakana" ? SimboloChakana
    : style.patternId === "espiral" ? SimboloEspiral
    : SimboloRombo;

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.7, times: [0, 0.2, 0.7, 1] }}
    >
      <motion.div
        style={{ width: 48, height: 48 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.55, 0], scale: [0.8, 1, 0.8] }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
        aria-hidden="true"
      >
        <Simbolo color={style.accentColor} />
      </motion.div>
    </motion.div>
  );
}
