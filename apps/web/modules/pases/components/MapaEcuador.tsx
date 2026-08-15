"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "framer-motion";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import type { ProvinciaConPases, Region } from "@/lib/services/provincias.service";
import { TILE_STYLE } from "@/lib/map/tile-style";
import { boundsFromFeatureCollection, boundsFromGeoJSON, type LngLatBoundsTuple } from "@/lib/map/bounds";
import provinciasGeoRaw from "@/lib/data/provincias.geo.json";

interface ProvinciaFeature {
  type: "Feature";
  properties: { slug: string; nombre: string; region: Region; centroide: [number, number] };
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}
const provinciasGeo = provinciasGeoRaw as unknown as {
  features: ProvinciaFeature[];
};

const ORDEN_REGIONES: Region[] = ["sierra", "costa", "amazonia", "insular"];

// Precalculado una sola vez al cargar el módulo — provincias.geo.json es estático.
const BOUNDS_POR_SLUG = new Map<string, LngLatBoundsTuple>();
const CENTROIDE_POR_SLUG = new Map<string, [number, number]>();
for (const f of provinciasGeo.features) {
  const b = boundsFromGeoJSON(f.geometry);
  if (b) BOUNDS_POR_SLUG.set(f.properties.slug, b);
  CENTROIDE_POR_SLUG.set(f.properties.slug, f.properties.centroide);
}
// Bounds nacional por defecto: solo continental — Galápagos (region "insular")
// queda fuera a propósito, si se incluyera el salto oceánico empequeñecería el
// continente. Hoy ninguna provincia insular tiene festividades cargadas.
const boundsContinentalCalculado = boundsFromFeatureCollection(
  provinciasGeo.features.filter((f) => f.properties.region !== "insular").map((f) => f.geometry)
);
if (!boundsContinentalCalculado) {
  throw new Error("No se pudo calcular el bounds continental — provincias.geo.json vacío o corrupto");
}
const BOUNDS_CONTINENTAL: LngLatBoundsTuple = boundsContinentalCalculado;

const COLOR_SELECCIONADA = "#B8312F"; // acento-rojo
const COLOR_CON_CONTENIDO = "#1F4D3F"; // acento-jade
const COLOR_ATENUADA = "#292524"; // stone-800

function marcadorProvincia(nombre: string, ariaLabel: string): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", ariaLabel);
  el.style.cssText = [
    "display:flex",
    "align-items:center",
    "gap:0.45rem",
    "background:transparent",
    "border:none",
    "padding:6px",
    "cursor:pointer",
    "min-height:44px",
  ].join(";");

  const dot = document.createElement("span");
  dot.style.cssText = [
    "width:14px",
    "height:14px",
    "border-radius:9999px",
    "background:#C89B3C",
    "box-shadow:0 0 0 4px rgba(200,155,60,0.25)",
    "flex-shrink:0",
    "transition:transform 150ms ease",
  ].join(";");
  dot.setAttribute("data-role", "dot");

  const label = document.createElement("span");
  label.textContent = nombre;
  label.style.cssText = [
    "white-space:nowrap",
    "font-size:11px",
    "font-weight:600",
    "color:#EFEAE0",
    "background:rgba(15,14,12,0.85)",
    "border:1px solid #2A2724",
    "border-radius:6px",
    "padding:2px 7px",
  ].join(";");

  el.appendChild(dot);
  el.appendChild(label);
  return el;
}

interface Props {
  provincias: ProvinciaConPases[];
  /** Slug de la provincia enfocada, o null para la vista completa del país. */
  provinciaActiva: string | null;
  onSelect: (slug: string) => void;
}

/**
 * Mapa nacional MapLibre con zoom real. Una sola instancia de mapa persiste
 * durante toda la vida de `/pases`: al enfocar una provincia se anima la
 * cámara (`fitBounds`) desde el extent nacional al de la provincia — no se
 * desmonta ni se reemplaza por otro mapa. Las provincias con festividades se
 * pintan (jade) y llevan un marcador HTML accesible con el nombre siempre
 * visible; el resto del territorio queda atenuado y sin ningún elemento
 * interactivo asociado.
 */
