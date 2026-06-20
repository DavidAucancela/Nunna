"use client";

import Image from "next/image";
import { FadeUp } from "@/components/ui/FadeUp";

const ANDEAN_PATTERN = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'>` +
  `<path d='M24 0L48 24L24 48L0 24Z' fill='none' stroke='rgba(200,155,60,0.08)' stroke-width='0.8'/>` +
  `<path d='M24 11L37 24L24 37L11 24Z' fill='none' stroke='rgba(200,155,60,0.05)' stroke-width='0.5'/>` +
  `</svg>`
);

function ImanVisual() {
  return (
    <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-xl border border-acento-dorado/20 shadow-[0_0_24px_rgba(200,155,60,0.12)] sm:h-28 sm:w-28 md:h-44 md:w-44 md:rounded-2xl md:shadow-[0_0_48px_rgba(200,155,60,0.12)]">
      <Image
        src="/personajes/diablos-de-lata-iman.webp"
        alt="Imán artesanal Diablos de lata"
        fill
        className="object-cover"
        sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, 176px"
      />
    </div>
  );
}

function QrVisual() {
  return (
    <div className="relative mx-auto flex h-20 w-20 items-center justify-center sm:h-28 sm:w-28 md:h-44 md:w-44">
      <div
        className="absolute inset-4 animate-ping rounded-sm bg-acento-dorado/6 md:inset-8"
        style={{ animationDuration: "3s" }}
      />
      <svg
        viewBox="0 0 100 100"
        fill="currentColor"
        className="relative h-16 w-16 text-acento-dorado sm:h-24 sm:w-24 md:h-36 md:w-36"
        aria-hidden="true"
      >
        <rect x="5"  y="5"  width="30" height="30" fill="none" stroke="currentColor" strokeWidth="7" rx="2" />
        <rect x="12" y="12" width="16" height="16" rx="1" />
        <rect x="65" y="5"  width="30" height="30" fill="none" stroke="currentColor" strokeWidth="7" rx="2" />
        <rect x="72" y="12" width="16" height="16" rx="1" />
        <rect x="5"  y="65" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="7" rx="2" />
        <rect x="12" y="72" width="16" height="16" rx="1" />
        <rect x="42" y="5"  width="8" height="8"  rx="1" />
        <rect x="42" y="17" width="8" height="8"  rx="1" />
        <rect x="65" y="42" width="8" height="8"  rx="1" />
        <rect x="77" y="42" width="8" height="8"  rx="1" />
        <rect x="42" y="42" width="8" height="8"  rx="1" />
        <rect x="54" y="54" width="8" height="8"  rx="1" />
        <rect x="66" y="66" width="8" height="8"  rx="1" />
        <rect x="78" y="54" width="8" height="8"  rx="1" />
        <rect x="54" y="78" width="8" height="8"  rx="1" />
        <rect x="78" y="78" width="8" height="8"  rx="1" />
      </svg>
    </div>
  );
}

function FichaVisual() {
  return (
    <div className="relative mx-auto h-20 w-14 overflow-hidden rounded-lg border border-acento-dorado/20 bg-stone-900 shadow-[0_0_24px_rgba(200,155,60,0.12)] sm:h-28 sm:w-20 sm:rounded-xl md:h-44 md:w-28 md:rounded-2xl md:shadow-[0_0_48px_rgba(200,155,60,0.12)]">
      <Image
        src="/personajes/diablos-de-lata.webp"
        alt="Ficha del personaje en el teléfono"
        fill
        className="object-cover object-top"
        sizes="(max-width: 640px) 56px, (max-width: 768px) 80px, 112px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent" />
      <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
        <div className="h-1 w-10 rounded-full bg-acento-dorado/60" />
        <div className="h-1 w-7 rounded-full bg-stone-600" />
        <div className="h-1 w-14 rounded-full bg-stone-700" />
      </div>
    </div>
  );
}

const PASOS = [
  {
    num: "01",
    titulo: "Elige tu imán",
    texto: "Cada imán lleva un ser único de los pases riobambeños, moldeado artesanalmente.",
    Visual: ImanVisual,
  },
  {
    num: "02",
    titulo: "Escanea el QR",
    texto: "Con la cámara de tu teléfono — sin app. En segundos estás en la ficha del ser.",
    Visual: QrVisual,
  },
  {
    num: "03",
    titulo: "Descubre al ser",
    texto: "Historia, simbolismo y cosmovisión kichwa en español, kichwa e inglés.",
    Visual: FichaVisual,
  },
];

export function ProductoSection() {
  return (
    <section
      className="border-y border-borde-sutil px-3 py-16 sm:px-6 sm:py-24"
      style={{
        backgroundColor: "#080706",
        backgroundImage: `url("data:image/svg+xml,${ANDEAN_PATTERN}")`,
        backgroundRepeat: "repeat",
      }}
    >
      <div className="mx-auto max-w-6xl">

        {/* Encabezado */}
        <FadeUp>
          <div className="mb-10 text-center sm:mb-20">
            <p className="text-xs uppercase tracking-[0.3em] text-acento-dorado">El producto</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-texto-claro md:text-5xl">
              Cómo funciona
            </h2>
          </div>
        </FadeUp>

        {/* Mobile: Stepper vertical */}
        <div className="mx-auto max-w-md space-y-0 md:hidden">
          {PASOS.map((paso, i) => (
            <FadeUp key={paso.num} delay={i * 0.15}>
              <div className="relative flex gap-4 pb-14 last:pb-0">
                {/* Línea + círculo numerado */}
                <div className="flex flex-col items-center">
                  <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-acento-dorado/50 bg-stone-950 font-serif text-sm font-bold text-acento-dorado">
                    {paso.num}
                  </span>
                  {i < PASOS.length - 1 && (
                    <div className="w-px flex-1 bg-gradient-to-b from-acento-dorado/20 to-transparent" />
                  )}
                </div>
                {/* Contenido */}
                <div className="flex flex-1 flex-col gap-3 pt-1">
                  <div className="shrink-0">
                    <paso.Visual />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-texto-claro">
                    {paso.titulo}
                  </h3>
                  <p className="text-sm leading-relaxed text-stone-400">
                    {paso.texto}
                  </p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Desktop: Grid 3 columnas */}
        <div className="hidden md:grid md:grid-cols-3 md:divide-x md:divide-borde-sutil">
          {PASOS.map((paso, i) => (
            <FadeUp key={paso.num} delay={i * 0.15}>
              <div className="flex flex-col items-center px-8 py-10 text-center">
                <span className="font-serif text-5xl font-bold text-acento-dorado/35 md:text-6xl">
                  {paso.num}
                </span>
                <div className="mt-6">
                  <paso.Visual />
                </div>
                <h3 className="mt-8 font-serif text-xl font-bold text-texto-claro md:text-2xl">
                  {paso.titulo}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-400 md:text-base">
                  {paso.texto}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
