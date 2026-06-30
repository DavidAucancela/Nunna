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
}

export function PersonajeCard({ personaje, unlocked = true, priority = false }: PersonajeCardProps) {
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !personaje.imagenPortada || imgError;
  const style = getOrigenStyle(personaje.origen);

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
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent transition-all duration-500 group-hover:via-stone-950/50" />

      {/* Badge origen */}
      <span
        className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-stone-950/70 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm"
        style={{ color: style.accentColor }}
      >
        {style.label}
      </span>

      {/* Badge sin foto */}
      {showPlaceholder && (
        <span className="absolute right-3 top-3 z-10 rounded-full border border-stone-700 bg-stone-950/80 px-2 py-0.5 text-[9px] uppercase tracking-widest text-stone-500 backdrop-blur-sm">
          foto pronto
        </span>
      )}

      {/* Contenido inferior */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        {personaje.nombreKichwa && (
          <p
            className="font-serif text-sm italic leading-tight"
            style={{ color: style.accentColor }}
          >
            {personaje.nombreKichwa}
          </p>
        )}
        <h3 className="mt-0.5 font-serif text-xl font-bold leading-tight text-white transition-colors group-hover:text-texto-claro">
          {personaje.nombre}
        </h3>
        {unlocked && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-300 opacity-0 transition-all duration-400 group-hover:opacity-100">
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
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-400 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 0 1px ${style.accentColor}30` }}
      />
    </>
  );

  if (!unlocked) {
    return (
      <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div
          className="group relative block aspect-[3/4] overflow-hidden rounded-2xl"
          style={{ boxShadow: `0 4px 24px -4px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)` }}
        >
          {cardContent}
          {/* Overlay de bloqueo */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-stone-950/70 backdrop-blur-[2px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-acento-dorado/40 bg-stone-950/80">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="text-acento-dorado" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <Link
              href="/desbloquear"
              onClick={(e) => e.stopPropagation()}
              className="rounded-full border border-acento-dorado/60 bg-stone-950/80 px-4 py-1.5 text-xs font-medium text-acento-dorado backdrop-blur-sm transition-colors hover:bg-acento-dorado hover:text-fondo-oscuro"
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
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Link
        href={{ pathname: "/personajes/[slug]", params: { slug: personaje.slug } }}
        onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
        className="group relative block aspect-[3/4] overflow-hidden rounded-2xl"
        style={{
          boxShadow: `0 4px 24px -4px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)`,
        }}
      >
        {cardContent}
      </Link>
    </motion.div>
  );
}
