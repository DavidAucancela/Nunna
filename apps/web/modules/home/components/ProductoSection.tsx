"use client";

import Image from "next/image";
import { FadeUp } from "@/components/ui/FadeUp";

function ImanVisual() {
  return (
    <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-2xl border border-stone-800">
      <Image
        src="/personajes/diablos-de-lata/iman.png"
        alt="Imán artesanal Diablos de lata"
        fill
        className="object-cover"
        sizes="112px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 to-transparent" />
    </div>
  );
}

function QrVisual() {
  return (
    <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
      <svg viewBox="0 0 100 100" fill="currentColor" className="h-24 w-24 text-acento-dorado/80">
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
      {/* Pulse ring */}
      <div
        className="absolute inset-2 animate-ping rounded-sm bg-acento-dorado/10"
        style={{ animationDuration: "2.5s" }}
      />
    </div>
  );
}

function FichaVisual() {
  return (
    <div className="relative mx-auto h-28 w-16 overflow-hidden rounded-xl border-2 border-stone-700 bg-fondo-oscuro">
      <Image
        src="/personajes/aya-uma/portada.png"
        alt="Ficha del personaje en el teléfono"
        fill
        className="object-cover object-top"
        sizes="64px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-fondo-oscuro/80 to-transparent" />
      {/* Barra de status simulada */}
      <div className="absolute bottom-2 left-2 right-2 space-y-1">
        <div className="h-1 w-8 rounded-full bg-acento-dorado/50" />
        <div className="h-1 w-5 rounded-full bg-stone-700" />
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
    <section className="border-y border-borde-sutil bg-stone-950 px-6 py-20">
      <div className="mx-auto max-w-5xl">

        {/* Encabezado */}
        <FadeUp>
          <div className="mb-16 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-acento-dorado">El producto</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-texto-claro md:text-4xl">
              Cómo funciona
            </h2>
          </div>
        </FadeUp>

        {/* Timeline */}
        <div className="relative grid gap-12 md:grid-cols-3 md:gap-0">

          {/* Línea conectora — solo desktop */}
          <div className="absolute left-[20%] right-[20%] top-14 hidden h-px bg-gradient-to-r from-transparent via-borde-sutil to-transparent md:block" />

          {PASOS.map((paso, i) => (
            <FadeUp key={paso.num} delay={i * 0.15}>
              <div className="relative flex flex-col items-center text-center md:px-8">

                {/* Número decorativo de fondo */}
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 select-none font-serif text-8xl font-bold leading-none text-stone-900 pointer-events-none"
                  aria-hidden="true"
                >
                  {paso.num}
                </span>

                {/* Visual */}
                <div className="relative z-10 mt-4">
                  <paso.Visual />
                </div>

                {/* Texto */}
                <h3 className="mt-5 font-serif text-xl font-bold text-texto-claro">{paso.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{paso.texto}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
