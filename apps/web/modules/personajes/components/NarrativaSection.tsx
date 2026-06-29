"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

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
}

export function NarrativaSection({ leyenda, secreto, capitulos, accentColor, artesanoFirma }: NarrativaSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [secretoVisible, setSecretoVisible] = useState(false);
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
                  <span
                    className="block font-mono text-[7rem] font-bold leading-none select-none"
                    style={{ color: accentColor, opacity: 0.10 }}
                  >
                    0{activeIndex + 1}
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

              {/* Chapter dots progress */}
              <div className="mt-12 flex gap-2">
                {capitulos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      chapterRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className="h-1 rounded-full transition-all duration-400"
                    style={{
                      width: activeIndex === i ? 24 : 8,
                      backgroundColor: activeIndex === i ? accentColor : "#2A2724",
                    }}
                    aria-label={`Ir al capítulo ${i + 1}`}
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
                  {chapter.texto}
                </motion.p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Secreto reveal card ── */}
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-2 sm:px-6">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
        >
          <button
            onClick={() => setSecretoVisible((v) => !v)}
            className="w-full rounded-2xl border p-6 text-left transition-colors duration-300"
            style={{
              borderColor: secretoVisible ? `${accentColor}50` : "#2A2724",
              backgroundColor: secretoVisible ? `${accentColor}0A` : "transparent",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  width="14" height="14" fill="none" stroke="currentColor"
                  strokeWidth={1.5} viewBox="0 0 24 24"
                  style={{ color: accentColor }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span
                  className="text-[9px] uppercase tracking-[0.32em]"
                  style={{ color: accentColor }}
                >
                  Secreto del artesano
                </span>
              </div>
              <motion.svg
                width="14" height="14" fill="none" stroke="currentColor"
                strokeWidth={1.5} viewBox="0 0 24 24"
                animate={{ rotate: secretoVisible ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ color: accentColor, flexShrink: 0 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </motion.svg>
            </div>

            <AnimatePresence mode="wait">
              {!secretoVisible ? (
                <motion.p
                  key="hint"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm italic text-stone-600"
                >
                  Hay algo sobre este personaje que pocos saben...
                </motion.p>
              ) : (
                <motion.p
                  key="secreto"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="text-base leading-relaxed text-stone-300"
                >
                  {secreto}
                  {artesanoFirma && (
                    <span className="mt-3 block text-right text-xs italic text-stone-600">
                      · {artesanoFirma}
                    </span>
                  )}
                </motion.p>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
