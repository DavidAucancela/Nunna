"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/ui/FadeUp";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import { getOrigenStyle } from "@/lib/origen-styles";
import type { PersonajeListItem } from "@seres-del-pase/types";

interface ShowcasePersonaje extends PersonajeListItem {
  leyenda?: string;
}

interface PersonajesShowcaseProps {
  personajes: ShowcasePersonaje[];
}

type Variant = "hero" | "medium" | "small";

function ShowcaseCard({
  personaje,
  variant,
}: {
  personaje: ShowcasePersonaje;
  variant: Variant;
}) {
  const style = getOrigenStyle(personaje.origen);
  const hasImage = !!personaje.imagenPortada;

  const titleClass =
    variant === "hero"
      ? "text-2xl sm:text-3xl md:text-4xl"
      : variant === "medium"
      ? "text-xl md:text-2xl"
      : "text-base md:text-lg";

  const imgSizes =
    variant === "hero"
      ? "(max-width: 768px) 100vw, 58vw"
      : variant === "medium"
      ? "(max-width: 768px) 50vw, 42vw"
      : "(max-width: 768px) 50vw, 21vw";

  return (
    <Link
      href={`/personajes/${personaje.slug}`}
      className="group relative block h-full overflow-hidden rounded-2xl border border-borde-sutil transition-transform duration-300 hover:-translate-y-1 focus:outline-none"
    >
      {/* Imagen o placeholder */}
      {hasImage ? (
        <Image
          src={personaje.imagenPortada!}
          alt={personaje.nombre}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes={imgSizes}
        />
      ) : (
        <OrigenPlaceholder
          origen={personaje.origen ?? "prehispanico"}
          nombre={personaje.nombre}
          variant="hero"
          uid={`showcase-${personaje.slug}`}
          className="absolute inset-0"
        />
      )}

      {/* Gradiente dramático */}
      <div className="absolute inset-0 bg-gradient-to-t from-fondo-oscuro/95 via-fondo-oscuro/20 to-transparent" />

      {/* Glow inset en hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ boxShadow: `inset 0 0 0 1.5px ${style.accentColor}50` }}
      />

      {/* Badge origen */}
      <span
        className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-fondo-oscuro/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm"
        style={{ color: style.accentColor }}
      >
        {style.label}
      </span>

      {/* Contenido inferior */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-5">
        {personaje.nombreKichwa && (
          <p
            className="font-serif text-xs italic leading-none mb-1 sm:text-sm"
            style={{ color: style.accentColor }}
          >
            {personaje.nombreKichwa}
          </p>
        )}
        <h3 className={`font-serif font-bold leading-tight text-white ${titleClass}`}>
          {personaje.nombre}
        </h3>

        {/* Leyenda: siempre visible en hero, aparece en hover en el resto */}
        {personaje.leyenda && (
          <p
            className={`mt-1.5 text-xs leading-relaxed text-stone-300 transition-opacity duration-400 sm:text-sm ${
              variant === "hero"
                ? "opacity-80"
                : "opacity-0 group-hover:opacity-100"
            }`}
          >
            &ldquo;{personaje.leyenda}&rdquo;
          </p>
        )}
      </div>
    </Link>
  );
}

export function PersonajesShowcase({ personajes }: PersonajesShowcaseProps) {
  const [p0, p1, p2, p3] = personajes;

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6 flex items-end justify-between">
        <FadeUp>
          <p className="text-xs uppercase tracking-[0.25em] text-acento-dorado">Los seres</p>
          <h2 className="mt-1 font-serif text-3xl font-bold text-texto-claro md:text-4xl">
            Personajes del pase
          </h2>
        </FadeUp>
        <FadeUp delay={0.2}>
          <Link
            href="/personajes"
            className="hidden text-sm font-medium text-stone-400 transition-colors hover:text-acento-dorado md:block"
          >
            Ver todos →
          </Link>
        </FadeUp>
      </div>

      {/* Layout Desktop: asimétrico */}
      {p0 && p1 && p2 && p3 && (
        <div className="hidden md:grid md:h-[620px] md:grid-cols-[58%_42%] md:gap-3">
          {/* Card grande — Aya Uma */}
          <ShowcaseCard personaje={p0} variant="hero" />

          {/* Columna derecha */}
          <div className="grid grid-rows-[1fr_1fr] gap-3">
            <ShowcaseCard personaje={p1} variant="medium" />
            <div className="grid grid-cols-2 gap-3">
              <ShowcaseCard personaje={p2} variant="small" />
              <ShowcaseCard personaje={p3} variant="small" />
            </div>
          </div>
        </div>
      )}

      {/* Layout Mobile: 2x2 */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {personajes.map((p) => (
          <div key={p.slug} className="aspect-[3/4]">
            <ShowcaseCard personaje={p} variant="small" />
          </div>
        ))}
      </div>

      {/* Ver todos — solo mobile */}
      <div className="mt-6 text-center md:hidden">
        <Link
          href="/personajes"
          className="text-sm font-medium text-acento-dorado underline-offset-4 hover:underline"
        >
          Ver todos los personajes →
        </Link>
      </div>
    </div>
  );
}
