"use client";

import { useEffect, useRef, useState } from "react";
import {
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
  motion,
  AnimatePresence,
} from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type {
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  GeoJSONSource,
} from "maplibre-gl";
import { Link } from "@/i18n/navigation";
import type { Recorrido } from "@/lib/data";

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
      attribution:
        "© <a href='https://carto.com/attributions'>CARTO</a> © <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
    },
  },
  layers: [{ id: "carto", type: "raster" as const, source: "carto" }],
};

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

export function PaseMapSection({ recorrido }: { recorrido: Recorrido }) {
  const { ruta, waypoints, centro, zoom } = recorrido;
  const t = useTranslations("home.recorrido");
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const dotMarkerRef = useRef<MapLibreMarker | null>(null);
  const waypointMarkersRef = useRef<HTMLDivElement[]>([]);
  const prevActiveIdxRef = useRef(-1);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [inView, setInView] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (raw) => {
    const p = Math.max(0, Math.min(1, (raw - 0.04) / 0.92));

    const map = mapRef.current;
    const source = map?.getSource("route-progress") as
      | GeoJSONSource
      | undefined;
    if (map && source) {
      const coords = getRouteAtProgress(ruta, p);
      if (coords.length >= 2) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: coords },
        });
      }
      const lastCoord = coords[coords.length - 1]!;
      dotMarkerRef.current?.setLngLat(lastCoord);

      waypoints.forEach((wp, i) => {
        const el = waypointMarkersRef.current[i];
        if (!el) return;
        if (p >= wp.progress) {
          el.style.background = "rgba(200,155,60,0.22)";
          el.style.borderColor = "#C89B3C";
          el.style.color = "#C89B3C";
          el.style.boxShadow = "0 0 14px rgba(200,155,60,0.5)";
        } else {
          el.style.background = "rgba(200,155,60,0.07)";
          el.style.borderColor = "rgba(200,155,60,0.22)";
          el.style.color = "rgba(200,155,60,0.38)";
          el.style.boxShadow = "none";
        }
      });
    }

    const newActiveIdx = waypoints.reduce(
      (acc, wp, i) => (p >= wp.progress ? i : acc),
      -1
    );
    if (newActiveIdx !== prevActiveIdxRef.current) {
      prevActiveIdxRef.current = newActiveIdx;
      setActiveIdx(newActiveIdx);
      if (newActiveIdx >= 0 && mapRef.current) {
        mapRef.current.flyTo({
          center: waypoints[newActiveIdx]!.coord,
          zoom: 15.1,
          duration: reducedMotion ? 0 : 1000,
        });
      }
    }
  });

  // Inicializar MapLibre solo cuando la sección se acerca al viewport —
  // evita descargar la librería y los tiles si el usuario nunca llega aquí.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!inView || !container) return;
    let map: MapLibreMap | undefined;
    let ro: ResizeObserver | undefined;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;

      // MapLibre lee offsetHeight al inicializar, antes del primer paint —
      // fijar la altura en px desde el wrapper (h-[45vh] / md:h-full) y
      // mantenerla sincronizada ante resize/rotación.
      const wrapper = container.parentElement;
      const syncHeight = () => {
        container.style.width = "100%";
        container.style.height = `${
          wrapper?.offsetHeight || window.innerHeight
        }px`;
      };
      syncHeight();

      map = new maplibregl.Map({
        container,
        style: TILE_STYLE,
        center: centro,
        zoom,
        interactive: false,
        attributionControl: { compact: true },
      });

      mapRef.current = map;
      ro = new ResizeObserver(() => {
        syncHeight();
        map?.resize();
      });
      if (wrapper) ro.observe(wrapper);

      const m = map;
      m.on("error", (e: unknown) => console.error("[MapLibre]", e));

      m.on("load", () => {
        m.resize();

        // Ghost full route (dashed)
        m.addSource("route-full", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: ruta },
          },
        });
        m.addLayer({
          id: "route-full-line",
          type: "line",
          source: "route-full",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#C89B3C",
            "line-width": 2,
            "line-opacity": 0.18,
            "line-dasharray": [2, 3],
          },
        });

        // Animated progress route
        m.addSource("route-progress", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [ruta[0]!],
            },
          },
        });
        m.addLayer({
          id: "route-progress-glow",
          type: "line",
          source: "route-progress",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#B8312F",
            "line-width": 20,
            "line-opacity": 0.18,
          },
        });
        m.addLayer({
          id: "route-progress-line",
          type: "line",
          source: "route-progress",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#B8312F",
            "line-width": 4,
            "line-opacity": 1,
          },
        });

        // Start pin (gold)
        const startEl = document.createElement("div");
        startEl.style.cssText =
          "width:12px;height:12px;border-radius:50%;background:#C89B3C;border:2px solid #fff;box-shadow:0 0 14px rgba(200,155,60,0.9)";
        new maplibregl.Marker({ element: startEl })
          .setLngLat(ruta[0]!)
          .addTo(m);

        // Animated head dot (red with pulse ring)
        const dotEl = document.createElement("div");
        dotEl.style.cssText =
          "width:16px;height:16px;border-radius:50%;background:#B8312F;border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 0 22px rgba(184,49,47,0.9);position:relative";
        const prefersReduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        const pulseRing = document.createElement("div");
        pulseRing.style.cssText =
          "position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(184,49,47,0.45)" +
          (prefersReduced ? "" : ";animation:pulse-ring 1.6s ease-out infinite");
        dotEl.appendChild(pulseRing);
        const dotMarker = new maplibregl.Marker({
          element: dotEl,
          anchor: "center",
        });
        dotMarker.setLngLat(ruta[0]!).addTo(m);
        dotMarkerRef.current = dotMarker;

        // Numbered waypoint pins
        waypoints.forEach((wp, i) => {
          const el = document.createElement("div");
          el.style.cssText = [
            "width:26px",
            "height:26px",
            "border-radius:50%",
            "background:rgba(200,155,60,0.07)",
            "border:1.5px solid rgba(200,155,60,0.22)",
            "color:rgba(200,155,60,0.38)",
            "display:flex",
            "align-items:center",
            "justify-content:center",
            "font-size:11px",
            "font-weight:700",
            "font-family:ui-sans-serif,system-ui,sans-serif",
            "transition:all 0.45s ease",
          ].join(";");
          el.textContent = String(i + 1);
          waypointMarkersRef.current[i] = el;
          new maplibregl.Marker({ element: el, anchor: "center" })
            .setLngLat(wp.coord)
            .addTo(m);
        });
      });
    })();

    return () => {
      ro?.disconnect();
      map?.remove();
    };
  }, [inView, ruta, waypoints, centro, zoom]);

  const activeWp = activeIdx >= 0 ? waypoints[activeIdx] : null;

  return (
    <section
      ref={containerRef}
      className="relative border-y border-borde-sutil"
      style={{ height: "320vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-fondo-oscuro flex flex-col md:flex-row">

        {/* ── MAP — left 55% ── */}
        <div className="relative h-[45vh] md:h-full md:w-[55%] flex-shrink-0">
          <div ref={mapContainerRef} className="absolute inset-0" />

          {/* Vignette: top fade on mobile, right fade on desktop */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-fondo-oscuro/80 via-transparent to-fondo-oscuro/35 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-fondo-oscuro/50" />

          {/* Section header */}
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 px-5 pt-6 md:px-7 md:pt-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-acento-dorado">
              {t("eyebrow")}
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-texto-claro md:text-3xl">
              {t("titulo")}
            </h2>
            <p className="mt-1 text-xs text-stone-500">{t("fecha")}</p>
          </div>
        </div>

        {/* ── PANEL NARRADOR — right 45% ── */}
        <div className="relative flex flex-col flex-1 overflow-hidden bg-fondo-oscuro md:border-l md:border-borde-sutil">

          {/* Character content */}
          <div className="relative flex-1 overflow-hidden min-h-0">
            <AnimatePresence mode="wait">
              {activeIdx === -1 ? (
                <motion.div
                  key="start"
                  className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -28 }}
                  transition={{ duration: reducedMotion ? 0.2 : 0.45 }}
                >
                  <div className="w-px h-10 bg-gradient-to-b from-transparent to-stone-700" />
                  <p className="text-stone-600 text-[10px] uppercase tracking-[0.28em]">
                    {t("scroll_hint")}
                  </p>
                  <p className="text-stone-700 font-serif text-sm leading-relaxed max-w-[260px]">
                    {waypoints.map((wp) => wp.calle).join(" → ")}
                  </p>
                  <div className="w-px h-8 bg-gradient-to-b from-stone-700 to-transparent" />
                </motion.div>
              ) : (
                <motion.div
                  key={activeIdx}
                  className="absolute inset-0 flex flex-col"
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 48 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -40 }}
                  transition={
                    reducedMotion
                      ? { duration: 0.2 }
                      : { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
                  }
                >
                  {activeWp && (
                    <>
                      {/* Main image */}
                      <div
                        className="relative overflow-hidden flex-shrink-0"
                        style={{ height: "42%" }}
                      >
                        <Image
                          src={activeWp.imagen}
                          alt={activeWp.alt}
                          fill
                          className="object-cover"
                          sizes="(min-width: 768px) 45vw, 100vw"
                          priority={activeIdx === 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-fondo-oscuro" />
                      </div>

                      {/* Text + extras */}
                      <div className="flex flex-col flex-1 min-h-0 px-6 pt-4 pb-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-acento-dorado">
                          {activeWp.calle}
                        </p>
                        <h3 className="mt-1 font-serif text-2xl md:text-[1.8rem] font-bold text-texto-claro leading-tight">
                          {activeWp.nombre}
                        </h3>
                        <blockquote className="mt-3 font-serif italic text-stone-400 text-sm md:text-[0.9rem] leading-relaxed border-l-2 border-acento-dorado/35 pl-3.5">
                          &ldquo;{activeWp.leyenda}&rdquo;
                        </blockquote>

                        {/* Extra images strip */}
                        {activeWp.imagenesExtra.length > 0 && (
                          <div className="mt-4 flex gap-2">
                            {activeWp.imagenesExtra.slice(0, 2).map((img, j) => (
                              <div
                                key={j}
                                className="relative rounded-lg overflow-hidden flex-shrink-0 border border-borde-sutil"
                                style={{ width: 80, height: 54 }}
                              >
                                <Image
                                  src={img}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-auto flex flex-wrap items-center gap-x-6">
                          <Link
                            href={{
                              pathname: "/personajes/[slug]",
                              params: { slug: activeWp.slug },
                            }}
                            className="inline-flex min-h-[44px] items-center gap-1.5 text-[11px] uppercase tracking-[0.3em] text-acento-dorado/80 hover:text-acento-dorado transition-colors duration-200"
                          >
                            {t("ver_ficha")}
                            <span aria-hidden="true">→</span>
                          </Link>
                          {activeIdx === waypoints.length - 1 && (
                            <Link
                              href="/calendario"
                              className="inline-flex min-h-[44px] items-center gap-1.5 text-[11px] uppercase tracking-[0.3em] text-stone-500 hover:text-texto-claro transition-colors duration-200"
                            >
                              {t("ver_calendario")}
                              <span aria-hidden="true">→</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Precarga invisible de la imagen del siguiente waypoint —
                evita el flash al activarse (misma URL optimizada que la visible) */}
            {waypoints[activeIdx + 1] && (
              <div
                className="pointer-events-none absolute inset-0 -z-10 opacity-0"
                aria-hidden="true"
              >
                <Image
                  src={waypoints[activeIdx + 1]!.imagen}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 45vw, 100vw"
                />
              </div>
            )}
          </div>

          {/* ── Timeline ── */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-borde-sutil">
            <div className="flex items-start">
              {waypoints.map((wp, i) => (
                <div key={i} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-500 ${
                        i <= activeIdx
                          ? "bg-acento-dorado border-acento-dorado shadow-[0_0_8px_rgba(200,155,60,0.65)]"
                          : "bg-transparent border-stone-700"
                      }`}
                    />
                    <p
                      className={`mt-1.5 text-[9px] uppercase tracking-wider text-center leading-tight transition-colors duration-500 ${
                        i <= activeIdx ? "text-acento-dorado/75" : "text-stone-700"
                      }`}
                      style={{ maxWidth: 50 }}
                    >
                      {wp.label}
                    </p>
                  </div>
                  {i < waypoints.length - 1 && (
                    <div className="flex-1 h-px bg-stone-800 mb-5 mx-1.5 overflow-hidden">
                      <div
                        className="h-full bg-acento-dorado/50 transition-all duration-700 ease-out"
                        style={{
                          width:
                            i < activeIdx
                              ? "100%"
                              : i === activeIdx
                                ? "50%"
                                : "0%",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
