"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Media } from "@seres-del-pase/types";

interface GaleriaSectionProps {
  multimedia: Media[];
  accentColor: string;
  nombre?: string;
}

export function GaleriaSection({ multimedia, accentColor, nombre }: GaleriaSectionProps) {
  const [lightbox, setLightbox] = useState<{ images: Media[]; idx: number } | null>(null);

  const retratos = multimedia.filter((m) => !m.titulo || m.titulo === "retrato");
  const proceso  = multimedia.filter((m) => m.titulo === "proceso");

  const open  = (images: Media[], idx: number) => setLightbox({ images, idx });
  const close = useCallback(() => setLightbox(null), []);
  const go    = useCallback((dir: -1 | 1) => {
    setLightbox((lb) =>
      lb ? { ...lb, idx: (lb.idx + dir + lb.images.length) % lb.images.length } : null
    );
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")      close();
      else if (e.key === "ArrowLeft")  go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, close, go]);

  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  const active = lightbox ? lightbox.images[lightbox.idx] : null;

  return (
    <section className="border-y border-borde-sutil bg-stone-950 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">

        {/* Encabezado */}
        <div className="mb-12 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: `${accentColor}80` }}>
            Imágenes
          </p>
          <h2 className="font-serif text-4xl font-bold text-texto-claro sm:text-5xl">Galería</h2>
          {nombre && (
            <p className="mt-2 font-serif text-lg italic" style={{ color: accentColor }}>
              {nombre}
            </p>
          )}
        </div>

        {/* El personaje */}
        <ImageGrid
          label="El personaje"
          images={retratos}
          accentColor={accentColor}
          onOpen={(idx) => open(retratos, idx)}
        />

        {/* El imán */}
        {proceso.length > 0 && (
          <>
            <div className="my-14 flex items-center gap-5">
              <div className="h-px flex-1 bg-borde-sutil" />
              <span
                className="select-none text-xs"
                style={{ color: `${accentColor}30` }}
                aria-hidden="true"
              >
                ✦
              </span>
              <div className="h-px flex-1 bg-borde-sutil" />
            </div>
            <ImageGrid
              label="El imán"
              images={proceso}
              accentColor={accentColor}
              onOpen={(idx) => open(proceso, idx)}
            />
          </>
        )}
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && active && (
          <>
            {/* Fondo */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[99] bg-stone-950/95 backdrop-blur-md"
              onClick={close}
            />

            {/* Contenedor principal */}
            <motion.div
              key="lb-shell"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-14 sm:px-20"
            >
              {/* Barra superior */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4">
                <span className="text-xs tabular-nums text-stone-600">
                  {lightbox.idx + 1} / {lightbox.images.length}
                </span>
                <button
                  onClick={close}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-borde-sutil text-stone-500 transition-all hover:border-stone-500 hover:text-stone-200"
                  aria-label="Cerrar galería"
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Imagen activa */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="relative h-[68vh] w-full max-w-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={active.url}
                    alt={active.altText}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 80vw, 576px"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Caption */}
              <AnimatePresence mode="wait">
                {active.descripcion && (
                  <motion.p
                    key={`cap-${active.id}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-5 max-w-xs text-center text-[11px] leading-relaxed text-stone-500"
                  >
                    {active.descripcion}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Flechas prev / next */}
              {lightbox.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); go(-1); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-borde-sutil bg-stone-900/80 text-stone-400 backdrop-blur-sm transition-all hover:border-stone-500 hover:text-stone-200"
                    aria-label="Imagen anterior"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); go(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-borde-sutil bg-stone-900/80 text-stone-400 backdrop-blur-sm transition-all hover:border-stone-500 hover:text-stone-200"
                    aria-label="Imagen siguiente"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}

function ImageGrid({
  label,
  images,
  accentColor,
  onOpen,
}: {
  label: string;
  images: Media[];
  accentColor: string;
  onOpen: (idx: number) => void;
}) {
  if (images.length === 0) return null;

  const gridClass =
    images.length === 1
      ? "max-w-[200px]"
      : images.length === 2
      ? "grid grid-cols-2 gap-3 sm:gap-4 max-w-sm"
      : "grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3";

  return (
    <div>
      {/* Label */}
      <div className="mb-6 flex items-center gap-4">
        <p
          className="text-[10px] font-medium uppercase tracking-[0.25em]"
          style={{ color: `${accentColor}90` }}
        >
          {label}
        </p>
        <div className="h-px flex-1 bg-borde-sutil" />
      </div>

      {/* Grid de thumbnails */}
      <div className={gridClass}>
        {images.map((img, idx) => (
          <motion.button
            key={img.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.38, delay: idx * 0.09, ease: "easeOut" }}
            onClick={() => onOpen(idx)}
            className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-borde-sutil focus:outline-none"
            aria-label={`Ampliar: ${img.altText}`}
          >
            <Image
              src={img.url}
              alt={img.altText}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.07]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-fondo-oscuro/0 transition-colors duration-300 group-hover:bg-fondo-oscuro/25" />

            {/* Icono expand */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-stone-950/70 backdrop-blur-sm">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </span>
            </div>

            {/* Descripción al hover */}
            {img.descripcion && (
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-fondo-oscuro to-transparent px-3 py-4 transition-transform duration-300 group-hover:translate-y-0">
                <p className="text-[10px] leading-relaxed text-stone-300">{img.descripcion}</p>
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
