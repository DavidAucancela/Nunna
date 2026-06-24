"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Hotspot } from "@seres-del-pase/types";

interface AnatomiaSectionProps {
  imagen: { url: string; altText: string };
  hotspots: Hotspot[];
  accentColor: string;
  nombre: string;
}

/**
 * Fase 4 — "Anatomía": diagrama interactivo del personaje.
 * Visual sticky con pines numerados; al desplazarse, cada elemento se activa en
 * secuencia (IntersectionObserver, robusto en iOS). En escritorio los pines son
 * clicables (saltan a su bloque); en móvil la secuencia avanza con el scroll.
 * La card muestra significado + material + quién lo fabrica. Respeta reduced-motion.
 */
export function AnatomiaSection({ imagen, hotspots, accentColor, nombre }: AnatomiaSectionProps) {
  const reduced = useReducedMotion();
  const t = useTranslations("anatomia");
  const [activeIdx, setActiveIdx] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Activación secuencial: una franja delgada en el centro del viewport decide
  // qué bloque (y por tanto qué pin) está activo. Sin transforms ligados al scroll.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActiveIdx(idx);
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    stepRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [hotspots.length]);

  function goTo(i: number) {
    stepRefs.current[i]?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "center",
    });
  }

  return (
    <section className="border-t border-borde-sutil py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        {/* Encabezado */}
        <div className="mb-10 sm:mb-14">
          <span className="block text-[10px] uppercase tracking-[0.32em]" style={{ color: accentColor }}>
            {t("eyebrow")}
          </span>
          <h2 className="mt-2 font-serif text-2xl font-bold text-texto-claro sm:text-3xl">
            {t("titulo")}
          </h2>
          <p className="mt-2 text-sm text-stone-400">{t("hint")}</p>
        </div>

        <div className="lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          {/* ── Visual sticky con pines ── */}
          <div className="sticky top-16 z-10 -mx-5 mb-2 self-start bg-fondo-oscuro/80 px-5 pb-4 pt-2 backdrop-blur-sm sm:mx-0 sm:px-0 sm:backdrop-blur-none lg:top-24 lg:bg-transparent lg:pb-0">
            <div className="relative mx-auto h-[40vh] w-full max-w-xs sm:h-[46vh] lg:h-[72vh] lg:max-w-none">
              <Image
                src={imagen.url}
                alt={imagen.altText}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 80vw, 45vw"
                priority
              />

              {/* Pines */}
              {hotspots.map((h, i) => {
                const isActive = i === activeIdx;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => goTo(i)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-full"
                    style={{ left: `${h.x}%`, top: `${h.y}%` }}
                    aria-label={h.titulo}
                    aria-current={isActive}
                  >
                    {!isActive && !reduced && (
                      <motion.span
                        className="absolute inset-0 rounded-full"
                        style={{ border: `1.5px solid ${accentColor}` }}
                        animate={{ scale: [1, 2.4], opacity: [0.7, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: i * 0.4 }}
                      />
                    )}
                    <motion.span
                      className="relative flex items-center justify-center rounded-full border-2 font-sans text-[10px] font-bold"
                      style={{
                        width: isActive ? 26 : 20,
                        height: isActive ? 26 : 20,
                        backgroundColor: isActive ? accentColor : `${accentColor}CC`,
                        borderColor: isActive ? "white" : `${accentColor}80`,
                        color: isActive ? "#0F0E0C" : "transparent",
                        boxShadow: isActive ? `0 0 0 4px ${accentColor}30` : "none",
                      }}
                      animate={{ scale: isActive ? 1 : 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      {i + 1}
                    </motion.span>
                  </button>
                );
              })}
            </div>

            {/* Mini-nav de elementos (debajo del visual) */}
            <div className="mt-3 flex flex-wrap justify-center gap-2 lg:mt-5">
              {hotspots.map((h, i) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => goTo(i)}
                  className="rounded-full border px-3 py-1 text-[11px] transition-colors"
                  style={{
                    borderColor: i === activeIdx ? `${accentColor}60` : "rgb(var(--borde-sutil))",
                    color: i === activeIdx ? accentColor : "rgb(var(--stone-500))",
                    backgroundColor: i === activeIdx ? `${accentColor}12` : "transparent",
                  }}
                >
                  {h.titulo}
                </button>
              ))}
            </div>
          </div>

          {/* ── Bloques de texto (uno por elemento) ── */}
          <div>
            {hotspots.map((h, i) => (
              <div
                key={h.id}
                data-idx={i}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className="flex min-h-[58vh] flex-col justify-center py-8 lg:min-h-[72vh]"
              >
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  animate={{ opacity: i === activeIdx ? 1 : 0.4 }}
                >
                  <span className="font-sans text-xs font-medium tracking-wide" style={{ color: accentColor }}>
                    {t("contador", { n: i + 1, total: hotspots.length })}
                  </span>
                  <h3 className="mt-3 font-serif text-2xl font-bold leading-tight text-texto-claro sm:text-3xl">
                    {h.titulo}
                  </h3>
                  <div className="mt-4 h-px w-10" style={{ backgroundColor: accentColor }} />
                  <p className="mt-5 text-base leading-relaxed text-stone-300 sm:text-lg">{h.cuerpo}</p>

                  {(h.material || h.artesano) && (
                    <dl className="mt-7 space-y-4 border-t border-borde-sutil pt-6">
                      {h.material && (
                        <div>
                          <dt
                            className="text-[10px] uppercase tracking-[0.22em] text-stone-500"
                          >
                            {t("material")}
                          </dt>
                          <dd className="mt-1 text-sm text-stone-300">{h.material}</dd>
                        </div>
                      )}
                      {h.artesano && (
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.22em] text-stone-500">
                            {t("artesano")}
                          </dt>
                          <dd className="mt-1 text-sm italic text-stone-400">{h.artesano}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
