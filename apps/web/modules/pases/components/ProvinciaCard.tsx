"use client";

import Image from "next/image";
import type { Region } from "@/lib/services/provincias.service";
import provinciasGeoRaw from "@/lib/data/provincias.geo.json";

interface ProvinciaFeature {
  properties: { slug: string };
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

const LADO = 100; // lado del viewBox de la silueta

/**
 * Silueta de una provincia como path SVG, encajada en un cuadro de 100×100.
 * Proyección plana (lon/lat directo): el Ecuador está sobre la línea
 * equinoccial, así que la distorsión es despreciable a este tamaño.
 */
function trazarSilueta(geometry: ProvinciaFeature["geometry"]): string {
  const poligonos = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const puntos = poligonos.flat(2);
  const lons = puntos.map((p) => p[0]!);
  const lats = puntos.map((p) => p[1]!);
  const [minX, maxX, minY, maxY] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
  const escala = LADO / Math.max(maxX - minX, maxY - minY);
  const dx = (LADO - (maxX - minX) * escala) / 2;
  const dy = (LADO - (maxY - minY) * escala) / 2;
  return poligonos
    .flat()
    .map(
      (anillo) =>
        anillo
          .map((p, i) => {
            const x = (dx + (p[0]! - minX) * escala).toFixed(1);
            const y = (dy + (maxY - p[1]!) * escala).toFixed(1);
            return `${i === 0 ? "M" : "L"}${x} ${y}`;
          })
          .join("") + "Z"
    )
    .join("");
}

// Una sola vez al cargar el módulo — provincias.geo.json es estático.
const SILUETAS = new Map<string, string>(
  (provinciasGeoRaw as unknown as { features: ProvinciaFeature[] }).features.map((f) => [
    f.properties.slug,
    trazarSilueta(f.geometry),
  ])
);

interface Props {
  slug: string;
  nombre: string;
  region: Region;
  regionLabel: string;
  /** "15 pases" ya traducido. */
  conteo: string;
  /** "Próxima: 2 nov" ya traducido; ausente hasta conocer la fecha del visitante. */
  proxima?: string;
  /** Foto real de un pase de la provincia, si existe: va de fondo, atenuada. */
  foto?: string;
  onSelect: () => void;
}

/**
 * Tarjeta de provincia del índice de `/pases`. El gráfico es la silueta de la
 * provincia (la tienen las 24, así que ninguna tarjeta queda vacía); si además
 * hay una foto real de sus pases, se suma de fondo.
 */
export function ProvinciaCard({
  slug,
  nombre,
  regionLabel,
  conteo,
  proxima,
  foto,
  onSelect,
}: Props) {
  const silueta = SILUETAS.get(slug);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative h-full w-full overflow-hidden rounded-2xl border border-borde-sutil bg-stone-900/40 text-left transition-colors duration-300 hover:border-acento-dorado focus:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70"
    >
      {foto && (
        <Image
          src={foto}
          alt=""
          fill
          sizes="(min-width: 768px) 22vw, 45vw"
          className="object-cover opacity-30 transition-[opacity,transform] duration-500 group-hover:scale-105 group-hover:opacity-50"
        />
      )}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-fondo-oscuro via-fondo-oscuro/75 to-fondo-oscuro/10" />

      {silueta && (
        <svg
          viewBox={`0 0 ${LADO} ${LADO}`}
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-2.5 h-[46%] w-auto drop-shadow-[0_0_18px_rgba(31,77,63,0.6)] transition-transform duration-500 group-hover:scale-110 md:right-5 md:top-[14%] md:h-[72%]"
        >
          <path
            d={silueta}
            fillRule="evenodd"
            strokeWidth={1.6}
            strokeLinejoin="round"
            className="fill-acento-jade stroke-acento-dorado transition-colors duration-300 group-hover:fill-acento-rojo"
          />
        </svg>
      )}

      <span className="relative flex h-full flex-col justify-end p-3 md:p-5">
        <span className="text-[10px] uppercase tracking-[0.22em] text-acento-dorado/80 md:text-xs">
          {regionLabel}
        </span>
        <span className="truncate pb-0.5 font-serif text-xl font-bold leading-snug text-texto-claro md:text-3xl">
          {nombre}
        </span>
        <span className="truncate text-xs text-stone-400 md:mt-0.5 md:text-base">
          {conteo}
          {proxima && <span className="text-stone-500"> · {proxima}</span>}
        </span>
      </span>
    </button>
  );
}
