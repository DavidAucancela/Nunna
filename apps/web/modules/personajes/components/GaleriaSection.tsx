"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Media } from "@seres-del-pase/types";

interface GaleriaSectionProps {
  multimedia: Media[];
  accentColor: string;
  nombre?: string;
  /** Modo compuesto: sin el <section>/fondo propio (se inserta dentro de otra sección). */
  embedded?: boolean;
}

export function GaleriaSection({ multimedia, accentColor, nombre, embedded = false }: GaleriaSectionProps) {
  const [lightbox, setLightbox] = useState<{ images: Media[]; idx: number } | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Galería unificada: una sola grilla con todas las fotos del personaje
  // (imán + en el pase), ordenadas por `orden`. Las de pase van primero para
  // dar protagonismo a las fotos reales de la festividad.
  const images = useMemo<Media[]>(() => {
    const rank = (m: Media) => (m.titulo === "en-pase" ? 0 : 1);
    return [...multimedia].sort((a, b) => rank(a) - rank(b) || a.orden - b.orden);
  }, [multimedia]);

  const open  = (imgs: Media[], idx: number) => setLightbox({ images: imgs, idx });
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

  if (images.length === 0) return null;

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={embedded ? "" : "border-y border-borde-sutil bg-stone-950 py-20 sm:py-28"}>
      <div className="mx-auto max-w-7xl px-5 sm:px-6">

        {/* Encabezado */}
        <div className="mb-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] mb-3" style={{ color: `${accentColor}80` }}>
            {embedded ? "Movimiento II" : "Imágenes"}
          </p>
          <h2
            className={`font-display text-texto-claro ${
              embedded
                ? "text-[clamp(1.75rem,4vw,2.5rem)]"
                : "text-[clamp(2.5rem,7vw,5rem)] leading-[1.0]"
            }`}
          >
            Galería
          </h2>
          {nombre && !embedded && (
            <p className="mt-3 font-display-italic text-xl sm:text-2xl" style={{ color: accentColor }}>
              {nombre}
            </p>
          )}
        </div>

        {/* Carrusel unificado */}
        <ImageCarousel
          images={images}
          accentColor={accentColor}
          onOpen={(idx) => open(images, idx)}
        />
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
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 sm:px-14 md:px-20"
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                const startX = touchStartX.current;
                touchStartX.current = null;
                const endX = e.changedTouches[0]?.clientX;
                if (startX == null || endX == null) return;
                const dx = endX - startX;
                if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
              }}
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

              {/* Media activa — imagen o video */}
              <AnimatePresence mode="wait">
                {active.tipo === "video" ? (
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="w-full max-w-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <video
                      src={active.url}
                      controls
                      autoPlay
                      playsInline
                      className="max-h-[68vh] w-full rounded-lg object-contain"
                    />
                  </motion.div>
                ) : (
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
                )}
              </AnimatePresence>

              {/* Caption */}
              <AnimatePresence mode="wait">
                {active.descripcion && (
                  <motion.p
                    key={`cap-${active.id}`}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-borde-sutil bg-stone-900/80 text-stone-400 backdrop-blur-sm transition-all hover:border-stone-500 hover:text-stone-200"
                    aria-label="Imagen anterior"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); go(1); }}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-borde-sutil bg-stone-900/80 text-stone-400 backdrop-blur-sm transition-all hover:border-stone-500 hover:text-stone-200"
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
    </Wrapper>
  );
}

function ImageCarousel({
  images,
  accentColor,
  onOpen,
}: {
  images: Media[];
  accentColor: string;
  onOpen: (idx: number) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(images.length > 1);

  // El punto/flecha activa sigue la tarjeta más visible dentro del propio
  // scroller (root distinto del viewport de la página) — mismo patrón que el
  // mini-nav de AnatomiaSection, pero horizontal.
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        let best: { idx: number; ratio: number } | null = null;
        for (const e of entries) {
          const idx = Number((e.target as HTMLElement).dataset.idx);
          if (Number.isNaN(idx) || e.intersectionRatio <= 0) continue;
          if (!best || e.intersectionRatio > best.ratio) best = { idx, ratio: e.intersectionRatio };
        }
        if (best) setActiveIdx(best.idx);
      },
      { root, threshold: [0.5, 0.75, 1] },
    );
    itemRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [images.length]);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => updateEdges(), [updateEdges, images.length]);

  const scrollToIdx = useCallback((i: number) => {
    itemRefs.current[i]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  if (images.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:gap-4 sm:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img, idx) => (
          <motion.button
            key={img.id}
            data-idx={idx}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.38, delay: idx * 0.05, ease: "easeOut" }}
            onClick={() => onOpen(idx)}
            whileHover={{
              y: -6,
              borderColor: `${accentColor}70`,
              boxShadow: `0 14px 34px -10px rgba(0,0,0,0.55), 0 0 26px -8px ${accentColor}50`,
            }}
            className="group relative aspect-[3/4] w-[72vw] flex-none snap-center overflow-hidden rounded-2xl border border-borde-sutil focus:outline-none sm:w-[300px]"
            aria-label={`Ampliar: ${img.altText}`}
          >
            {img.tipo === "video" ? (
              <video
                src={img.url}
                preload="metadata"
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              />
            ) : (
              <Image
                src={img.url}
                alt={img.altText}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                sizes="(max-width: 640px) 72vw, 300px"
                priority={idx === 0}
              />
            )}

            {/* Degradado base — asegura contraste del ícono/caption incluso sin hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-fondo-oscuro/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Icono expandir / reproducir */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm"
                style={{ borderColor: `${accentColor}40`, backgroundColor: "rgba(15,14,12,0.7)" }}
              >
                {img.tipo === "video" ? (
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="ml-0.5 text-white" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="text-white" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                )}
              </span>
            </div>

            {/* Descripción al hover */}
            {img.descripcion && (
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-fondo-oscuro to-transparent px-3 py-4 transition-transform duration-300 group-hover:translate-y-0">
                <p className="text-[10px] leading-relaxed text-stone-300 sm:text-[11px]">{img.descripcion}</p>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Fades de borde — insinúan que hay más fotos a los lados */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-stone-950 to-transparent sm:w-12" />
      )}
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-stone-950 to-transparent sm:w-12" />
      )}

      {/* Flechas — solo escritorio, el swipe cubre táctil */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollToIdx(Math.max(activeIdx - 1, 0))}
            disabled={!canScrollLeft}
            className="absolute left-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-borde-sutil bg-stone-900/80 text-stone-400 backdrop-blur-sm transition-opacity hover:border-stone-500 hover:text-stone-200 disabled:pointer-events-none disabled:opacity-0 sm:flex"
            aria-label="Fotos anteriores"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollToIdx(Math.min(activeIdx + 1, images.length - 1))}
            disabled={!canScrollRight}
            className="absolute right-1 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-borde-sutil bg-stone-900/80 text-stone-400 backdrop-blur-sm transition-opacity hover:border-stone-500 hover:text-stone-200 disabled:pointer-events-none disabled:opacity-0 sm:flex"
            aria-label="Más fotos"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}

      {/* Puntos de progreso */}
      {images.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => scrollToIdx(i)}
              aria-label={`Ir a la foto ${i + 1}`}
              aria-current={i === activeIdx}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === activeIdx ? 20 : 6,
                backgroundColor: i === activeIdx ? accentColor : "#2A2724",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