export function MapaEcuador({ provincias, provinciaActiva, onSelect }: Props) {
  const t = useTranslations("pases.mapa");
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, MapLibreMarker>>(new Map());
  const prevSeleccionadaRef = useRef<string | null>(null);
  const initialCameraAppliedRef = useRef(false);
  // Los efectos de abajo leen `mapRef.current`, pero el mapa se crea de forma
  // async (import dinámico de maplibre-gl) — sin este estado, los efectos que
  // dependen de `provincias`/`provinciaActiva` correrían en el mount inicial
  // ANTES de que `mapRef.current` exista y nunca se re-ejecutarían solos.
  const [mapReady, setMapReady] = useState(false);

  const zoomed = provinciaActiva != null;
  const conContenidoSlugs = useMemo(() => new Set(provincias.map((p) => p.slug)), [provincias]);
  const provinciaPorSlug = useMemo(() => new Map(provincias.map((p) => [p.slug, p])), [provincias]);

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

  // ── Init del mapa (una sola vez) ────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let map: MapLibreMap | undefined;
    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled) return;

      map = new maplibregl.Map({
        container,
        style: TILE_STYLE,
        bounds: BOUNDS_CONTINENTAL,
        fitBoundsOptions: { padding: 32, duration: 0 },
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      const m = map;
      m.on("error", (e: unknown) => console.error("[MapLibre]", e));

      m.on("load", () => {
        m.addSource("provincias", {
          type: "geojson",
          data: provinciasGeoRaw as GeoJSON.FeatureCollection,
          promoteId: "slug",
        });

        m.addLayer({
          id: "provincias-fill",
          type: "fill",
          source: "provincias",
          paint: {
            "fill-color": [
              "case",
              ["boolean", ["feature-state", "seleccionada"], false],
              COLOR_SELECCIONADA,
              ["boolean", ["feature-state", "conContenido"], false],
              COLOR_CON_CONTENIDO,
              COLOR_ATENUADA,
            ],
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "conContenido"], false],
              0.82,
              0.32,
            ],
          },
        });

        m.addLayer({
          id: "provincias-line",
          type: "line",
          source: "provincias",
          paint: {
            "line-color": [
              "case",
              ["boolean", ["feature-state", "seleccionada"], false],
              COLOR_SELECCIONADA,
              ["boolean", ["feature-state", "conContenido"], false],
              "#C89B3C",
              "#44403c",
            ],
            "line-width": [
              "case",
              ["boolean", ["feature-state", "conContenido"], false],
              1.4,
              0.8,
            ],
            "line-opacity": 0.9,
          },
        });

        // `feature-state` no se puede fijar hasta que la fuente termine de
        // procesar sus datos — `idle` es la señal segura (dispara una sola
        // vez tras el primer render completo del estilo).
        m.once("idle", () => {
          for (const slug of conContenidoSlugs) {
            m.setFeatureState({ source: "provincias", id: slug }, { conContenido: true });
          }
          setMapReady(true);
        });
      });
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      map?.remove();
      mapRef.current = null;
      initialCameraAppliedRef.current = false;
      setMapReady(false);
    };
    // Solo se inicializa una vez — provincias/onSelect se leen vía refs/closures actualizados abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Marcadores accesibles (uno por provincia con contenido) ─────────────
  // Depende de `mapReady`, no solo de `provincias`: el mapa se crea de forma
  // async, así que este efecto debe poder re-correr en cuanto el mapa exista,
  // no solo cuando cambie la lista de provincias (que en la práctica es
  // estable durante toda la vida de la página).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    let cancelled = false;
    void import("maplibre-gl").then(({ Marker }) => {
      if (cancelled) return;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      for (const provincia of provincias) {
        const centroide = CENTROIDE_POR_SLUG.get(provincia.slug);
        if (!centroide) continue;
        const el = marcadorProvincia(
          provincia.nombre,
          `${provincia.nombre} — ${t("pases_count", { count: provincia.pases.length })}`
        );
        el.addEventListener("click", () => onSelect(provincia.slug));
        el.addEventListener("mouseenter", () => setHover(provincia.slug));
        el.addEventListener("mouseleave", () => setHover(null));
        el.addEventListener("focus", () => setHover(provincia.slug));
        el.addEventListener("blur", () => setHover(null));
        const marker = new Marker({ element: el, anchor: "left" }).setLngLat(centroide).addTo(map);
        marker.getElement().style.display = provinciaActiva ? "none" : "";
        markersRef.current.set(provincia.slug, marker);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provincias, mapReady]);

  // ── Estado visual + cámara al cambiar de provincia ──────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const prev = prevSeleccionadaRef.current;
    if (prev && prev !== provinciaActiva) {
      map.setFeatureState({ source: "provincias", id: prev }, { seleccionada: false });
    }
    if (provinciaActiva) {
      map.setFeatureState({ source: "provincias", id: provinciaActiva }, { seleccionada: true });
    }
    prevSeleccionadaRef.current = provinciaActiva;

    // El primer disparo de este efecto llega apenas `mapReady` pasa a true con
    // `provinciaActiva` todavía en null — el constructor del mapa ya encuadró
    // el extent nacional (`bounds: BOUNDS_CONTINENTAL`), así que animar de
    // nuevo a lo mismo sería un parpadeo gratuito. Solo se anima cuando hay
    // un cambio real de provincia.
    const esPrimerDisparo = !initialCameraAppliedRef.current;
    initialCameraAppliedRef.current = true;
    const bounds = provinciaActiva ? BOUNDS_POR_SLUG.get(provinciaActiva) : BOUNDS_CONTINENTAL;
    if (bounds && !(esPrimerDisparo && !provinciaActiva)) {
      map.fitBounds(bounds, {
        padding: provinciaActiva ? 56 : 32,
        maxZoom: 10,
        duration: reduced ? 0 : 900,
      });
    }

    // Los marcadores solo se ven en vista país — enfocada la provincia, el
    // encabezado que va debajo ya la identifica.
    markersRef.current.forEach((marker) => {
      marker.getElement().style.display = provinciaActiva ? "none" : "";
    });
  }, [provinciaActiva, reduced, mapReady]);

  // Hover/focus (solo vista país): mismo tratamiento visual que "seleccionada".
  useEffect(() => {
    const map = mapRef.current;
    if (!map || zoomed || !mapReady) return;
    if (hover) map.setFeatureState({ source: "provincias", id: hover }, { seleccionada: true });
    return () => {
      if (hover) map.setFeatureState({ source: "provincias", id: hover }, { seleccionada: false });
    };
  }, [hover, zoomed, mapReady]);

  const provinciaActivaNombre = provinciaActiva
    ? provinciaPorSlug.get(provinciaActiva)?.nombre
    : undefined;

  return (
    <div className={zoomed ? "" : "grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12"}>
      {/* ── Mapa ── */}
      <div className={zoomed ? "relative w-full" : "relative mx-auto w-full max-w-[24rem] lg:max-w-[30rem]"}>
        <div
          className="relative w-full overflow-hidden transition-[padding-bottom] duration-700 ease-out"
          style={{ paddingBottom: zoomed ? "52%" : "112%" }}
          role={zoomed ? "img" : undefined}
          aria-label={zoomed ? provinciaActivaNombre : t("mapa_alt")}
        >
          <div ref={containerRef} className="absolute inset-0" />
        </div>

        {!zoomed && (
          <p className="mt-3 text-center text-[11px] text-stone-600 lg:text-left">{t("atribucion")}</p>
        )}
      </div>

      {/* ── Índice de provincias: la otra mitad del control, no un respaldo.
          Desaparece al hacer zoom — las secciones de la provincia ocupan ese
          espacio. También es la vía de navegación accesible por teclado. ── */}
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
