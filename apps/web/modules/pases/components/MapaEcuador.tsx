"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "framer-motion";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { ProvinciaConPases } from "@/lib/services/provincias.service";
import { TILE_STYLE } from "@/lib/map/tile-style";
import {
  boundsFromFeatureCollection,
  boundsFromGeoJSON,
  boundsFromLineas,
  type LngLatBoundsTuple,
} from "@/lib/map/bounds";
import provinciasGeoRaw from "@/lib/data/provincias.geo.json";

interface ProvinciaFeature {
  type: "Feature";
  properties: {
    slug: string;
    nombre: string;
    region: string;
    centroide: [number, number];
  };
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}
const provinciasGeo = provinciasGeoRaw as unknown as {
  features: ProvinciaFeature[];
};

// Precalculado una sola vez al cargar el módulo — provincias.geo.json es estático.
const BOUNDS_POR_SLUG = new Map<string, LngLatBoundsTuple>();
const CENTROIDE_POR_SLUG = new Map<string, [number, number]>();
for (const f of provinciasGeo.features) {
  const b = boundsFromGeoJSON(f.geometry);
  if (b) BOUNDS_POR_SLUG.set(f.properties.slug, b);
  CENTROIDE_POR_SLUG.set(f.properties.slug, f.properties.centroide);
}
// Respaldo del encuadre de país (ver `boundsDePais`): solo continental. Si
// Galápagos llega a tener pases, tratarlo como caso especial — el salto
// oceánico empequeñecería el continente.
const boundsContinentalCalculado = boundsFromFeatureCollection(
  provinciasGeo.features
    .filter((f) => f.properties.region !== "insular")
    .map((f) => f.geometry),
);
if (!boundsContinentalCalculado) {
  throw new Error(
    "No se pudo calcular el bounds continental — provincias.geo.json vacío o corrupto",
  );
}
const BOUNDS_CONTINENTAL: LngLatBoundsTuple = boundsContinentalCalculado;

const COLOR_PROVINCIA = "#1F4D3F"; // acento-jade
const PADDING_PAIS = 40;

export interface RutaMapa {
  slug: string;
  color: string;
  coords: [number, number][];
}

interface Camara {
  bounds: LngLatBoundsTuple;
  padding:
    | number
    | { top: number; bottom: number; left: number; right: number };
  maxZoom: number;
}

// Mismo encuadre que usa `RecorridoScrollytelling` para su ruta: al entrar a
// un pase este mapa termina exactamente donde empieza el del recorrido.
const PADDING_RECORRIDO = { top: 96, bottom: 56, left: 48, right: 48 };

/** Encuadre de la vista país: las provincias con pases, no el país entero. */
function boundsDePais(provincias: ProvinciaConPases[]): LngLatBoundsTuple {
  const slugs = new Set(provincias.map((p) => p.slug));
  return (
    boundsFromFeatureCollection(
      provinciasGeo.features
        .filter((f) => slugs.has(f.properties.slug))
        .map((f) => f.geometry),
    ) ?? BOUNDS_CONTINENTAL
  );
}

interface Props {
  provincias: ProvinciaConPases[];
  /** Slug de la provincia enfocada, o null para la vista completa del país. */
  provinciaActiva: string | null;
  /** Rutas trazadas de la provincia enfocada (vacío en vista país). */
  rutas: RutaMapa[];
  /** Ruta resaltada (la tarjeta de pase bajo el puntero), o null. */
  rutaDestacada: string | null;
  /** Pase al que se está entrando: la cámara se cierra sobre su ruta. */
  rutaEnfocada: string | null;
}

/**
 * Mapa de `/pases`: una sola instancia MapLibre que llena su contenedor y no
 * se puede mover (`interactive: false`) — la cámara solo la mueve la app.
 * La vista país ya no es un mapa (es el índice de tarjetas, que lo tapa): este
 * mapa arranca encuadrado en las provincias con pases solo como punto de
 * partida del zoom. Al enfocar una provincia vuela (`fitBounds`) a sus rutas
 * trazadas — la ciudad donde ocurren los pases — o a la provincia entera si
 * aún no tiene ninguna; el relleno se aclara para dejar ver las calles.
 */
