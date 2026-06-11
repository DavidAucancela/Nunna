"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useMotionValueEvent, motion, AnimatePresence, type MotionStyle } from "framer-motion";
import Image from "next/image";

const TILE_STYLE = {
  version: 8 as const,
  name: "CARTO Dark Matter",
  sources: {
    carto: {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© <a href='https://carto.com/attributions'>CARTO</a> © <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
    },
  },
  layers: [
    {
      id: "carto",
      type: "raster" as const,
      source: "carto",
    },
  ],
};

// Ruta: Instituto Tecnológico Riobamba
// Carlos Zambrano → Av. Daniel León Borja → 10 de Agosto → Iglesia La Catedral
const ROUTE_COORDS: [number, number][] = [
  [-78.6460, -1.6668],
  [-78.6478, -1.6670],
  [-78.6495, -1.6670],
  [-78.6510, -1.6671],
  [-78.6522, -1.6670],
  [-78.6535, -1.6669],
  [-78.6545, -1.6668],
  [-78.6545, -1.6661],
  [-78.6545, -1.6654],
  [-78.6544, -1.6646],
  [-78.6544, -1.6638],
];

interface Waypoint {
  progress: number;
  coord: [number, number];
  image: string;
  alt: string;
  nombre: string;
  calle: string;
  cardStyle: MotionStyle;
}

const WAYPOINTS: Waypoint[] = [
  {
    progress: 0.08,
    coord: [-78.6460, -1.6668],
    image: "/personajes/aya-uma/en-pase.webp",
    alt: "Aya Uma en el pase",
    nombre: "Aya Uma",
    calle: "Carlos Zambrano",
    cardStyle: { top: "22%", left: "4%" },
  },
  {
    progress: 0.35,
    coord: [-78.6510, -1.6671],
    image: "/personajes/diablos-de-lata/en-pase.jpg",
    alt: "Diablos de lata en el pase",
    nombre: "Diablos de lata",
    calle: "Av. Daniel León Borja",
    cardStyle: { bottom: "20%", left: "6%" },
  },
  {
    progress: 0.62,
    coord: [-78.6545, -1.6661],
    image: "/personajes/payaso/en-pase.jpeg",
    alt: "Payaso en el pase",
    nombre: "Payaso",
    calle: "10 de Agosto",
    cardStyle: { top: "22%", right: "4%" },
  },
  {
    progress: 0.88,
    coord: [-78.6544, -1.6638],
    image: "/personajes/perro/en-pase.webp",
    alt: "Perro Allku en el pase",
    nombre: "Perro · Allku",
    calle: "Iglesia La Catedral",
    cardStyle: { bottom: "20%", right: "6%" },
  },
];

