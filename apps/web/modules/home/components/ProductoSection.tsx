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
    <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-2xl border border-acento-dorado/20 shadow-[0_0_48px_rgba(200,155,60,0.12)]">
      <Image
        src="/personajes/diablos-de-lata/iman.png"
        alt="Imán artesanal Diablos de lata"
        fill
        className="object-cover"
        sizes="176px"
      />
    </div>
  );
}

function QrVisual() {
  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
      <div
        className="absolute inset-8 animate-ping rounded-sm bg-acento-dorado/6"
        style={{ animationDuration: "3s" }}
      />
      <svg
        viewBox="0 0 100 100"
        fill="currentColor"
        className="relative h-36 w-36 text-acento-dorado"
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
    <div className="relative mx-auto h-44 w-28 overflow-hidden rounded-2xl border border-acento-dorado/20 bg-stone-900 shadow-[0_0_48px_rgba(200,155,60,0.12)]">
      <Image
        src="/personajes/diablos-de-lata/portada.png"
        alt="Ficha del personaje en el teléfono"
        fill
        className="object-cover object-top"
        sizes="112px"
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
      className="border-y border-borde-sutil px-6 py-24"
      style={{
        backgroundColor: "#080706",
        backgroundImage: `url("data:image/svg+xml,${ANDEAN_PATTERN}")`,
        backgroundRepeat: "repeat",
      }}
    >
      <div className="mx-auto max-w-6xl">

        {/* Encabezado */}
        <FadeUp>
          <div className="mb-20 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-acento-dorado">El producto</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-texto-claro md:text-5xl">
              Cómo funciona
            </h2>
          </div>
        </FadeUp>

        {/* 3 tiles con divisores */}
        <div className="grid grid-cols-1 divide-y divide-borde-sutil md:grid-cols-3 md:divide-x md:divide-y-0">
          {PASOS.map((paso, i) => (
            <FadeUp key={paso.num} delay={i * 0.15}>
              <div className="flex flex-col items-center px-8 py-12 text-center md:py-4">

                {/* Número */}
                <span className="font-serif text-5xl font-bold text-acento-dorado/35 md:text-6xl">
                  {paso.num}
                </span>

                {/* Visual */}
                <div className="mt-6">
                  <paso.Visual />
                </div>

                {/* Título */}
                <h3 className="mt-8 font-serif text-xl font-bold text-texto-claro md:text-2xl">
                  {paso.titulo}
                </h3>

                {/* Descripción */}
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
