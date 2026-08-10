"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import type { ProvinciaConPases, Region } from "@/lib/services/provincias.service";
import geo from "@/lib/data/provincias-geo.json";

const [VB_W, VB_H] = geo.viewBox.split(" ").slice(2).map(Number) as [number, number];
const ORDEN_REGIONES: Region[] = ["sierra", "costa", "amazonia", "insular"];

// Aspecto retrato (todo el país) vs. banner apaisado (una provincia enfocada),
// expresado como padding-bottom % — más confiable de animar con framer-motion
// que alternar la utilidad `aspect-*` de Tailwind.
const ASPECT_PAIS = `${(VB_H / VB_W) * 100}%`;
const ASPECT_ZOOM = "52%";

interface Bbox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function bboxFromPath(d: string): Bbox {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < nums.length; i += 2) {
    const x = nums[i]!, y = nums[i + 1]!;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

// Se calcula una sola vez al cargar el módulo — provincias-geo.json es estático.
const BBOXES = new Map(geo.provincias.map((p) => [p.slug, bboxFromPath(p.path)]));

function transformPara(bbox: Bbox, padding = 70) {
  const w = Math.max(bbox.maxX - bbox.minX, 1);
  const h = Math.max(bbox.maxY - bbox.minY, 1);
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;
  const scale = Math.min((VB_W - padding * 2) / w, (VB_H - padding * 2) / h, 7);
  return { x: VB_W / 2 - cx * scale, y: VB_H / 2 - cy * scale, scale };
}

interface Props {
  provincias: ProvinciaConPases[];
  /** Slug de la provincia enfocada, o null para la vista completa del país. */
  provinciaActiva: string | null;
  onSelect: (slug: string) => void;
}

/**
 * Mapa nacional con zoom real. En vista país el SVG es solo la pieza visual
 * (`aria-hidden`); la superficie interactiva son botones HTML reales encima —
 * así el teclado, el foco y el lector de pantalla funcionan sin reimplementar
 * nada, y el área de toque no depende del tamaño del polígono (Chimborazo mide
 * ~25 px a escala nacional). Al enfocar una provincia el mismo SVG se anima con
 * un `motion.g` (x/y/scale) hasta encuadrarla — no se desmonta ni se reemplaza
 * por otro mapa — y los marcadores se ocultan (ya no hace falta clicar nada ahí:
 * la provincia enfocada es evidente por el encabezado que va debajo).
 */
export function MapaEcuador({ provincias, provinciaActiva, onSelect }: Props) {
  const t = useTranslations("pases.mapa");
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);

  const activas = new Map(provincias.map((p) => [p.slug, p]));
  const [ix, iy, iw, ih] = geo.insetRect;
  const zoomed = provinciaActiva != null;

  const transform = useMemo(() => {
    if (!provinciaActiva) return { x: 0, y: 0, scale: 1 };
    const bbox = BBOXES.get(provinciaActiva);
    return bbox ? transformPara(bbox) : { x: 0, y: 0, scale: 1 };
  }, [provinciaActiva]);

  const regionLabel: Record<Region, string> = {
    sierra: t("region.sierra"),
    costa: t("region.costa"),
    amazonia: t("region.amazonia"),
    insular: t("region.insular"),
  };

  const porRegion = ORDEN_REGIONES.map((region) => ({
    region,
    provincias: provincias.filter((p) => p.region === region),
  })).filter((g) => g.provincias.length > 0);

  const provinciaActivaNombre = provinciaActiva ? activas.get(provinciaActiva)?.nombre : undefined;

