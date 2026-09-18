"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { Link, useRouter } from "@/i18n/navigation";
import { getOrigenStyle } from "@/lib/origen-styles";
import { useColeccion } from "@/components/auth/ColeccionProvider";

export interface PersonajeLibroItem {
  id: string;
  slug: string;
  nombre: string;
  nombreKichwa?: string | null | undefined;
  origen?: string | null;
  imagenPortada?: string | null;
  /** Frase corta (leyenda) que aparece cuando el personaje está al frente. */
  frase?: string | null | undefined;
}

interface PersonajesLibroProps {
  personajes: PersonajeLibroItem[];
  /** ms entre avances automáticos; 0 desactiva el autoplay. */
  autoAdvanceMs?: number;
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const AUTO_MS_DEFAULT = 4200;
const SPINE_MIN = 44;

/**
 * "Estantería de los seres": los 6 personajes como lomos de libro en una sola
 * fila horizontal — colapsados solo muestran el nombre en vertical
 * (`writing-mode: vertical-rl`, sin JS ni recortes); el lomo activo se
 * "abre" ensanchándose y revela la portada + una frase + el CTA. Usado en
 * las 3 secciones donde se lista a los 6 juntos (/personajes, cross-sell al
 * pie de la ficha, /mis-personajes). El ancho se anima con una sola
 * transición CSS de `flex-grow` (nada de layout/height:auto de
 * framer-motion) para que las 6 columnas se muevan sincronizadas y sin
 * saltos; el contenido interno aparece con un pequeño delay para que el
 * "libro" termine de abrirse antes de mostrar el texto. Avanza solo cada
 * `autoAdvanceMs` — pausa con cualquier interacción y respeta
 * prefers-reduced-motion. El estado de bloqueo se resuelve aquí mismo vía
 * `useColeccion()`, igual en las 3 secciones.
 */
export function PersonajesLibro({ personajes, autoAdvanceMs = AUTO_MS_DEFAULT }: PersonajesLibroProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const router = useRouter();
  const { coleccion, ready, gatingActive } = useColeccion();

  useEffect(() => {
    if (reduced || paused || autoAdvanceMs <= 0 || personajes.length < 2) return;
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % personajes.length);
    }, autoAdvanceMs);
    return () => clearInterval(id);
  }, [reduced, paused, autoAdvanceMs, personajes.length]);

  if (personajes.length === 0) return null;

  function isLocked(slug: string) {
    return gatingActive && ready && !coleccion.has(slug);
  }

  function handleActivate(i: number) {
    const p = personajes[i];
    if (!p) return;
    if (i === activeIdx) {
      router.push(
        isLocked(p.slug)
          ? { pathname: "/desbloquear/[slug]", params: { slug: p.slug } }
          : { pathname: "/personajes/[slug]", params: { slug: p.slug } },
      );
    } else {
      setActiveIdx(i);
    }
  }

  const widthMs = reduced ? 0 : 600;
  const contentMs = reduced ? 0 : 380;

  return (
    <div
      className="flex h-72 w-full gap-1.5 overflow-hidden rounded-2xl border border-borde-sutil sm:h-96 sm:gap-2"
      onMouseLeave={() => setPaused(false)}
    >
      {personajes.map((p, i) => {
        const isActive = i === activeIdx;
        const locked = isLocked(p.slug);
        const style = getOrigenStyle(p.origen ?? undefined);

        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            aria-current={isActive}
            aria-label={p.nombre}
            onClick={() => handleActivate(i)}
            onMouseEnter={() => {
              setPaused(true);
              setActiveIdx(i);
            }}
            onFocus={() => {
              setPaused(true);
              setActiveIdx(i);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleActivate(i);
              }
            }}
            className="group relative cursor-pointer overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-oscuro"
            style={{
              flexGrow: isActive ? 20 : 1,
              flexShrink: 0,
              flexBasis: 0,
              minWidth: isActive ? 110 : SPINE_MIN,
              transition: `flex-grow ${widthMs}ms ${EASE}, min-width ${widthMs}ms ${EASE}`,
              background: `linear-gradient(180deg, ${style.bgFrom}, ${style.bgVia})`,
            }}
          >
            {/* Portada — solo visible cuando está activo */}
            <div
              className="absolute inset-0"
              style={{
                opacity: isActive ? 1 : 0,
                transition: `opacity ${contentMs}ms ease-out`,
                transitionDelay: isActive ? "140ms" : "0ms",
              }}
            >
              {p.imagenPortada && (
                <Image
                  src={p.imagenPortada}
                  alt={p.nombre}
                  fill
                  className={`object-cover object-top ${locked ? "opacity-50 grayscale" : ""}`}
                  sizes="(max-width: 640px) 60vw, 420px"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/25 to-transparent" />
            </div>

            {/* Lomo — nombre en vertical, visible cuando NO está activo */}
            <div
              className="absolute inset-0 flex items-center justify-center px-1"
              style={{
                opacity: isActive ? 0 : 1,
                transition: `opacity ${contentMs}ms ease-out`,
              }}
            >
              <span
                className="whitespace-nowrap font-display text-sm tracking-[0.15em] text-white/85 sm:text-base"
                style={{ writingMode: "vertical-rl" }}
              >
                {p.nombre}
              </span>
              {locked && (
                <span
                  className="absolute bottom-3 h-1.5 w-1.5 rounded-full bg-acento-dorado"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Contenido expandido */}
            <div
              className="absolute inset-x-0 bottom-0 p-4 sm:p-6"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? "translateY(0)" : "translateY(10px)",
                transition: `opacity ${contentMs}ms ease-out, transform ${contentMs}ms ease-out`,
                transitionDelay: isActive ? "180ms" : "0ms",
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              {p.nombreKichwa && p.nombreKichwa !== p.nombre && (
                <p className="truncate font-serif text-xs italic sm:text-sm" style={{ color: style.accentColor }}>
                  {p.nombreKichwa}
                </p>
              )}
              <h3 className="font-display text-xl leading-tight text-texto-claro sm:text-3xl">{p.nombre}</h3>
              {locked ? (
                <p className="mt-1 text-[11px] uppercase tracking-wider text-stone-400 sm:text-xs">Bloqueado</p>
              ) : (
                p.frase && (
                  <p className="mt-2 hidden max-w-[22rem] font-serif text-sm italic leading-snug text-stone-300 sm:block sm:text-base">
                    &ldquo;{p.frase}&rdquo;
                  </p>
                )
              )}
              <Link
                href={
                  locked
                    ? { pathname: "/desbloquear/[slug]", params: { slug: p.slug } }
                    : { pathname: "/personajes/[slug]", params: { slug: p.slug } }
                }
                onClick={(e) => e.stopPropagation()}
                className={`mt-3 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors sm:mt-4 ${
                  locked
                    ? "border-acento-dorado/60 bg-stone-950/70 text-acento-dorado hover:bg-acento-dorado hover:text-fondo-oscuro"
                    : "border-white/25 bg-stone-950/60 text-white hover:bg-white/15"
                }`}
              >
                {locked ? "Desbloquear" : "Ver ficha"}
                {!locked && (
                  <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </Link>
            </div>

            {/* Filo acento — marca cuál está al frente */}
            <span
              className="absolute inset-x-0 bottom-0 h-[3px]"
              style={{
                backgroundColor: style.accentColor,
                opacity: isActive ? 1 : 0,
                transition: `opacity ${contentMs}ms ease-out`,
              }}
              aria-hidden="true"
            />
          </div>
        );
      })}
    </div>
  );
}
