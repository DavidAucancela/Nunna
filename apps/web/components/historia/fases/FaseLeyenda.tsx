"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { TipoOrigen } from "@seres-del-pase/types";
import { getOrigenStyle } from "@/lib/origen-styles";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";

interface FaseLeyendaProps {
  leyenda: string;
  nombre: string;
  nombreKichwa?: string | undefined;
  origen?: TipoOrigen | undefined;
  imagenPortada?: string | undefined;
  imagenBanner?: string | undefined;
  onComplete: () => void;
}

export function FaseLeyenda({
  leyenda,
  nombre,
  nombreKichwa,
  origen,
  imagenPortada,
  imagenBanner,
  onComplete,
}: FaseLeyendaProps) {
  const style = getOrigenStyle(origen);
  const [displayedWords, setDisplayedWords] = useState(0);
  const words = leyenda.split(" ");

  useEffect(() => {
    // Typewriter word by word
    const interval = setInterval(() => {
      setDisplayedWords((prev) => {
        if (prev >= words.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 140);
    return () => clearInterval(interval);
  }, [words.length]);

  useEffect(() => {
    if (displayedWords >= words.length) {
      const timer = setTimeout(onComplete, 1800);
      return () => clearTimeout(timer);
    }
  }, [displayedWords, words.length, onComplete]);

  const displayedText = words.slice(0, displayedWords).join(" ");

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-end justify-start overflow-hidden"
      style={{ backgroundColor: "#050403" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Grain */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <filter id="grain-ley">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-ley)" opacity="0.07" />
      </svg>

      {/* Imagen / Placeholder que emerge del blur */}
      <motion.div
        className="absolute inset-0"
        initial={{ filter: "blur(24px)", opacity: 0, scale: 1.08 }}
        animate={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
        aria-hidden="true"
      >
        {(imagenBanner ?? imagenPortada) ? (
          <Image
            src={(imagenBanner ?? imagenPortada)!}
            alt={nombre}
            fill
            className="object-cover object-center"
            priority
          />
        ) : (
          <OrigenPlaceholder
            origen={origen}
            nombre={nombreKichwa ?? nombre}
            className="w-full h-full"
            variant="hero"
            uid="leyenda"
          />
        )}
      </motion.div>

      {/* Overlay degradado para legibilidad del texto */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(5,4,3,0.92) 0%, rgba(5,4,3,0.6) 45%, rgba(5,4,3,0.15) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Texto de la leyenda */}
      <div className="relative z-10 w-full px-6 pb-16 sm:pb-20 sm:px-10 max-w-2xl">
        <motion.p
          className="font-serif font-light leading-snug text-texto-claro"
          style={{
            fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
            minHeight: "3em",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <span aria-live="polite">{displayedText}</span>
          {displayedWords < words.length && (
            <motion.span
              className="inline-block w-[3px] h-[1.1em] ml-1 align-middle rounded-sm"
              style={{ backgroundColor: style.accentColor }}
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              aria-hidden="true"
            />
          )}
        </motion.p>
      </div>

      {/* Barra de progreso */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px]"
        style={{ backgroundColor: style.accentColor, opacity: 0.45 }}
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: words.length * 0.14 + 1.8, ease: "linear" }}
        aria-hidden="true"
      />
    </motion.div>
  );
}