export function MapaEcuador({
  provincias,
  provinciaActiva,
  rutas,
  rutaDestacada,
  rutaEnfocada,
}: Props) {
  const t = useTranslations("pases.mapa");
  const reduced = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const prevEnfocadaRef = useRef<string | null>(null);
  const boundsPais = useMemo(() => boundsDePais(provincias), [provincias]);
  const camaraRef = useRef<Camara>({
    bounds: boundsPais,
    padding: PADDING_PAIS,
    maxZoom: 10,
  });
  const camaraInicialRef = useRef(false);
  // El mapa se crea de forma async (import dinámico de maplibre-gl): los
  // efectos que lo usan dependen de este estado para re-correr cuando exista.
  const [mapReady, setMapReady] = useState(false);

  // ── Init del mapa (una sola vez) ────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let map: MapLibreMap | undefined;
    let cancelled = false;
    let ro: ResizeObserver | undefined;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled) return;

      map = new maplibregl.Map({
        container,
        style: TILE_STYLE,
        bounds: boundsPais,
        fitBoundsOptions: { padding: PADDING_PAIS, duration: 0 },
        interactive: false,
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      const m = map;
      m.on("error", (e: unknown) => console.error("[MapLibre]", e));

      // El contenedor cambia de tamaño (rotación, resize) y pasa por
      // `display:none` mientras se recorre un pase: al volver hay que
      // re-medir y re-encuadrar, o el canvas queda con el tamaño viejo.
      ro = new ResizeObserver(() => {
        if (container.clientWidth === 0 || container.clientHeight === 0) return;
        m.resize();
        const c = camaraRef.current;
        m.fitBounds(c.bounds, {
          padding: c.padding,
          maxZoom: c.maxZoom,
          duration: 0,
        });
      });
      ro.observe(container);

      m.on("load", () => {
        // La atribución compacta nace desplegada y MapLibre la pliega al primer
        // arrastre — que aquí nunca llega (`interactive: false`). Se pliega a
        // mano; sigue a un toque en su botón ⓘ.
        container
          .querySelector(".maplibregl-ctrl-attrib")
          ?.classList.remove("maplibregl-compact-show");

        // Solo las provincias con pases: el resto del país no se dibuja.
        const conPases: maplibregl.FilterSpecification = [
          "in",
          ["get", "slug"],
          ["literal", provincias.map((p) => p.slug)],
        ];

        m.addSource("provincias", {
          type: "geojson",
          data: provinciasGeoRaw as GeoJSON.FeatureCollection,
          promoteId: "slug",
        });

        m.addLayer({
          id: "provincias-fill",
          type: "fill",
          source: "provincias",
          filter: conPases,
          paint: {
            "fill-color": COLOR_PROVINCIA,
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "enfocada"], false],
              0.08,
              0.82,
            ],
          },
        });

        m.addLayer({
          id: "provincias-line",
          type: "line",
          source: "provincias",
          filter: conPases,
          paint: {
            "line-color": "#C89B3C",
            "line-width": 1.4,
            "line-opacity": 0.9,
          },
        });

        m.addSource("rutas", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        m.addLayer({
          id: "rutas-line",
          type: "line",
          source: "rutas",
          filter: ["==", ["geometry-type"], "LineString"],
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": ["get", "color"],
            "line-width": 4,
            "line-opacity": 0.95,
          },
        });
        m.addLayer({
          id: "rutas-inicio",
          type: "circle",
          source: "rutas",
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-radius": 6,
            "circle-color": ["get", "color"],
            "circle-stroke-color": "#0F0E0C",
            "circle-stroke-width": 2,
          },
        });

        // `feature-state` y `setData` solo son seguros cuando la fuente terminó
        // de procesar sus datos — `idle` es la señal.
        m.once("idle", () => setMapReady(true));
      });
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      map?.remove();
      mapRef.current = null;
      camaraInicialRef.current = false;
      setMapReady(false);
    };
    // Solo se inicializa una vez — la lista de provincias es estática (SSG).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Provincia enfocada: estado visual, rutas y cámara ───────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const prev = prevEnfocadaRef.current;
    if (prev && prev !== provinciaActiva) {
      map.setFeatureState(
        { source: "provincias", id: prev },
        { enfocada: false },
      );
    }
    if (provinciaActiva) {
      map.setFeatureState(
        { source: "provincias", id: provinciaActiva },
        { enfocada: true },
      );
    }
    prevEnfocadaRef.current = provinciaActiva;

    (map.getSource("rutas") as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: rutas.flatMap((r): GeoJSON.Feature[] => [
        {
          type: "Feature",
          properties: { slug: r.slug, color: r.color },
          geometry: { type: "LineString", coordinates: r.coords },
        },
        {
          type: "Feature",
          properties: { slug: r.slug, color: r.color },
          geometry: { type: "Point", coordinates: r.coords[0]! },
        },
      ]),
    });

    const enfocada = rutaEnfocada
      ? rutas.find((r) => r.slug === rutaEnfocada)
      : undefined;
    const boundsEnfocada = enfocada
      ? boundsFromLineas([enfocada.coords])
      : null;
    const boundsRutas = provinciaActiva
      ? boundsFromLineas(rutas.map((r) => r.coords))
      : null;
    const camara: Camara = boundsEnfocada
      ? { bounds: boundsEnfocada, padding: PADDING_RECORRIDO, maxZoom: 22 }
      : boundsRutas
        ? { bounds: boundsRutas, padding: 64, maxZoom: 15 }
        : provinciaActiva
          ? {
              bounds: BOUNDS_POR_SLUG.get(provinciaActiva) ?? boundsPais,
              padding: 48,
              maxZoom: 10,
            }
          : { bounds: boundsPais, padding: PADDING_PAIS, maxZoom: 10 };
    camaraRef.current = camara;

    // El constructor ya encuadró el país: no re-animar a lo mismo al montar.
    const esPrimerDisparo = !camaraInicialRef.current;
    camaraInicialRef.current = true;
    if (!(esPrimerDisparo && !provinciaActiva)) {
      map.fitBounds(camara.bounds, {
        padding: camara.padding,
        maxZoom: camara.maxZoom,
        duration: reduced ? 0 : rutaEnfocada ? 750 : 1100,
      });
    }
  }, [provinciaActiva, rutas, rutaEnfocada, boundsPais, reduced, mapReady]);

  // ── Ruta resaltada desde la lista de pases ──────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const es = ["==", ["get", "slug"], rutaDestacada ?? ""];
    map.setPaintProperty("rutas-line", "line-width", ["case", es, 7, 4]);
    map.setPaintProperty(
      "rutas-line",
      "line-opacity",
      rutaDestacada ? ["case", es, 1, 0.35] : 0.95,
    );
  }, [rutaDestacada, mapReady]);

  return (
    <div
      className="relative h-full w-full"
      role="img"
      aria-label={t("mapa_alt")}
    >
      {/* style inline (no className) — el CSS de maplibre-gl fuerza
          `.maplibregl-map { position: relative }` sobre este contenedor y le
          gana a la clase `absolute` de Tailwind por orden de carga. Con
          `position` inline el `inset-0` no se pierde; sin esto el mapa cae al
          canvas por defecto de MapLibre (480×300). */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
