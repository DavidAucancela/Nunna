"use client";

import Image from "next/image";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { FadeUp } from "@/components/ui/FadeUp";

const STATS = [
  { value: 9,   label: "Seres documentados", suffix: "" },
  { value: 500, label: "Años de tradición",  suffix: "+" },
  { value: 3,   label: "Idiomas",            suffix: "" },
  { value: 11,  label: "Pases catalogados",  suffix: "" },
];

export function StatsSection() {
  return (
    <section className="relative overflow-hidden border-y border-borde-sutil">
      {/* Imagen de fondo de un pase real */}
      <div className="absolute inset-0">
        <Image
          src="/pases/inti-huayra.jpg"
          alt="Pase del Niño Riobambeño"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-fondo-oscuro/82" />
      <div className="absolute inset-0 bg-gradient-to-b from-fondo-oscuro/70 via-transparent to-fondo-oscuro/70" />

      {/* Contenido */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-24 sm:py-32">

        {/* Cita dramática */}
        <FadeUp>
          <blockquote className="text-center">
            <p className="font-serif text-2xl font-bold italic leading-snug text-texto-claro sm:text-3xl lg:text-4xl">
              &ldquo;Donde el espíritu camina,
              <br className="hidden sm:block" />
              {" "}la tierra responde.&rdquo;
            </p>
            <footer className="mt-5 text-[10px] uppercase tracking-[0.3em] text-acento-dorado">
              — Aya Uma · Pases del Niño Riobambeño
            </footer>
          </blockquote>
        </FadeUp>

        {/* Divisor */}
        <div className="my-14 flex items-center gap-5">
          <div className="h-px flex-1 bg-borde-sutil" />
          <span className="text-sm text-acento-dorado/40" aria-hidden="true">✦</span>
          <div className="h-px flex-1 bg-borde-sutil" />
        </div>

        {/* Contadores */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <FadeUp key={stat.label} delay={i * 0.1}>
              <AnimatedCounter value={stat.value} label={stat.label} suffix={stat.suffix} />
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
