"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Hotspot } from "@seres-del-pase/types";

interface HotspotsViewerProps {
  imagen: { url: string; altText: string };
  hotspots: Hotspot[];
  accentColor: string;
}

export function HotspotsViewer({ imagen, hotspots, accentColor }: HotspotsViewerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const reduced = useReducedMotion();

  const active = hotspots.find((h) => h.id === activeId) ?? null;

  function toggle(id: string) {
    setActiveId((prev) => (prev === id ? null : id));
  }

  return (
    <section className="border-t border-borde-sutil py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">

        {/* Section header */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <span
            className="block text-[9px] uppercase tracking-[0.32em]"
            style={{ color: accentColor }}
          >
            Anatomía del traje
          </span>
          <p className="mt-1 font-serif text-2xl font-bold text-texto-claro sm:text-3xl">
            Toca los elementos para explorar
          </p>
        </motion.div>

        {/* Layout: image left, panel right on desktop */}
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:items-start">

          {/* Image with hotspot dots */}
          <motion.div
            initial={reduced ? false : { opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-sm lg:max-w-none"
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-borde-sutil">
              <Image
                src={imagen.url}
                alt={imagen.altText}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 80vw, 40vw"
              />

              {/* Hotspot dots */}
              {hotspots.map((h) => {
                const isActive = h.id === activeId;
                return (
                  <button
                    key={h.id}
                    onClick={() => toggle(h.id)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                    style={{ left: `${h.x}%`, top: `${h.y}%` }}
                    aria-label={h.titulo}
                  >
                    {/* Pulse ring */}
                    {!isActive && (
                      <motion.span
                        className="absolute inset-0 rounded-full"
                        style={{ border: `1.5px solid ${accentColor}` }}
                        animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeOut",
                          delay: Math.random() * 1.5,
                        }}
                      />
                    )}
                    {/* Dot */}
                    <motion.span
                      className="relative block rounded-full border-2 transition-transform"
                      style={{
                        width: isActive ? 18 : 14,
                        height: isActive ? 18 : 14,
                        backgroundColor: isActive ? accentColor : `${accentColor}CC`,
                        borderColor: isActive ? "white" : `${accentColor}80`,
                        boxShadow: isActive ? `0 0 0 3px ${accentColor}30` : "none",
                      }}
                      animate={{ scale: isActive ? 1.2 : 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Mobile dots legend */}
            <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
              {hotspots.map((h) => (
                <button
                  key={h.id}
                  onClick={() => toggle(h.id)}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors duration-200"
                  style={{
                    borderColor: activeId === h.id ? `${accentColor}60` : "#2A2724",
                    color: activeId === h.id ? accentColor : "#78716c",
                    backgroundColor: activeId === h.id ? `${accentColor}0A` : "transparent",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: activeId === h.id ? accentColor : "#44403c" }}
                  />
                  {h.titulo}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Info panel */}
          <div className="flex flex-col justify-center lg:min-h-[60vh]">
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span
                    className="block text-[9px] uppercase tracking-[0.32em] mb-4"
                    style={{ color: accentColor }}
                  >
                    Elemento del traje
                  </span>
                  <h3 className="font-serif text-3xl font-bold text-texto-claro sm:text-4xl leading-tight">
                    {active.titulo}
                  </h3>
                  <div className="mt-5 h-px w-10" style={{ backgroundColor: accentColor }} />
                  <p className="mt-6 text-lg leading-relaxed text-stone-300">
                    {active.cuerpo}
                  </p>

                  {/* Dot navigation */}
                  <div className="mt-10 hidden items-center gap-3 lg:flex">
                    {hotspots.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => toggle(h.id)}
                        className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all duration-200"
                        style={{
                          borderColor: h.id === activeId ? `${accentColor}60` : "#2A2724",
                          color: h.id === activeId ? accentColor : "#57534e",
                          backgroundColor: h.id === activeId ? `${accentColor}0A` : "transparent",
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: h.id === activeId ? accentColor : "#44403c" }}
                        />
                        {h.titulo}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-start gap-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="flex h-12 w-12 items-center justify-center rounded-full border"
                    style={{ borderColor: `${accentColor}30`, backgroundColor: `${accentColor}08` }}
                  >
                    <svg
                      width="20" height="20" fill="none" stroke="currentColor"
                      strokeWidth={1.5} viewBox="0 0 24 24"
                      style={{ color: accentColor, opacity: 0.6 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                    </svg>
                  </motion.div>
                  <p className="text-base text-stone-600">
                    Selecciona un elemento del traje para descubrir su significado.
                  </p>

                  {/* Desktop legend */}
                  <div className="mt-4 hidden flex-wrap gap-2 lg:flex">
                    {hotspots.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => toggle(h.id)}
                        className="flex items-center gap-1.5 rounded-full border border-borde-sutil px-3 py-1.5 text-xs text-stone-500 transition-colors hover:border-stone-600 hover:text-stone-300"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: accentColor, opacity: 0.5 }}
                        />
                        {h.titulo}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
