"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SecretoRitual } from "./SecretoRitual";
import { renderConTerminos } from "../kichwaGlosario";

interface Capitulo {
  titulo: string;
  texto: string;
}

interface NarrativaSectionProps {
  leyenda: string;
  secreto: string;
  capitulos: Capitulo[];
  accentColor: string;
  artesanoFirma?: string;
  /** Palabras clave de la narrativa (JSON) — reciben énfasis y, si son kichwa, tooltip. */
  palabrasClave?: string[];
}

export function NarrativaSection({
  leyenda,
  secreto,
  capitulos,
  accentColor,
  artesanoFirma,
  palabrasClave,
}: NarrativaSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduced = useReducedMotion();
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (reduced) return;

    const observers = capitulos.map((_, i) => {
      const el = chapterRefs.current[i];
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry?.isIntersecting) setActiveIndex(i); },
        { threshold: 0.4, rootMargin: "-10% 0px -35% 0px" }
      );
      obs.observe(el);
      return obs;
    });

    return () => observers.forEach((obs) => obs?.disconnect());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // ── Serpiente de progreso: el camino del pase entre capítulos ──
  const n = capitulos.length;
  const SERP_W = 160;
  const SERP_H = 40;
  const puntos = capitulos.map((_, i) => ({
    x: n === 1 ? SERP_W / 2 : 12 + (i * (SERP_W - 24)) / (n - 1),
    y: i % 2 === 0 ? 15 : 25,
  }));
  const serpPath = puntos.reduce((d, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = puntos[i - 1]!;
    const mx = (prev.x + p.x) / 2;
    return `${d} C ${mx} ${prev.y}, ${mx} ${p.y}, ${p.x} ${p.y}`;
  }, "");

  return (
    <section className="border-t border-borde-sutil">

      {/* ── Leyenda epigraph ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="mx-auto max-w-3xl px-5 pb-4 pt-20 sm:px-6"
      >
        <p
          className="font-serif text-xl font-light italic leading-snug sm:text-2xl"
          style={{ color: accentColor }}
        >
          &ldquo;{leyenda}&rdquo;
        </p>
      </motion.div>

      {/* ── Sticky scrollytelling (desktop) + stacked (mobile) ── */}
      <div className="relative mx-auto max-w-7xl px-5 pb-8 sm:px-6">
        <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-20">

          {/* Left: sticky panel (desktop only) */}
          <div className="hidden lg:block">
            <div className="sticky top-28 pb-40">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Número split-flap: gira sobre su bisagra superior al cambiar */}
                  <span className="block" style={{ perspective: 500 }}>
                    <motion.span
                      className="block font-mono text-[7rem] font-bold leading-none select-none"
                      style={{ color: accentColor, transformOrigin: "50% 0%" }}
                      initial={reduced ? { opacity: 0.10 } : { rotateX: -85, opacity: 0 }}
                      animate={{ rotateX: 0, opacity: 0.10 }}
                      transition={{ duration: 0.55, ease: [0.22, 1.4, 0.36, 1] }}
                    >
                      0{activeIndex + 1}
                    </motion.span>
                  </span>
                  <h3 className="mt-2 font-serif text-3xl font-bold leading-tight text-texto-claro sm:text-4xl">
                    {capitulos[activeIndex]?.titulo}
                  </h3>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                    className="mt-6 h-px w-10 origin-left"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span
                    className="mt-3 block text-[9px] uppercase tracking-[0.32em]"
                    style={{ color: accentColor }}
                  >
                    Historia
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Serpiente de progreso — recorre el camino entre capítulos */}
              <div className="relative mt-10 h-10 w-40">
                <svg
                  viewBox={`0 0 ${SERP_W} ${SERP_H}`}
                  className="absolute inset-0 h-full w-full"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d={serpPath} stroke="#2A2724" strokeWidth="1.5" strokeLinecap="round" />
                  <motion.path
                    d={serpPath}
                    stroke={accentColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: n > 1 ? Math.max(activeIndex / (n - 1), 0.001) : 1 }}
                    transition={{ duration: reduced ? 0 : 0.6, ease: "easeInOut" }}
                  />
                </svg>
                {puntos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      chapterRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-300"
                    style={{
                      left: `${(p.x / SERP_W) * 100}%`,
                      top: `${(p.y / SERP_H) * 100}%`,
                      borderColor: i <= activeIndex ? accentColor : "#2A2724",
                      backgroundColor: i <= activeIndex ? accentColor : "#0F0E0C",
                    }}
                    aria-label={`Ir al capítulo ${i + 1}`}
                    aria-current={activeIndex === i}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right: scrolling chapters */}
          <div>
            {capitulos.map((chapter, i) => (
              <div
                key={i}
                ref={(el) => { chapterRefs.current[i] = el; }}
                className="flex min-h-[55vh] flex-col justify-center py-16"
              >
                {/* Mobile: chapter header inline */}
                <div className="mb-5 lg:hidden">
                  <span
                    className="block font-mono text-5xl font-bold leading-none select-none"
                    style={{ color: accentColor, opacity: 0.22 }}
                  >
                    0{i + 1}
                  </span>
                  <h3 className="mt-2 font-serif text-2xl font-bold text-texto-claro">
                    {chapter.titulo}
                  </h3>
                  <div className="mt-4 h-px w-8" style={{ backgroundColor: accentColor }} />
                </div>

                <motion.p
                  initial={reduced ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="text-lg leading-relaxed text-stone-300"
                >
                  {renderConTerminos(chapter.texto, palabrasClave ?? [], accentColor)}
                </motion.p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── El Ritual del Desbloqueo — secreto del artesano ── */}
      <SecretoRitual secreto={secreto} accentColor={accentColor} artesanoFirma={artesanoFirma} />
    </section>
  );
}
