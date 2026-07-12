"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import { getOrigenStyle } from "@/lib/origen-styles";
import type { PersonajeListItem } from "@seres-del-pase/types";

interface PersonajeCardProps {
  personaje: PersonajeListItem;
  unlocked?: boolean;
  priority?: boolean;
  /** Posición en la grilla — entrada escalonada (stagger) para dar dinamismo. */
  index?: number;
}

export function PersonajeCard({ personaje, unlocked = true, priority = false, index = 0 }: PersonajeCardProps) {
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !personaje.imagenPortada || imgError;
  const style = getOrigenStyle(personaje.origen);

  const entrance = {
    initial: { opacity: 0, y: 18, scale: 0.96 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.4, delay: Math.min(index, 4) * 0.06, ease: "easeOut" as const },
  };

  const cardContent = (
    <>
      {/* Fondo: imagen real o placeholder artístico */}
      {!showPlaceholder && personaje.imagenPortada ? (
        <Image
          src={personaje.imagenPortada}
          alt={personaje.nombre}
          fill
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 33vw, 25vw"
          onError={() => setImgError(true)}
        />
      ) : (
        <OrigenPlaceholder
          origen={personaje.origen}
          nombre={personaje.nombre}
          variant="card"
          className="absolute inset-0"
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/25 to-transparent transition-all duration-500 group-hover:via-stone-950/50" />

      {/* Badge origen */}
      <span
        className="absolute left-1.5 top-1.5 z-10 rounded-full border border-white/10 bg-stone-950/70 px-1.5 py-0.5 text-[9px] font-medium leading-none backdrop-blur-sm sm:left-3 sm:top-3 sm:px-2.5 sm:py-0.5 sm:text-xs"
        style={{ color: style.accentColor }}
      >
        {style.label}
      </span>

      {/* Badge sin foto */}
      {showPlaceholder && (
        <span className="absolute right-1.5 top-1.5 z-10 rounded-full border border-stone-700 bg-stone-950/80 px-1.5 py-0.5 text-[7px] uppercase tracking-widest text-stone-500 backdrop-blur-sm sm:right-3 sm:top-3 sm:px-2 sm:text-[9px]">
          foto pronto
        </span>
      )}

      {/* Contenido inferior */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-2 sm:p-4">
        {personaje.nombreKichwa && (
          <p
            className="hidden font-serif text-sm italic leading-tight sm:block"
            style={{ color: style.accentColor }}
          >
            {personaje.nombreKichwa}
          </p>
        )}
        <h3 className="mt-0.5 font-serif text-sm font-bold leading-tight text-white transition-colors group-hover:text-texto-claro sm:text-xl">
          {personaje.nombre}
        </h3>
        {unlocked && (
          <p className="mt-2 hidden line-clamp-2 text-sm leading-relaxed text-stone-300 opacity-0 transition-all duration-400 group-hover:opacity-100 sm:block">
            {personaje.resumen}
          </p>
        )}
      </div>

      {/* Franja de color */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundColor: style.accentColor }}
      />

      {/* Hover glow ring */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-400 group-hover:opacity-100 sm:rounded-2xl"
        style={{ boxShadow: `inset 0 0 0 1px ${style.accentColor}30` }}
      />
    </>
  );

  if (!unlocked) {
    return (
      <motion.div
        {...entrance}
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <div
          className="group relative block aspect-[3/4] overflow-hidden rounded-xl sm:rounded-2xl"
          style={{ boxShadow: `0 4px 24px -4px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)` }}
        >
          {cardContent}
          {/* Overlay de bloqueo */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-stone-950/70 backdrop-blur-[2px] sm:gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-acento-dorado/40 bg-stone-950/80 sm:h-12 sm:w-12">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-acento-dorado sm:hidden" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="hidden text-acento-dorado sm:block" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <Link
              href={{ pathname: "/desbloquear/[slug]", params: { slug: personaje.slug } }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-full border border-acento-dorado/60 bg-stone-950/80 px-2.5 py-1 text-[10px] font-medium text-acento-dorado backdrop-blur-sm transition-colors hover:bg-acento-dorado hover:text-fondo-oscuro sm:px-4 sm:py-1.5 sm:text-xs"
            >
              Desbloquear
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      {...entrance}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
    >
      <Link
        href={{ pathname: "/personajes/[slug]", params: { slug: personaje.slug } }}
        onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
        className="group relative block aspect-[3/4] overflow-hidden rounded-xl sm:rounded-2xl"
        style={{
          boxShadow: `0 4px 24px -4px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)`,
        }}
      >
        {cardContent}
      </Link>
    </motion.div>
  );
}