function getRouteAtProgress(
  coords: [number, number][],
  progress: number
): [number, number][] {
  if (progress <= 0) return [coords[0]!];
  if (progress >= 1) return coords;
  const total = coords.length - 1;
  const at = progress * total;
  const idx = Math.floor(at);
  const t = at - idx;
  const result = coords.slice(0, idx + 1) as [number, number][];
  if (idx < total) {
    const a = coords[idx]!;
    const b = coords[idx + 1]!;
    result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return result;
}

export function PaseMapSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [progress, setProgress] = useState(0);
  const [shown, setShown] = useState<Set<number>>(new Set());

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (raw) => {
    const p = Math.max(0, Math.min(1, (raw - 0.04) / 0.92));
    setProgress(p);

    const map = mapRef.current;
    if (map?.getSource?.("route-progress")) {
      const coords = getRouteAtProgress(ROUTE_COORDS, p);
      if (coords.length >= 2) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (map.getSource("route-progress") as any).setData({
          type: "Feature",
          geometry: { type: "LineString", coordinates: coords },
        });
      }
    }

    setShown((prev) => {
      const next = new Set(prev);
      WAYPOINTS.forEach((wp, i) => { if (p >= wp.progress) next.add(i); });
      return next;
    });
  });

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;
    let ro: ResizeObserver | undefined;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;

      // Forzar dimensiones antes de crear el mapa — MapLibre lee offsetHeight al init
      container.style.width = "100%";
      container.style.height = "100vh";

      map = new maplibregl.Map({
        container,
        style: TILE_STYLE,
        center: [-78.6502, -1.6657],
        zoom: 14.6,
        interactive: false,
        attributionControl: false,
      });

      mapRef.current = map;

      // ResizeObserver: re-ajusta el mapa si el contenedor cambia de tamaño
      ro = new ResizeObserver(() => map?.resize());
      ro.observe(container);

      map.on("error", (e: unknown) => console.error("[MapLibre]", e));

      map.on("load", () => {
        map.resize();
        // Ruta fantasma (guía)
        map.addSource("route-full", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: ROUTE_COORDS },
          },
        });
        map.addLayer({
          id: "route-full-line",
          type: "line",
          source: "route-full",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#C89B3C",
            "line-width": 2.5,
            "line-opacity": 0.2,
            "line-dasharray": [2, 3],
          },
        });

        // Ruta animada
        map.addSource("route-progress", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: [ROUTE_COORDS[0]!] },
          },
        });
        map.addLayer({
          id: "route-progress-glow",
          type: "line",
          source: "route-progress",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#B8312F",
            "line-width": 12,
            "line-opacity": 0.15,
          },
        });
        map.addLayer({
          id: "route-progress-line",
          type: "line",
          source: "route-progress",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#B8312F",
            "line-width": 3.5,
            "line-opacity": 1,
          },
        });

        // Pin de inicio
        const startEl = document.createElement("div");
        startEl.style.cssText = [
          "width:12px", "height:12px", "border-radius:50%",
          "background:#C89B3C", "border:2px solid #fff",
          "box-shadow:0 0 14px rgba(200,155,60,0.9)",
        ].join(";");
        new maplibregl.Marker({ element: startEl })
          .setLngLat(ROUTE_COORDS[0]!)
          .addTo(map);
      });
    })();

    return () => { ro?.disconnect(); map?.remove(); };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative border-y border-borde-sutil"
      style={{ height: "280vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-fondo-oscuro">

        {/* Mapa */}
        <div ref={mapContainerRef} className="absolute inset-0" />

        {/* Viñetas superior e inferior */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-fondo-oscuro/85 via-transparent to-fondo-oscuro/75" />

        {/* Encabezado */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 px-6 pt-16 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-acento-dorado">
            El recorrido
          </p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-texto-claro md:text-4xl">
            Un pase, un camino
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Instituto Tecnológico Riobamba · 20 de diciembre
          </p>
        </div>

        {/* Cards de personajes */}
        {WAYPOINTS.map((wp, i) => (
          <AnimatePresence key={i}>
            {shown.has(i) && (
              <motion.div
                className="absolute z-20 w-36 overflow-hidden rounded-xl border border-acento-dorado/30 shadow-2xl sm:w-44"
                style={wp.cardStyle}
                initial={{ opacity: 0, scale: 0.82, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={wp.image}
                    alt={wp.alt}
                    fill
                    className="object-cover"
                    sizes="176px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-fondo-oscuro/70 to-transparent" />
                </div>
                <div className="bg-fondo-oscuro/95 px-3 py-2">
                  <p className="text-[9px] font-medium uppercase tracking-widest text-acento-dorado">
                    {wp.calle}
                  </p>
                  <p className="mt-0.5 text-sm font-bold leading-tight text-texto-claro">
                    {wp.nombre}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}

        {/* Barra de progreso + indicador de scroll */}
        <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-center">
          <div className="mx-auto h-px w-32 overflow-hidden rounded-full bg-stone-800">
            <div
              className="h-full bg-acento-dorado/60 transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="mt-2 text-[9px] uppercase tracking-[0.25em] text-stone-700">
            {progress < 0.05 ? "Sigue el pase ↓" : progress >= 0.98 ? "Llegamos ✦" : "Recorriendo…"}
          </p>
        </div>
      </div>
    </section>
  );
}
