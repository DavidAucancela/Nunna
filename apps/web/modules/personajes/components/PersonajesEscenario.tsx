"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useRouter } from "@/i18n/navigation";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import { getOrigenStyle } from "@/lib/origen-styles";
import type { PersonajeListItem } from "@seres-del-pase/types";

interface PersonajesEscenarioProps {
  personajes: PersonajeListItem[];
}

/**
 * "Los Compañeros del Pase": el cross-sell como escenario teatral en 3D.
 * La tarjeta central está al frente (escala 1, sin giro); las laterales se
 * inclinan hacia ella en perspectiva (escala 0.85, rotateY ±15°), como
 * personajes esperando su turno en el pase. Hover (o tap en móvil) trae la
 * tarjeta al centro con transición 3D; la central muestra su leyenda como
 * texto de relación y el CTA. Con prefers-reduced-motion no hay giros.
 */
export function PersonajesEscenario({ personajes }: PersonajesEscenarioProps) {
  const [activeIdx, setActiveIdx] = useState(Math.floor((personajes.length - 1) / 2));
  const reduced = useReducedMotion();
  const router = useRouter();

  if (personajes.length === 0) return null;
  const activo = personajes[activeIdx];

  function handleClick(i: number) {
    const p = personajes[i];
    if (!p) return;
    if (i === activeIdx) {
      router.push({ pathname: "/personajes/[slug]", params: { slug: p.slug } });
    } else {
      setActiveIdx(i);
    }
  }

  return (
    <div>
      {/* ── Escenario curvo ── */}
      <div
        className="flex items-center justify-center gap-3 sm:gap-5"
        style={{ perspective: 1100 }}
      >
        {personajes.map((p, i) => {
          const style = getOrigenStyle(p.origen);
          const offset = i - activeIdx;
          const isActive = offset === 0;

          return (
            <motion.div
              key={p.id}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => handleClick(i)}
              onKeyDown={(e) => e.key === "Enter" && handleClick(i)}
              role="button"
              tabIndex={0}
              aria-label={p.nombre}
              animate={{
                rotateY: reduced ? 0 : offset * -15,
                scale: isActive ? 1 : 0.85,
                z: isActive ? 0 : -60,
                opacity: isActive ? 1 : 0.55,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              className="relative w-[38vw] max-w-[240px] cursor-pointer overflow-hidden rounded-2xl border border-borde-sutil sm:w-[240px]"
              style={{
                aspectRatio: "3 / 4.2",
                transformStyle: "preserve-3d",
                zIndex: isActive ? 10 : 10 - Math.abs(offset),
              }}
            >
              {p.imagenPortada ? (
                <Image
                  src={p.imagenPortada}
                  alt={p.nombre}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 40vw, 240px"
                />
              ) : (
                <OrigenPlaceholder
                  origen={p.origen}
                  nombre={p.nombre}
                  variant="card"
                  className="absolute inset-0"
                />
              )}

              {/* Luz de escenario: la central iluminada, las laterales en penumbra */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/25 to-transparent" />
              <motion.div
                aria-hidden="true"
                className="absolute inset-0"
                animate={{ opacity: isActive ? 0 : 0.45 }}
                transition={{ duration: 0.4 }}
                style={{ backgroundColor: "#0c0a09" }}
              />

              {/* Borde acento del personaje activo */}
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl"
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ boxShadow: `inset 0 0 0 1px ${style.accentColor}60` }}
              />

              {/* Nombre + origen al pie */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <span
                  className="mb-1.5 inline-block rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest"
                  style={{ color: style.accentColor, borderColor: `${style.accentColor}40` }}
                >
                  {style.label}
                </span>
                {p.nombreKichwa && p.nombreKichwa !== p.nombre && (
                  <p className="font-serif text-[11px] italic leading-none" style={{ color: style.accentColor }}>
                    {p.nombreKichwa}
                  </p>
                )}
                <p className="mt-0.5 font-serif text-lg font-bold leading-tight text-white sm:text-xl">
                  {p.nombre}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Texto de relación + CTA del personaje al frente ── */}
      <div className="mt-8 flex min-h-[7rem] flex-col items-center text-center">
        <AnimatePresence mode="wait">
          {activo && (
            <motion.div
              key={activo.id}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              {...(reduced ? {} : { exit: { opacity: 0, y: -8 } })}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              {activo.leyenda && (
                <p
                  className="max-w-md font-serif text-sm italic leading-snug sm:text-base"
                  style={{ color: getOrigenStyle(activo.origen).accentColor }}
                >
                  &ldquo;{activo.leyenda}&rdquo;
                </p>
              )}
              <Link
                href={{ pathname: "/personajes/[slug]", params: { slug: activo.slug } }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-stone-950/60 px-5 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/15"
              >
                Ver personaje
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