  return (
    <div className={zoomed ? "" : "grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12"}>
      {/* ── Mapa ── */}
      {/* El alto lo fija el aspecto (vía padding-bottom animado), así que en vista
          país se acota el ancho — sin tope, en escritorio pasaría de 1000px de alto. */}
      <div className={zoomed ? "relative w-full" : "relative mx-auto w-full max-w-[24rem] lg:max-w-[30rem]"}>
        <motion.div
          className="relative w-full overflow-hidden"
          animate={{ paddingBottom: zoomed ? ASPECT_ZOOM : ASPECT_PAIS }}
          transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 0.61, 0.36, 1] }}
          role={zoomed ? "img" : undefined}
          aria-label={zoomed ? provinciaActivaNombre : undefined}
        >
          {/* preserveAspectRatio="slice": cuando el contenedor cambia a la
              proporción apaisada del zoom, el SVG debe RECORTAR (cover) en vez
              de encajar con barras — si no, el zoom del `motion.g` no tiene
              nada que recortar y el país entero se ve más chato, no más cerca. */}
          <svg
            viewBox={geo.viewBox}
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            aria-hidden={zoomed ? undefined : "true"}
          >
            <motion.g
              animate={transform}
              transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 0.61, 0.36, 1] }}
              style={{ transformOrigin: "0px 0px" }}
            >
              {/* Recuadro de Galápagos: va aparte porque en su posición real
                  dejaría el continente diminuto. Se oculta al hacer zoom
                  (queda casi siempre fuera de cuadro). */}
              {!zoomed && (
                <rect
                  x={ix}
                  y={iy}
                  width={iw}
                  height={ih}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeDasharray="6 5"
                  className="text-borde-sutil"
                  vectorEffect="non-scaling-stroke"
                />
              )}

              {geo.provincias.map((p) => {
                const activa = activas.has(p.slug);
                const esLaActiva = p.slug === provinciaActiva;
                const enfocada = !zoomed && hover === p.slug;
                return (
                  <path
                    key={p.slug}
                    d={p.path}
                    vectorEffect="non-scaling-stroke"
                    className={
                      esLaActiva || enfocada
                        ? "fill-acento-rojo/90 stroke-acento-dorado"
                        : activa
                          ? "fill-acento-jade stroke-acento-dorado"
                          : "fill-stone-800/40 stroke-stone-700/50"
                    }
                    strokeWidth={activa ? 1.6 : 1}
                    style={{ transition: reduced ? undefined : "fill 220ms ease" }}
                  />
                );
              })}
            </motion.g>
          </svg>

          {/* Superficie interactiva: un botón por provincia con calendario.
              Solo en vista país — al hacer zoom la provincia ya es evidente
              por el encabezado que sigue debajo. */}
          {!zoomed &&
            provincias.map((p) => {
              const figura = geo.provincias.find((g) => g.slug === p.slug);
              if (!figura) return null;
              const cx = figura.centroide[0] ?? 0;
              const cy = figura.centroide[1] ?? 0;
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => onSelect(p.slug)}
                  onMouseEnter={() => setHover(p.slug)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(p.slug)}
                  onBlur={() => setHover(null)}
                  aria-label={`${p.nombre} — ${t("pases_count", { count: p.pases.length })}`}
                  className="group absolute flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70"
                  style={{ left: `${(cx / VB_W) * 100}%`, top: `${(cy / VB_H) * 100}%` }}
                >
                  <span className="absolute h-4 w-4 rounded-full bg-acento-dorado shadow-[0_0_0_4px_rgba(200,155,60,0.25)] transition-transform group-hover:scale-125 group-focus-visible:scale-125" />
                  <span className="pointer-events-none absolute top-1/2 left-[calc(50%+0.9rem)] hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-borde-sutil bg-fondo-oscuro/95 px-2 py-1 text-xs font-medium text-texto-claro group-hover:block group-focus-visible:block">
                    {p.nombre}
                  </span>
                </button>
              );
            })}
        </motion.div>

        {!zoomed && (
          <p className="mt-3 text-center text-[11px] text-stone-600 lg:text-left">{t("atribucion")}</p>
        )}
      </div>

      {/* ── Índice de provincias: la otra mitad del control, no un respaldo.
          Desaparece al hacer zoom — las secciones de la provincia ocupan ese
          espacio. ── */}
      {!zoomed && (
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-acento-dorado">
            {t("elige_provincia")}
          </p>
          <p className="mt-2 text-sm text-stone-500">
            {t("provincias_con_pases", { count: provincias.length })}
          </p>

          <div className="mt-6 space-y-6">
            {porRegion.map(({ region, provincias: lista }) => (
              <div key={region}>
                <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-stone-600">
                  {regionLabel[region]}
                </p>
                <ul className="space-y-2">
                  {lista.map((p) => (
                    <li key={p.slug}>
                      <button
                        type="button"
                        onClick={() => onSelect(p.slug)}
                        onMouseEnter={() => setHover(p.slug)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(p.slug)}
                        onBlur={() => setHover(null)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-borde-sutil px-4 py-3 text-left transition-colors hover:border-acento-dorado hover:bg-acento-dorado/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70"
                      >
                        <span className="font-medium text-texto-claro">{p.nombre}</span>
                        <span className="shrink-0 text-xs text-stone-500">
                          {t("pases_count", { count: p.pases.length })}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
