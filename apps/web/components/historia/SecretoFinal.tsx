"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

interface SecretoFinalProps {
  secreto: string;
  nombre: string;
  slugPersonaje: string;
  locale: string;
  textoTitulo: string;
  textoSubtitulo: string;
  textoCta: string;
  textoVolver: string;
}

export function SecretoFinal({
  secreto,
  nombre,
  slugPersonaje,
  locale,
  textoTitulo,
  textoSubtitulo,
  textoCta,
  textoVolver,
}: SecretoFinalProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  const hrefPersonaje = `/${locale}/personajes/${slugPersonaje}`;

  return (
    <section
      ref={ref}
      className="relative min-h-svh flex flex-col justify-center px-6 py-20 sm:px-10 sm:py-28"
      style={{ backgroundColor: "#C89B3C" }}
    >
      {/* Grain */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <filter id="grain-secreto">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-secreto)" opacity="0.08" />
      </svg>

      {/* Patrón rombo de fondo */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.08 }}
        aria-hidden="true"
      >
        <defs>
          <pattern id="rombo-secreto" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="#0F0E0C" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#rombo-secreto)" />
      </svg>

      <div className="relative z-10 max-w-lg">
        {/* Icono — candado abierto */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
          className="mb-8"
          aria-hidden="true"
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="6" y="18" width="28" height="20" rx="3" fill="#0F0E0C" fillOpacity="0.7" />
            <path
              d="M13,18 L13,13 C13,8.6 16.6,5 21,5 C25.4,5 29,8.6 29,13"
              stroke="#0F0E0C"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              strokeOpacity="0.7"
            />
            <circle cx="20" cy="27" r="3" fill="#C89B3C" />
          </svg>
        </motion.div>

        {/* Titular */}
        <motion.h2
          className="font-serif font-bold text-fondo-oscuro leading-tight mb-2"
          style={{ fontSize: "clamp(1.8rem, 6.5vw, 3.2rem)" }}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.215, 0.61, 0.355, 1] }}
        >
          {textoTitulo}
        </motion.h2>

        <motion.p
          className="text-sm text-fondo-oscuro/70 mb-8 uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          {textoSubtitulo}
        </motion.p>

        {/* El secreto */}
        <motion.blockquote
          className="font-serif text-fondo-oscuro leading-relaxed border-l-4 border-fondo-oscuro/30 pl-5"
          style={{ fontSize: "clamp(1.05rem, 3.8vw, 1.35rem)" }}
          initial={{ opacity: 0, x: -16 }}
          animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
          transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
        >
          {secreto}
        </motion.blockquote>

        {/* CTAs */}
        <motion.div
          className="mt-12 flex flex-col gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          <Link
            href={hrefPersonaje}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-fondo-oscuro px-7 py-3.5 text-sm font-semibold text-acento-dorado transition-all hover:bg-fondo-oscuro/90 active:scale-95"
          >
            {textoCta.replace("{nombre}", nombre)}
            <span aria-hidden="true">→</span>
          </Link>

          <Link
            href={`/${locale}/personajes`}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-fondo-oscuro/40 px-7 py-3.5 text-sm font-medium text-fondo-oscuro/70 transition-all hover:border-fondo-oscuro/60 hover:text-fondo-oscuro active:scale-95"
          >
            {textoVolver}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
