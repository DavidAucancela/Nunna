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
import type { Recorridos } from "@/lib/data";
import type { PaseListItem } from "@seres-del-pase/types";

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

// Pasado este progreso (tras el último waypoint) se muestra el panel de cierre.
const FINALE_THRESHOLD = 0.97;

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

function stylePin(el: HTMLDivElement, active: boolean) {
  if (active) {
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
}

export function PaseMapSection({
  recorridos,
  pasesInfo = [],
}: {
  recorridos: Recorridos;
  pasesInfo?: PaseListItem[];
}) {
  const { pases, defaultPaseSlug } = recorridos;
  const t = useTranslations("home.recorrido");
  const reducedMotion = useReducedMotion();

  const [activePaseSlug, setActivePaseSlug] = useState(defaultPaseSlug);
  const activeRoute =
    pases.find((p) => p.paseSlug === activePaseSlug) ?? pases[0]!;
  const { ruta, waypoints, centro, zoom } = activeRoute;
  const activePaseInfo = pasesInfo.find((p) => p.slug === activePaseSlug);
  const finaleIdx = waypoints.length; // índice centinela del panel de cierre

  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const dotMarkerRef = useRef<MapLibreMarker | null>(null);
  const waypointMarkersRef = useRef<HTMLDivElement[]>([]);
  const pinActiveRef = useRef<boolean[]>([]);
  const prevActiveIdxRef = useRef(-1);
  // Estado inicial = ruta completa dibujada ("pase ya recorrido"). En escritorio,
  // al primer scroll real se borra y comienza desde el punto de inicio.
  const startedRef = useRef(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const activeIdxRef = useRef(-1);
  activeIdxRef.current = activeIdx;
  const [inView, setInView] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);

  // ── Móvil vs escritorio ──────────────────────────────────────────────────
  // El recorrido por scroll (sticky 300vh) es frágil en móvil: iOS Safari congela
  // las animaciones ligadas al scroll durante el desplazamiento por inercia. En
  // móvil usamos un carrusel táctil (botones/swipe/pines) que NO depende del scroll.
  const [isMobile, setIsMobile] = useState(false);
  const isMobileRef = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => {
      setIsMobile(mq.matches);
      isMobileRef.current = mq.matches;
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Pinta el mapa para un progreso dado (o la ruta completa). Compartido por el
  // scroll de escritorio y la navegación por carrusel en móvil.
  const paintMap = (p: number, full = false) => {
    const map = mapRef.current;
    const source = map?.getSource("route-progress") as GeoJSONSource | undefined;
    if (!map || !source) return;
    const coords = full ? ruta : getRouteAtProgress(ruta, p);
    if (coords.length >= 2) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      });
    }
    dotMarkerRef.current?.setLngLat(coords[coords.length - 1] ?? ruta[0]!);
    waypoints.forEach((wp, i) => {
      const el = waypointMarkersRef.current[i];
      if (!el) return;
      const active = full ? true : p >= wp.progress;
      if (pinActiveRef.current[i] === active) return; // solo al cruzar el umbral
      pinActiveRef.current[i] = active;
      stylePin(el, active);
    });
  };

  // ── Navegación del carrusel (móvil) ────────────────────────────────────────
  // Secuencia: inicio (-1) → waypoints (0..n-1) → cierre (finaleIdx).
  const navSeq = [-1, ...waypoints.map((_, i) => i), finaleIdx];

  function goToIdx(idx: number) {
    prevActiveIdxRef.current = idx;
    if (idx === -1) {
      startedRef.current = false;
      setActiveIdx(-1);
      paintMap(0, true); // ruta completa
    } else if (idx === finaleIdx) {
      startedRef.current = true;
      setActiveIdx(idx);
      paintMap(1); // ruta completa, dot al final
    } else {
      startedRef.current = true;
      setActiveIdx(idx);
      paintMap(waypoints[idx]!.progress);
    }
  }
  // Ref para que los pines del mapa (creados una vez en el init) llamen al
  // goToIdx vigente sin closure obsoleto, y solo en móvil.
  const onPinClickRef = useRef<(i: number) => void>(() => {});
  onPinClickRef.current = (i: number) => {
    if (isMobileRef.current) goToIdx(i);
  };

  const goNext = () => {
    const pos = navSeq.indexOf(activeIdx);
    if (pos < navSeq.length - 1) goToIdx(navSeq[pos + 1]!);
  };
  const goPrev = () => {
    const pos = navSeq.indexOf(activeIdx);
    if (pos > 0) goToIdx(navSeq[pos - 1]!);
  };
  const navPos = navSeq.indexOf(activeIdx);

  // Swipe horizontal sobre la tarjeta (móvil)
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  // Lleva el scroll hasta el punto donde el waypoint i se activa (solo escritorio).
  function scrollToProgress(rawProgress: number) {
    const el = containerRef.current;
    if (!el || isMobileRef.current) return;
    const sectionTop = el.getBoundingClientRect().top + window.scrollY;
    const scrollable = el.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: sectionTop + rawProgress * scrollable,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  function scrollToWaypoint(i: number) {
    const wp = waypoints[i];
    if (!wp) return;
    scrollToProgress(wp.progress * 0.92 + 0.04 + 0.006); // justo pasado el umbral
  }

  function selectPase(slug: string) {
    if (slug === activePaseSlug) return;
    prevActiveIdxRef.current = -1;
    startedRef.current = false; // el nuevo pase vuelve a mostrar la ruta completa
    setActiveIdx(-1);
    setActivePaseSlug(slug);
    if (!isMobileRef.current) scrollToProgress(0); // reiniciar el recorrido (escritorio)
  }

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (raw) => {
    if (isMobileRef.current) return; // en móvil el recorrido NO va por scroll
    const p = Math.max(0, Math.min(1, (raw - 0.04) / 0.92));

    // Estado inicial: sin scroll real todavía → mantener la ruta completa
    // ("pase ya recorrido"). En cuanto el scroll avanza, se borra y arranca.
    if (!startedRef.current) {
      if (p <= 0.001) {
        paintMap(0, true);
        if (prevActiveIdxRef.current !== -1) {
          prevActiveIdxRef.current = -1;
          setActiveIdx(-1);
        }
        return;
      }
      startedRef.current = true;
    }

    paintMap(p);

    const lastWpIdx = waypoints.reduce(
      (acc, wp, i) => (p >= wp.progress ? i : acc),
      -1
    );
    const newActiveIdx =
      lastWpIdx === waypoints.length - 1 && p >= FINALE_THRESHOLD
        ? finaleIdx
        : lastWpIdx;
    if (newActiveIdx !== prevActiveIdxRef.current) {
      prevActiveIdxRef.current = newActiveIdx;
      setActiveIdx(newActiveIdx);
    }
    // El mapa es estático (encuadra toda la ruta); el punto rojo viaja sobre él
    // sincronizado al scroll. No se mueve la cámara → sin lag ni "settling".
  });

  // Rotación automática de las fotos del waypoint activo
  useEffect(() => {
    setPhotoIdx(0);
    const wp =
      activeIdx >= 0 && activeIdx < waypoints.length ? waypoints[activeIdx] : null;
    if (!wp || reducedMotion) return;
    const total = 1 + wp.imagenesExtra.length;
    if (total <= 1) return;
    const id = setInterval(() => setPhotoIdx((i) => (i + 1) % total), 3500);
    return () => clearInterval(id);
  }, [activeIdx, waypoints, reducedMotion]);

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

  // Init + re-init del mapa. Cambiar de pase (activePaseSlug) o de breakpoint
  // (isMobile, el contenedor del mapa cambia) reconstruye limpio vía el cleanup.
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!inView || !container) return;
    let map: MapLibreMap | undefined;
    let ro: ResizeObserver | undefined;
    // El import es async: si el efecto se limpia (cambio de pase) mientras el
    // import está pendiente, hay que descartar el mapa que se cree después —
    // si no, queda huérfano (nunca se destruye) y pisa mapRef con un pase viejo.
    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled) return;

      // MapLibre lee offsetHeight al inicializar, antes del primer paint —
      // fijar la altura en px desde el wrapper y mantenerla sincronizada.
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

        // Encuadrar toda la ruta — mapa estático, la cámara no persigue el scroll
        const lons = ruta.map((c) => c[0]);
        const lats = ruta.map((c) => c[1]);
        m.fitBounds(
          [
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)],
          ],
          { padding: { top: 96, bottom: 56, left: 48, right: 48 }, duration: 0 }
        );

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

        // Ruta de progreso — arranca con la ruta COMPLETA dibujada (estado
        // inicial: "pase ya recorrido").
        m.addSource("route-progress", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: startedRef.current ? [ruta[0]!] : ruta,
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
        dotMarker
          .setLngLat(startedRef.current ? ruta[0]! : ruta[ruta.length - 1]!)
          .addTo(m);
        dotMarkerRef.current = dotMarker;

        // Numbered waypoint pins (tocables en móvil)
        waypointMarkersRef.current = [];
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
            "cursor:pointer",
          ].join(";");
          el.textContent = String(i + 1);
          el.addEventListener("click", () => onPinClickRef.current(i));
          waypointMarkersRef.current[i] = el;
          new maplibregl.Marker({ element: el, anchor: "center" })
            .setLngLat(wp.coord)
            .addTo(m);
        });
        // Estado inicial (ruta completa) = todos los pines activos.
        const initialActive = !startedRef.current;
        waypointMarkersRef.current.forEach((el) => stylePin(el, initialActive));
        pinActiveRef.current = waypoints.map(() => initialActive);

        // Si al (re)inicializar ya había una parada activa (p. ej. cambio de
        // orientación en móvil a mitad del recorrido), repintar a ese estado.
        const cur = activeIdxRef.current;
        if (startedRef.current && cur >= 0) {
          paintMap(cur === finaleIdx ? 1 : waypoints[cur]?.progress ?? 0, cur === finaleIdx);
        }
      });
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      map?.remove();
      mapRef.current = null;
      dotMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, activePaseSlug, ruta, waypoints, centro, zoom, isMobile]);

  const activeWp =
    activeIdx >= 0 && activeIdx < waypoints.length ? waypoints[activeIdx] : null;
  const isFinale = activeIdx === finaleIdx;
  // El selector de pases solo se muestra al inicio y al final del recorrido.
  const showSelector = activeIdx === -1 || isFinale;
  const fotos = activeWp ? [activeWp.imagen, ...activeWp.imagenesExtra] : [];
  const fotoActual = fotos[photoIdx] ?? fotos[0];

  // ── Cabecera sobre el mapa (eyebrow + título + selector de pases) ──────────
  const mapHeader = (
    <div className="absolute left-0 right-0 top-0 z-20 px-5 pt-6 md:px-7 md:pt-8">
      <AnimatePresence mode="wait">
        {showSelector ? (
          <motion.div
            key="full-header"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.35 }}
          >
            <p className="pointer-events-none text-[10px] uppercase tracking-[0.3em] text-acento-dorado">
              {t("eyebrow")}
            </p>
            <h2 className="pointer-events-none mt-1 font-serif text-2xl font-bold text-texto-claro md:text-3xl">
              {t("titulo")}
            </h2>
            {pases.length > 1 ? (
              <div className="mt-3.5">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-acento-dorado">
                  <span
                    aria-hidden="true"
                    className="inline-block h-1.5 w-1.5 rounded-full bg-acento-dorado motion-safe:animate-pulse"
                  />
                  {t("elige_pase")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {pases.map((pase) => {
                    const active = pase.paseSlug === activePaseSlug;
                    return (
                      <button
                        key={pase.paseSlug}
                        type="button"
                        onClick={() => selectPase(pase.paseSlug)}
                        aria-pressed={active}
                        className={`rounded-full border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.12em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70 ${
                          active
                            ? "border-acento-dorado bg-acento-dorado font-semibold text-fondo-oscuro shadow-[0_0_16px_rgba(200,155,60,0.35)]"
                            : "border-stone-600 bg-fondo-oscuro/60 text-stone-200 hover:border-acento-dorado hover:bg-acento-dorado/10 hover:text-acento-dorado"
                        }`}
                      >
                        {pase.paseNombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="pointer-events-none mt-1 text-xs text-stone-400">
                {activeRoute.paseNombre}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="compact-title"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.3 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-acento-dorado/30 bg-fondo-oscuro/70 px-3.5 py-1.5 backdrop-blur-sm">
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-acento-dorado" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-acento-dorado">
                {activeRoute.paseNombre}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Tarjeta narradora (inicio / waypoint / cierre) ─────────────────────────
  const storyCard = (
    <>
      <AnimatePresence mode="wait">
        {activeIdx === -1 ? (
          <motion.div
            key="start"
            className="absolute inset-0 flex flex-col justify-center gap-3 overflow-y-auto px-7 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -28 }}
            transition={{ duration: reducedMotion ? 0.2 : 0.45 }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-acento-dorado">
              {activePaseInfo?.tipo ?? t("eyebrow")}
            </p>
            <h3 className="font-serif text-2xl md:text-[1.8rem] font-bold text-texto-claro leading-tight">
              {activePaseInfo?.nombre ?? activeRoute.paseNombre}
            </h3>

            {activePaseInfo ? (
              <div className="space-y-2 text-sm">
                {activePaseInfo.horario && (
                  <p className="flex items-center gap-2 text-stone-300">
                    <svg className="h-4 w-4 shrink-0 text-acento-dorado" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {activePaseInfo.horario}
                  </p>
                )}
                {(activePaseInfo.inicio || activePaseInfo.ruta) && (
                  <p className="flex items-start gap-2 text-stone-400">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-acento-dorado" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {activePaseInfo.inicio && activePaseInfo.fin
                      ? `${activePaseInfo.inicio} → ${activePaseInfo.fin}`
                      : activePaseInfo.ruta}
                  </p>
                )}
                {activePaseInfo.personaje && (
                  <p className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: activePaseInfo.color ?? "#C89B3C" }} />
                    <span className="text-stone-500">{t("personaje")}:</span>
                    <span className="font-medium" style={{ color: activePaseInfo.color ?? "#C89B3C" }}>
                      {activePaseInfo.personaje}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <p className="font-serif text-sm leading-relaxed text-stone-500">
                {waypoints.map((wp) => wp.calle).join(" → ")}
              </p>
            )}

            {activePaseInfo?.fechaDescripcion && (
              <p className="text-xs leading-relaxed text-stone-400">
                {activePaseInfo.fechaDescripcion}
              </p>
            )}

            <div className="mt-1 flex items-center gap-2 text-acento-dorado/80">
              <span className="text-[10px] uppercase tracking-[0.28em]">
                {isMobile ? t("avanza_hint") : t("scroll_hint")}
              </span>
              <span aria-hidden="true" className={isMobile ? "" : "motion-safe:animate-bounce"}>
                {isMobile ? "→" : "↓"}
              </span>
            </div>
          </motion.div>
        ) : isFinale ? (
          <motion.div
            key="finale"
            className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center gap-4"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -28 }}
            transition={{ duration: reducedMotion ? 0.2 : 0.5 }}
          >
            <div className="w-px h-10 bg-gradient-to-b from-transparent to-acento-dorado/50" />
            <h3 className="font-serif text-2xl md:text-[1.8rem] font-bold text-texto-claro leading-tight">
              {t("finale_titulo")}
            </h3>
            <p className="text-stone-400 font-serif text-sm leading-relaxed max-w-[300px]">
              {t("finale_texto")}
            </p>
            <Link
              href="/calendario"
              className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-acento-dorado/60 bg-acento-dorado/10 px-5 text-[11px] uppercase tracking-[0.25em] text-acento-dorado hover:bg-acento-dorado/20 transition-colors duration-200"
            >
              {t("ver_calendario")}
              <span aria-hidden="true">→</span>
            </Link>
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
                {/* Imagen rotativa — ocupa el alto disponible del panel */}
                <div className="relative flex-1 min-h-0 overflow-hidden">
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={fotoActual ?? activeWp.imagen}
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0 : 0.8 }}
                    >
                      <Image
                        src={fotoActual ?? activeWp.imagen}
                        alt={activeWp.alt}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 45vw, 100vw"
                        priority={activeIdx === 0}
                      />
                    </motion.div>
                  </AnimatePresence>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-fondo-oscuro" />

                  {/* Indicador de fotos */}
                  {fotos.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
                      {fotos.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPhotoIdx(i)}
                          aria-label={t("ver_foto", { n: i + 1 })}
                          className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70 ${
                            i === photoIdx
                              ? "w-5 bg-acento-dorado"
                              : "w-1.5 bg-texto-claro/40 hover:bg-texto-claro/70"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Texto — compacto para dejar más espacio a la foto */}
                <div className="flex-shrink-0 px-6 pt-2 pb-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-acento-dorado">
                    {activeWp.calle}
                  </p>
                  <h3 className="mt-0.5 font-serif text-xl md:text-2xl font-bold text-texto-claro leading-tight">
                    {activeWp.nombre}
                  </h3>
                  <blockquote className="mt-1.5 font-serif italic text-stone-400 text-xs md:text-sm leading-snug border-l-2 border-acento-dorado/35 pl-3 line-clamp-2">
                    &ldquo;{activeWp.leyenda}&rdquo;
                  </blockquote>
                  <Link
                    href={{
                      pathname: "/personajes/[slug]",
                      params: { slug: activeWp.slug },
                    }}
                    className="mt-2 inline-flex min-h-[40px] items-center gap-1.5 text-[11px] uppercase tracking-[0.3em] text-acento-dorado/80 hover:text-acento-dorado transition-colors duration-200"
                  >
                    {t("ver_ficha")}
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Precarga invisible de la imagen del siguiente waypoint */}
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
    </>
  );

  // ── Layout MÓVIL: carrusel táctil, sin scroll-pinning ──────────────────────
  if (isMobile) {
    return (
      <section ref={containerRef} className="relative border-y border-borde-sutil bg-fondo-oscuro">
        {/* Mapa */}
        <div className="relative h-[44vh]">
          <div ref={mapContainerRef} className="absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-fondo-oscuro/80 via-transparent to-fondo-oscuro/35" />
          {mapHeader}
        </div>

        {/* Tarjeta + controles */}
        <div className="flex flex-col">
          <div
            className="relative h-[46vh] overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {storyCard}
          </div>

          {/* Controles del carrusel */}
          <div className="flex items-center justify-between gap-3 border-t border-borde-sutil px-5 py-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={navPos <= 0}
              aria-label={t("anterior")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-borde-sutil text-stone-300 transition-colors disabled:opacity-30 enabled:hover:border-acento-dorado enabled:hover:text-acento-dorado"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Puntos de progreso (inicio + waypoints + cierre) */}
            <div className="flex items-center gap-2">
              {navSeq.map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToIdx(idx)}
                  aria-label={
                    idx === -1
                      ? t("titulo")
                      : idx === finaleIdx
                        ? t("finale_titulo")
                        : `${t("ir_a")} ${waypoints[idx]!.label}`
                  }
                  aria-current={idx === activeIdx ? "true" : undefined}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === activeIdx
                      ? "w-6 bg-acento-dorado"
                      : "w-2.5 bg-stone-600 hover:bg-stone-400"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={goNext}
              disabled={navPos >= navSeq.length - 1}
              aria-label={t("siguiente")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-borde-sutil text-stone-300 transition-colors disabled:opacity-30 enabled:hover:border-acento-dorado enabled:hover:text-acento-dorado"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ── Layout ESCRITORIO: recorrido por scroll (sticky 300vh) ─────────────────
  return (
    <section
      ref={containerRef}
      className="relative border-y border-borde-sutil"
      style={{ height: "300vh" }}
    >
      <div className="sticky top-16 h-[calc(100dvh-4rem)] overflow-hidden bg-fondo-oscuro flex flex-col md:flex-row">
        {/* ── MAP — left 55% ── */}
        <div className="relative h-[45vh] md:h-full md:w-[55%] flex-shrink-0">
          <div ref={mapContainerRef} className="absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-fondo-oscuro/80 via-transparent to-fondo-oscuro/35 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-fondo-oscuro/50" />
          {mapHeader}
        </div>

        {/* ── PANEL NARRADOR — right 45% ── */}
        <div className="relative flex flex-col flex-1 overflow-hidden bg-fondo-oscuro md:border-l md:border-borde-sutil">
          <div className="relative flex-1 overflow-hidden min-h-0">{storyCard}</div>

          {/* ── Timeline ── */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-borde-sutil">
            <div className="flex items-start">
              {waypoints.map((wp, i) => (
                <div key={i} className="flex items-center flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => scrollToWaypoint(i)}
                    aria-label={`${t("ir_a")} ${wp.label}`}
                    aria-current={i === activeIdx ? "true" : undefined}
                    className="group flex flex-col items-center flex-shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70"
                  >
                    <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
                      <div
                        className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-500 group-hover:border-acento-dorado ${
                          i <= activeIdx
                            ? "bg-acento-dorado border-acento-dorado shadow-[0_0_8px_rgba(200,155,60,0.65)]"
                            : "bg-transparent border-stone-600"
                        }`}
                      />
                    </div>
                    <span
                      className={`mt-0.5 text-[9px] uppercase tracking-wider text-center leading-tight transition-colors duration-500 group-hover:text-acento-dorado ${
                        i <= activeIdx ? "text-acento-dorado/75" : "text-stone-500"
                      }`}
                      style={{ maxWidth: 50 }}
                    >
                      {wp.label}
                    </span>
                  </button>
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
