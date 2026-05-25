import Image from "next/image";
import Link from "next/link";
import type { PersonajeListItem } from "@seres-del-pase/types";

interface PersonajeCardProps {
  personaje: PersonajeListItem;
}

const ORIGEN_LABELS: Record<string, string> = {
  prehispanico: "Prehispánico",
  colonial: "Colonial",
  mestizo: "Mestizo",
  mixto: "Mixto",
};

export function PersonajeCard({ personaje }: PersonajeCardProps) {
  return (
    <Link
      href={`/personajes/${personaje.slug}`}
      className="group block overflow-hidden rounded-2xl border border-borde-sutil bg-stone-900/50 transition-all duration-300 hover:border-stone-600 hover:bg-stone-900"
    >
      {/* Imagen */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {personaje.imagenPortada ? (
          <Image
            src={personaje.imagenPortada}
            alt={personaje.nombre}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-stone-800 to-stone-900" />
        )}
        {personaje.origen && (
          <span className="absolute left-3 top-3 rounded-full border border-stone-700/50 bg-fondo-oscuro/80 px-2.5 py-0.5 text-xs text-stone-400 backdrop-blur-sm">
            {ORIGEN_LABELS[personaje.origen] ?? personaje.origen}
          </span>
        )}
      </div>

      {/* Texto */}
      <div className="p-4">
        {personaje.nombreKichwa && (
          <p className="font-serif text-xs italic text-acento-dorado">{personaje.nombreKichwa}</p>
        )}
        <h3 className="mt-0.5 font-serif text-lg font-semibold text-texto-claro group-hover:text-acento-dorado">
          {personaje.nombre}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-500">
          {personaje.resumen}
        </p>
      </div>
    </Link>
  );
}
