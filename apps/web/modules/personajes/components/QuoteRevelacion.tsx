"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useTranslations } from "next-intl";
import type { TipoOrigen } from "@seres-del-pase/types";

interface QuoteRevelacionProps {
  /** Gancho corto (~1 frase) — es lo único que se pinta grande al scroll. */
  hook: string;
  /** Resto del resumen — queda plegado bajo "Leer más" (siempre en el DOM, SEO). */
  resto?: string | undefined;
  accentColor: string;
  origen?: TipoOrigen | undefined;
  /** Slot para acciones bajo la cita (compartir, contador de colección). */
  children?: ReactNode;
}

const DIM = "#44403C"; // stone-700 — la palabra aún dormida
const BRIGHT = "#EFEAE0"; // texto-claro — la palabra revelada

/** Los tres mundos que el personaje conecta en la cosmovisión andina. */
const TRES_MUNDOS = [
  { nombre: "Uku Pacha", significado: "El mundo de adentro" },
  { nombre: "Kay Pacha", significado: "El mundo del aquí y ahora" },
  { nombre: "Hanan Pacha", significado: "El mundo de arriba" },
] as const;

/**
 * "La Voz del Espíritu": el resumen editorial no aparece de golpe — cada
 * palabra se pinta de oscuro a claro sincronizada con el progreso de scroll,
 * como si el personaje fuera diciéndola. La comilla decorativa despierta con
 * un glow del color de origen. Para personajes prehispánicos se muestra la
 * línea de los tres mundos (Uku / Kay / Hanan Pacha).
 */
export function QuoteRevelacion({ hook, resto, accentColor, origen, children }: QuoteRevelacionProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const t = useTranslations("historia");
  const [abierto, setAbierto] = useState(false);

  // Si el componente sobrevive una navegación entre personajes sin remount
  // (p.ej. reconciliación de React entre rutas hermanas), el "Leer más" no
  // debe quedar abierto mostrando el resumen plegado del personaje anterior.
  useEffect(() => {
    setAbierto(false);
  }, [resto]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.5"],
  });

  const palabras = useMemo(() => hook.split(/\s+/).filter(Boolean), [hook]);

  // La comilla emerge de casi invisible a presencia luminosa
  const comillaOpacity = useTransform(scrollYProgress, [0, 1], [0.05, 0.25]);

  return (
    <section ref={ref} className="relative mx-auto max-w-3xl px-5 pb-8 pt-14 sm:px-6 sm:pt-20">
      <div className="relative">
        <motion.span
          className="absolute -top-4 -left-1 select-none font-serif text-8xl leading-none sm:-left-4"
          style={{
            color: accentColor,
            opacity: reduced ? 0.15 : comillaOpacity,
            textShadow: `0 0 60px ${accentColor}4D`,
          }}
          aria-hidden="true"
        >
          &ldquo;
        </motion.span>

        <p className="relative font-serif text-2xl font-light leading-relaxed sm:text-3xl">
          {reduced ? (
            <span style={{ color: BRIGHT }}>{hook}</span>
          ) : (
            palabras.map((palabra, i) => (
              <PalabraPintada
                key={i}
                palabra={palabra}
                progress={scrollYProgress}
                inicio={i / palabras.length}
                fin={Math.min((i + 1) / palabras.length + 0.05, 1)}
              />
            ))
          )}
        </p>

        {/* ── Resto del resumen — siempre en el DOM (SEO), plegado hasta "Leer más" ── */}
        {resto && (
          <div className="mt-4">
            <motion.div
              initial={false}
              animate={{ height: abierto ? "auto" : 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <p className="pb-1 pt-1 text-base leading-relaxed text-stone-400 sm:text-lg">{resto}</p>
            </motion.div>
            <button
              type="button"
              onClick={() => setAbierto((v) => !v)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider transition-colors"
              style={{ color: accentColor }}
              aria-expanded={abierto}
            >
              {abierto ? t("leer_menos") : t("leer_mas")}
              <motion.svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                animate={{ rotate: abierto ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Línea de los tres mundos — solo cosmovisión prehispánica ── */}
      {origen === "prehispanico" && (
        <div className="mt-10 sm:mt-12">
          <div className="relative">
            <svg
              className="w-full"
              height="2"
              viewBox="0 0 100 2"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <motion.line
                x1="0"
                y1="1"
                x2="100"
                y2="1"
                stroke={`${accentColor}40`}
                strokeWidth="1"
                initial={reduced ? false : { pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, amount: 0.9 }}
                transition={{ duration: reduced ? 0 : 1.4, ease: "easeInOut" }}
              />
            </svg>

            <div className="mt-[-5px] flex justify-between">
              {TRES_MUNDOS.map((mundo, i) => (
                <button
                  key={mundo.nombre}
                  type="button"
                  className="group flex w-1/3 cursor-help flex-col items-center gap-2 focus-visible:outline-none"
                  aria-label={`${mundo.nombre}: ${mundo.significado}`}
                >
                  <span
                    className="h-2 w-2 rounded-full border transition-all duration-300 group-hover:scale-150 group-focus-visible:scale-150"
                    style={{
                      borderColor: accentColor,
                      backgroundColor: i === 1 ? accentColor : "transparent",
                      boxShadow: "none",
                    }}
                  />
                  <span
                    className="text-[10px] uppercase tracking-[0.22em] text-stone-500 transition-colors duration-300 group-hover:text-stone-300 group-focus-visible:text-stone-300"
                  >
                    {mundo.nombre}
                  </span>
                  <span
                    className="text-[10px] italic opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                    style={{ color: accentColor }}
                  >
                    {mundo.significado}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {children && <div className="mt-8">{children}</div>}
    </section>
  );
}

function PalabraPintada({
  palabra,
  progress,
  inicio,
  fin,
}: {
  palabra: string;
  progress: MotionValue<number>;
  inicio: number;
  fin: number;
}) {
  const color = useTransform(progress, [inicio, fin], [DIM, BRIGHT]);
  return (
    <>
      <motion.span style={{ color }}>{palabra}</motion.span>{" "}
    </>
  );
}
