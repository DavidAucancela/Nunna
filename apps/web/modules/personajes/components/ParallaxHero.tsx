"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { StaggerLetters } from "@/components/ui/FadeUp";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import type { TipoOrigen } from "@seres-del-pase/types";

interface ParallaxHeroProps {
  nombre: string;
  nombreKichwa?: string | undefined;
  nombresAlt: string[];
  origen?: TipoOrigen | undefined;
  imagen?: { url: string; altText: string } | undefined;
  imagenBanner?: { url: string; altText: string } | undefined;
  origenLabel: string;
  accentColor: string;
}

export function ParallaxHero({
  nombre,
  nombreKichwa,
  nombresAlt,
  origen,
  imagen,
  imagenBanner,
  origenLabel,
  accentColor,
}: ParallaxHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // La imagen se mueve más lento que el scroll → efecto parallax
  const imageY    = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "25%"]);
  // El contenido del hero sube y desaparece antes de que la sección salga
  const contentY  = useTransform(scrollYProgress, [0, 0.5], ["0%", reduced ? "0%" : "-12%"]);
  const contentOp = useTransform(scrollYProgress, [0, 0.38], [1, reduced ? 1 : 0]);
  const chevronOp = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

  return (
    <section
      ref={ref}
      className="-mt-16 relative flex min-h-[100svh] items-end overflow-hidden"
    >
      {/* Contenedor de imagen extendido arriba y abajo para cubrir el offset del parallax */}
      <motion.div
        className="absolute left-0 right-0"
        style={{ top: "-15%", bottom: "-15%", y: imageY }}
      >
        {(imagenBanner ?? imagen) ? (
          <Image
            src={(imagenBanner ?? imagen)!.url}
            alt={(imagenBanner ?? imagen)!.altText}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <OrigenPlaceholder
            origen={origen}
            nombre={nombre}
            variant="hero"
            className="h-full w-full"
          />
        )}
      </motion.div>

      {/* Gradientes dramáticos */}
      <div className="absolute inset-0 bg-gradient-to-t from-fondo-oscuro via-fondo-oscuro/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-fondo-oscuro/35 to-transparent" />

      {/* Breadcrumb */}
      <div className="absolute left-5 top-20 z-20 sm:left-6">
        <Link
          href="/personajes"
          className="flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-acento-dorado"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 14 14">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12L5 7l4-5" />
          </svg>
          Todos los personajes
        </Link>
      </div>

      {/* Contenido del hero: sube y desaparece al hacer scroll */}
      <motion.div
        style={{ y: contentY, opacity: contentOp }}
        className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-14 sm:px-6 sm:pb-20"
      >
        {nombreKichwa && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-serif text-base italic sm:text-lg"
            style={{ color: accentColor }}
          >
            {nombreKichwa}
          </motion.p>
        )}

        <h1
          className="mt-1 font-serif font-bold leading-none text-texto-claro"
          style={{
            fontSize:
              nombre.length <= 8
                ? "clamp(3.5rem, 10vw, 7rem)"
                : nombre.length <= 12
                ? "clamp(3rem, 8vw, 5.5rem)"
                : "clamp(2.5rem, 6vw, 4.5rem)",
          }}
        >
          <StaggerLetters text={nombre} delay={0.1} />
        </h1>

        {nombresAlt.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-3 text-sm italic text-stone-500"
          >
            {nombresAlt.join(" · ")}
          </motion.p>
        )}

        {origenLabel && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.65 }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs backdrop-blur-sm"
            style={{
              borderColor: `${accentColor}40`,
              backgroundColor: `${accentColor}15`,
              color: accentColor,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
            {origenLabel}
          </motion.span>
        )}
      </motion.div>

      {/* Indicador de scroll — desaparece al bajar */}
      <motion.div
        style={{ opacity: chevronOp }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[9px] uppercase tracking-[0.28em] text-stone-600">Descubrir</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            className="text-stone-600"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
