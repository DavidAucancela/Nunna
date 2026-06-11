"use client";

import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/ui/FadeUp";

function QrIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} aria-hidden="true">
      {/* Corner square TL */}
      <rect x="5"  y="5"  width="32" height="32" fill="none" stroke="currentColor" strokeWidth="7" rx="3" />
      <rect x="14" y="14" width="14" height="14" rx="1" />
      {/* Corner square TR */}
      <rect x="63" y="5"  width="32" height="32" fill="none" stroke="currentColor" strokeWidth="7" rx="3" />
      <rect x="72" y="14" width="14" height="14" rx="1" />
      {/* Corner square BL */}
      <rect x="5"  y="63" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="7" rx="3" />
      <rect x="14" y="72" width="14" height="14" rx="1" />
      {/* Data dots (simplified pattern) */}
      <rect x="44" y="5"  width="8" height="8" rx="1" />
      <rect x="44" y="17" width="8" height="8" rx="1" />
      <rect x="44" y="29" width="8" height="8" rx="1" />
      <rect x="56" y="44" width="8" height="8" rx="1" />
      <rect x="44" y="44" width="8" height="8" rx="1" />
      <rect x="5"  y="44" width="8" height="8" rx="1" />
      <rect x="17" y="44" width="8" height="8" rx="1" />
      <rect x="29" y="44" width="8" height="8" rx="1" />
      <rect x="56" y="56" width="8" height="8" rx="1" />
      <rect x="68" y="56" width="8" height="8" rx="1" />
      <rect x="80" y="56" width="8" height="8" rx="1" />
      <rect x="56" y="68" width="8" height="8" rx="1" />
      <rect x="80" y="68" width="8" height="8" rx="1" />
      <rect x="56" y="80" width="8" height="8" rx="1" />
      <rect x="68" y="80" width="8" height="8" rx="1" />
      <rect x="80" y="80" width="8" height="8" rx="1" />
    </svg>
  );
}

export function CtaFinal() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32">
      {/* Fondo gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-acento-dorado/8 via-transparent to-acento-jade/8" />
      <div className="absolute inset-0 bg-gradient-to-t from-fondo-oscuro/40 to-transparent" />

      {/* Línea superior decorativa */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-acento-dorado/30 to-transparent" />

      <div className="relative z-10 mx-auto max-w-3xl text-center">

        {/* QR animado */}
        <FadeUp>
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <QrIcon className="h-16 w-16 text-acento-dorado" />
              </motion.div>
              <div className="absolute inset-0 animate-pulse-slow rounded-sm bg-acento-dorado/15 blur-xl" />
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.1}>
          <h2 className="font-serif text-3xl font-bold text-texto-claro sm:text-4xl">
            ¿Tienes un imán?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-stone-400">
            Escanea el QR en el reverso con la cámara de tu teléfono para descubrir al ser que llevas contigo.
          </p>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/personajes"
              className="rounded-full bg-acento-rojo px-10 py-4 text-sm font-semibold text-white shadow-lg shadow-acento-rojo/30 transition-all hover:bg-red-700 hover:shadow-acento-rojo/50"
            >
              Ver todos los personajes
            </Link>
            <Link
              href="/sobre"
              className="text-sm font-medium text-stone-400 underline-offset-4 transition-colors hover:text-acento-dorado hover:underline"
            >
              Conocer el proyecto →
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
