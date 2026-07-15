"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Hotspot, Media } from "@seres-del-pase/types";
import { AnatomiaGated } from "./AnatomiaGated";
import { GaleriaSection } from "./GaleriaSection";

interface PersonajeVisualSectionProps {
  slug: string;
  nombre: string;
  accentColor: string;
  multimedia: Media[];
  /** Retrato para la anatomía (pines). */
  imagen?: { url: string; altText: string } | undefined;
  hotspots?: Hotspot[] | undefined;
  /** Solo con experiencia v2 se muestra la anatomía interactiva. */
  experiencia?: boolean | undefined;
  eyebrow: string;
  titulo: string;
}

/**
 * Fusión de "Anatomía" (las partes del personaje) + "Galería" en UNA sola
 * sección visual: un solo fondo/borde/acento y una cabecera paraguas, con dos
 * movimientos internos. Elimina los headers duplicados y evita que el retrato
 * compita en dos secciones. La anatomía sigue gated (AnatomiaGated); si el
 * personaje está bloqueado, no renderiza nada y solo queda la galería.
 */
export function PersonajeVisualSection({
  slug,
  nombre,
  accentColor,
  multimedia,
  imagen,
  hotspots,
  experiencia,
  eyebrow,
  titulo,
}: PersonajeVisualSectionProps) {
  const reduced = useReducedMotion();
  const mostrarAnatomia = !!(experiencia && hotspots?.length && imagen);

  return (
    <section className="border-y border-borde-sutil bg-stone-950 py-20 sm:py-28">
      {/* ── Cabecera paraguas ── */}
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center"
        >
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em]" style={{ color: `${accentColor}80` }}>
            {eyebrow}
          </p>
          <h2 className="font-serif text-4xl font-bold text-texto-claro sm:text-5xl">{titulo}</h2>
          <p className="mt-2 font-serif text-lg italic" style={{ color: accentColor }}>
            {nombre}
          </p>
        </motion.div>
      </div>

      {/* ── Movimiento I: sus partes (gated). El divisor vive dentro de la
             anatomía embedded, así no queda huérfano si el personaje está
             bloqueado (AnatomiaGated → null). ── */}
      {mostrarAnatomia && imagen && (
        <div className="mt-12 sm:mt-16">
          <AnatomiaGated
            slug={slug}
            imagen={imagen}
            hotspots={hotspots!}
            accentColor={accentColor}
            nombre={nombre}
            embedded
          />
        </div>
      )}

      {/* ── Movimiento II: galería ── */}
      <div className="mt-12 sm:mt-16">
        <GaleriaSection multimedia={multimedia} accentColor={accentColor} nombre={nombre} embedded />
      </div>
    </section>
  );
}
