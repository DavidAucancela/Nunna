"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Media } from "@seres-del-pase/types";

type Categoria = "retrato" | "proceso" | "en-pase";

const CATEGORIAS: { id: Categoria; label: string; desc: string }[] = [
  { id: "retrato",  label: "El personaje", desc: "Fotografías del personaje real" },
  { id: "proceso",  label: "El imán",      desc: "El imán artesanal del personaje" },
  { id: "en-pase",  label: "En el pase",   desc: "El personaje en la festividad" },
];

interface GaleriaSectionProps {
  multimedia: Media[];
  accentColor: string;
}

export function GaleriaSection({ multimedia, accentColor }: GaleriaSectionProps) {
  const [activa, setActiva] = useState<Categoria>("retrato");

  // Convención: el campo `titulo` en Media indica la categoría de la imagen.
  // Sin título → se trata como retrato (incluye la imagen de portada).
  const porCategoria: Record<Categoria, Media[]> = {
    retrato:   multimedia.filter(m => !m.titulo || m.titulo === "retrato"),
    proceso:   multimedia.filter(m => m.titulo === "proceso"),
    "en-pase": multimedia.filter(m => m.titulo === "en-pase"),
  };

  const imagenes = porCategoria[activa];
  const categoria = CATEGORIAS.find(c => c.id === activa)!;

  return (
    <section className="border-t border-borde-sutil py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">

        {/* Encabezado + tabs */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-serif text-2xl font-bold text-texto-claro sm:text-3xl">Galería</h2>

          <div className="flex gap-1 rounded-xl border border-borde-sutil bg-stone-950/60 p-1 w-fit">
            {CATEGORIAS.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiva(cat.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  activa === cat.id
                    ? "bg-stone-800 shadow-sm"
                    : "text-stone-500 hover:text-stone-300"
                }`}
                style={activa === cat.id ? { color: accentColor } : {}}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido con transición entre categorías */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activa}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            {imagenes.length > 0 ? (
              /* Scroll horizontal en móvil → grid en tablet+ */
              <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible lg:grid-cols-3">
                {imagenes.map(img => (
                  <div
                    key={img.id}
                    className="relative flex-none w-[78vw] aspect-[3/4] sm:w-auto overflow-hidden rounded-2xl border border-borde-sutil group"
                  >
                    <Image
                      src={img.url}
                      alt={img.altText}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 30vw"
                    />
                    {img.descripcion && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-fondo-oscuro/80 to-transparent px-4 py-5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-xs text-stone-300 leading-relaxed">{img.descripcion}</p>
                      </div>
                    )}
                  </div>
                ))}
                {/* Celdas vacías para completar el grid en desktop */}
                {imagenes.length < 3 &&
                  Array.from({ length: 3 - imagenes.length }).map((_, i) => (
                    <div
                      key={`ph-${i}`}
                      className="hidden sm:flex items-center justify-center aspect-[3/4] rounded-2xl border border-dashed border-borde-sutil bg-stone-950/20"
                    >
                      <span style={{ color: accentColor, opacity: 0.18 }} className="text-2xl select-none">✦</span>
                    </div>
                  ))}
              </div>
            ) : (
              /* Próximamente */
              <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative flex-none w-[78vw] aspect-[3/4] sm:w-auto rounded-2xl border border-borde-sutil bg-stone-950/30 flex flex-col items-center justify-center gap-4"
                  >
                    <span style={{ color: accentColor, opacity: 0.22 }} className="text-2xl select-none">✦</span>
                    {i === 1 && (
                      <p className="text-[10px] text-stone-700 text-center px-6 leading-relaxed">
                        {categoria.desc}<br />
                        <span className="text-stone-800">— próximamente</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
