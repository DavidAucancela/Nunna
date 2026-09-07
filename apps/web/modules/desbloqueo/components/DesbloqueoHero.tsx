"use client";

import Image from "next/image";
import { useParticleCanvas } from "@/modules/personajes/hooks/useParticleCanvas";

interface DesbloqueoHeroProps {
  imagenUrl: string | null;
  /** true para fotos de escena (landscape, cover centrado); false para retratos (object-top). */
  esEscena: boolean;
  nombre: string;
  origen: string | null;
  accentColor: string;
}

/**
 * Hero de /desbloquear/[slug] — foto de escena del personaje ("imagenIngreso")
 * con una capa de partículas de luz (canvas nativo, `useParticleCanvas`) del
 * color de acento de su origen, mismo lenguaje visual que `HeroDespertar`.
 */
export function DesbloqueoHero({ imagenUrl, esEscena, nombre, origen, accentColor }: DesbloqueoHeroProps) {
  const { canvasRef } = useParticleCanvas({
    count: 10,
    color: accentColor,
    mode: "drift",
    enabled: true,
  });

  return (
    <div className="relative flex min-h-[55vw] max-h-[420px] w-full items-end overflow-hidden bg-fondo-oscuro sm:min-h-[320px]">
      {imagenUrl ? (
        <>
          <Image
            src={imagenUrl}
            alt={nombre}
            fill
            className={esEscena ? "object-cover" : "object-cover object-top"}
            priority
            sizes="100vw"
          />
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] h-full w-full mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-fondo-oscuro via-fondo-oscuro/40 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: `${accentColor}18` }} />
      )}

      <div className="relative z-10 w-full px-5 pb-6 sm:px-8">
        <span
          className="mb-2 inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
          style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
        >
          {origen}
        </span>
        <h1 className="font-serif text-4xl font-bold text-texto-claro sm:text-5xl">{nombre}</h1>
      </div>
    </div>
  );
}
