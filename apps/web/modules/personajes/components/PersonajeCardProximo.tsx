"use client";

import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import { getOrigenStyle, type Origen } from "@/lib/origen-styles";

interface PersonajeCardProximoProps {
  nombre: string;
  nombreKichwa?: string | undefined;
  origen: Origen;
}

export function PersonajeCardProximo({ nombre, nombreKichwa, origen }: PersonajeCardProximoProps) {
  const style = getOrigenStyle(origen);

  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl"
      style={{ boxShadow: "0 4px 24px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)" }}
    >
      {/* Fondo artístico */}
      <OrigenPlaceholder
        origen={origen}
        nombre={nombre}
        variant="card"
        className="absolute inset-0"
      />

      {/* Overlay de bloqueo */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/50 to-stone-950/30 backdrop-blur-[2px]" />

      {/* Badge próximamente */}
      <div className="absolute left-3 top-3 z-10">
        <span
          className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
          style={{
            borderColor: `${style.accentColor}40`,
            backgroundColor: `${style.accentColor}15`,
            color: style.accentColor,
          }}
        >
          Próximamente
        </span>
      </div>

      {/* Ícono candado */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-stone-600"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>

      {/* Nombre en la base */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        {nombreKichwa && (
          <p className="font-serif text-sm italic" style={{ color: `${style.accentColor}90` }}>
            {nombreKichwa}
          </p>
        )}
        <h3 className="mt-0.5 font-serif text-xl font-bold leading-tight text-stone-500">
          {nombre}
        </h3>
      </div>

      {/* Franja inferior tenue */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-30"
        style={{ backgroundColor: style.accentColor }}
      />
    </div>
  );
}
