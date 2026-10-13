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
import { useLocale, useTranslations } from "next-intl";
import type {
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  GeoJSONSource,
} from "maplibre-gl";
import { Link } from "@/i18n/navigation";
import type { Recorridos, RecorridoWaypoint } from "@/lib/data";
import type { PaseListItem } from "@seres-del-pase/types";
import { TILE_STYLE } from "@/lib/map/tile-style";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";

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

// Cada foto extra de una parada ocupa este tramo de scroll (en unidades de
// "ruta completa" = 1): el punto se detiene ahí y el scroll pasa las fotos.
const TRAMO_POR_FOTO = 0.16;

function totalFotos(wp: RecorridoWaypoint): number {
  return Math.max(1, [wp.imagen, ...wp.imagenesExtra].filter(Boolean).length);
}

/**
 * Scroll que consume la pausa de una parada. La primera foto se ve al llegar y
 * la última sigue visible durante el viaje a la parada siguiente; en la última
 * parada no hay viaje después, así que su última foto recibe su propio tramo.
 */
function pausaDe(wp: RecorridoWaypoint, esUltima: boolean): number {
  const n = totalFotos(wp);
  if (n <= 1) return 0;
  return (esUltima ? n : n - 1) * TRAMO_POR_FOTO;
}

/**
 * Traduce una posición `v` de la línea de tiempo (ruta + pausas) al progreso
 * real sobre la ruta y a la foto visible de la parada activa. Entre paradas el
 * punto viaja; en cada parada con varias fotos se queda quieto mientras el
 * scroll las recorre, y solo después sigue hacia la siguiente.
 */
function posicionEnLinea(
  waypoints: RecorridoWaypoint[],
  v: number
): { p: number; foto: number } {
  let pausado = 0;
  let foto = 0;
  for (const [i, wp] of waypoints.entries()) {
    const inicio = wp.progress + pausado;
    const pausa = pausaDe(wp, i === waypoints.length - 1);
    if (v < inicio) return { p: v - pausado, foto };
    if (v < inicio + pausa) {
      const k = Math.floor((v - inicio) / TRAMO_POR_FOTO);
      return { p: wp.progress, foto: Math.min(totalFotos(wp) - 1, k) };
    }
    pausado += pausa;
    foto = totalFotos(wp) - 1;
  }
  return { p: Math.min(1, v - pausado), foto };
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

interface Props {
  recorridos: Recorridos;
  pasesInfo?: PaseListItem[];
  /** Pase que se está recorriendo — lo gobierna el padre (`PasesExplorador`). */
  paseSlug: string;
  /** Sale del recorrido y vuelve a la lista de pases de la provincia. */
  onVolver: () => void;
  volverLabel: string;
  /** Hasta 2 pases que se ofrecen al terminar el recorrido. */
  sugeridos: PaseSugerido[];
  onSugerido: (slug: string) => void;
  /** Avisa cuando el mapa del recorrido ya pintó (para fundirlo con la vista anterior). */
  onMapaListo?: () => void;
}

export interface PaseSugerido {
  slug: string;
  nombre: string;
  /** Línea secundaria ya formateada: fecha · ciudad. */
  meta: string;
}

/**
 * Recorrido con scroll de un solo pase (el punto rojo viaja calle por calle
 * sincronizado al scroll; panel narrador con la foto del personaje de cada
 * parada). Es la tercera vista de `/pases` y la única que usa el scroll: se
 * entra desde la lista de pases de una provincia y se sale con `onVolver`; al
 * terminar ofrece otros pases (`sugeridos`).
 */
export function RecorridoScrollytelling({
  recorridos,
  pasesInfo = [],
  paseSlug,
  onVolver,
  volverLabel,
  sugeridos,
  onSugerido,
  onMapaListo,
}: Props) {
  const { pases } = recorridos;
  const t = useTranslations("pases.recorrido");
  const locale = useLocale();
  const reducedMotion = useReducedMotion();

  const activePaseSlug = pases.some((p) => p.paseSlug === paseSlug)
    ? paseSlug
    : pases[0]?.paseSlug ?? "";
  const activeRoute = pases.find((p) => p.paseSlug === activePaseSlug) ?? pases[0]!;
  const { ruta, waypoints, centro, zoom } = activeRoute;
  const activePaseInfo = pasesInfo.find((p) => p.slug === activePaseSlug);
  const finaleIdx = waypoints.length; // índice centinela del panel de cierre
  // "6 de enero" / "abril" (sin día) para el bloque de calendario del cierre.
  const fechaPase =
    activePaseInfo?.mes != null
      ? new Intl.DateTimeFormat(locale, {
          month: "long",
          ...(activePaseInfo.dia != null ? { day: "numeric" } : {}),
          timeZone: "UTC",
        }).format(new Date(Date.UTC(2024, activePaseInfo.mes - 1, activePaseInfo.dia ?? 1)))
      : null;
  // Largo de la línea de tiempo: la ruta (1) + las pausas de fotos. La sección
  // crece en la misma proporción para que el ritmo del scroll no cambie.
  const largoLinea =
    1 + waypoints.reduce((acc, wp, i) => acc + pausaDe(wp, i === waypoints.length - 1), 0);
  const fotoScrollRef = useRef(0);
  const onMapaListoRef = useRef(onMapaListo);
  onMapaListoRef.current = onMapaListo;

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
    fotoScrollRef.current = 0;
    setPhotoIdx(0);
    if (idx === -1) {
      startedRef.current = false;
      setActiveIdx(-1);
      paintMap(0, true);
    } else if (idx === finaleIdx) {
      startedRef.current = true;
      setActiveIdx(idx);
      paintMap(1);
    } else {
      startedRef.current = true;
      setActiveIdx(idx);
      paintMap(waypoints[idx]!.progress);
    }
  }
  // Pines clicables: scroll al progreso del waypoint (funciona en móvil y escritorio).
  const onPinClickRef = useRef<(i: number) => void>(() => {});
  onPinClickRef.current = (i: number) => scrollToWaypoint(i);

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
    if (!el) return;
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
    // Posición de la parada en la línea de tiempo = su progreso + las pausas previas.
    const previas = waypoints.slice(0, i).reduce((acc, w) => acc + pausaDe(w, false), 0);
    const lineal = (wp.progress + previas) / largoLinea;
    scrollToProgress(lineal * 0.92 + 0.04 + 0.006); // justo pasado el umbral
  }

  // Si el padre cambia `paseSlug` sin remontar el componente.
  // Reinicia la narrativa; si el usuario ya estaba dentro del scroll fijado
  // (p. ej. en el panel de cierre) hay que volverlo al inicio de la sección
  // para que `scrollYProgress` no arranque el pase nuevo a mitad de camino.
  const primeraCorrida = useRef(true);
  useEffect(() => {
    if (primeraCorrida.current) {
      primeraCorrida.current = false;
      return;
    }
    prevActiveIdxRef.current = -1;
    startedRef.current = false;
    setActiveIdx(-1);
    setPhotoIdx(0);
    const el = containerRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const enganchado = r.top < 64 && r.bottom > window.innerHeight;
      if (enganchado) scrollToProgress(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paseSlug]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (raw) => {
    const lineal = Math.max(0, Math.min(1, (raw - 0.04) / 0.92));
    const { p, foto } = posicionEnLinea(waypoints, lineal * largoLinea);
    if (foto !== fotoScrollRef.current) {
      fotoScrollRef.current = foto;
      setPhotoIdx(foto);
    }

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

  // Init + re-init del mapa. Cambiar de pase (activePaseSlug) reconstruye limpio
  // vía el cleanup.
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
        m.once("idle", () => onMapaListoRef.current?.());
        // Mapa no interactivo: la atribución compacta no se pliega sola (ver
        // `MapaEcuador`). Plegada sigue a un toque en su botón ⓘ.
        container.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");

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
        new maplibregl.Marker({ element: startEl }).setLngLat(ruta[0]!).addTo(m);

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
          paintMap(
            cur === finaleIdx ? 1 : waypoints[cur]?.progress ?? 0,
            cur === finaleIdx
          );
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
  }, [inView, activePaseSlug, ruta, waypoints, centro, zoom]);

  const activeWp =
    activeIdx >= 0 && activeIdx < waypoints.length ? waypoints[activeIdx] : null;
  const isFinale = activeIdx === finaleIdx;
  // La cabecera completa solo se muestra al inicio y al final del recorrido.
  const showSelector = activeIdx === -1 || isFinale;
  const fotos = activeWp
    ? [activeWp.imagen, ...activeWp.imagenesExtra].filter(Boolean)
    : [];
  const fotoActual = fotos[photoIdx] ?? fotos[0] ?? "";

  const demoBadge = activeRoute.esDemo ? (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-acento-dorado/30 bg-acento-dorado/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-acento-dorado/90 md:text-xs">
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-acento-dorado" />
      {t("ruta_referencia")}
    </span>
  ) : null;

  // ── Cabecera sobre el mapa (eyebrow + título + selector de pases) ──────────
  const mapHeader = (
    <div className="absolute left-0 right-0 top-0 z-20 px-5 pt-3 md:px-7 md:pt-5">
      <button
        type="button"
        onClick={onVolver}
        className="-ml-2 mb-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-base text-stone-300 transition-colors hover:text-acento-dorado focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70"
      >
        <span aria-hidden="true">‹</span>
        {volverLabel}
      </button>
      <AnimatePresence mode="wait">
        {showSelector ? (
          <motion.div
            key="full-header"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.35 }}
          >
            <p className="pointer-events-none text-xs uppercase tracking-[0.3em] text-acento-dorado md:text-sm">
              {t("eyebrow")}
            </p>
            <h3 className="pointer-events-none mt-1 font-serif text-3xl font-bold text-texto-claro md:text-4xl">
              {t("titulo")}
            </h3>
            <p className="pointer-events-none mt-1 text-sm text-stone-300 md:text-base">
              {activeRoute.paseNombre}
            </p>
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
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-acento-dorado"
              />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-acento-dorado md:text-sm">
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
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="absolute inset-0">
      <AnimatePresence mode="wait">
        {activeIdx === -1 ? (
          <motion.div
            key="start"
            className="absolute inset-0 flex flex-col justify-center gap-2.5 overflow-y-auto px-7 py-4 md:gap-5 md:px-12 md:py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -28 }}
            transition={{ duration: reducedMotion ? 0.2 : 0.45 }}
          >
            {demoBadge}
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-acento-dorado md:text-sm">
              {activePaseInfo?.tipo ?? t("eyebrow")}
            </p>
            <h3 className="font-serif text-2xl font-bold leading-[1.1] text-texto-claro md:text-5xl">
              {activePaseInfo?.nombre ?? activeRoute.paseNombre}
            </h3>

            {/* Ficha rápida: cuándo, dónde y cuántas paradas tiene el camino. */}
            <dl className="hidden grid-cols-3 divide-x divide-borde-sutil rounded-xl border border-borde-sutil md:grid">
              {[
                { k: t("dato_fecha"), v: fechaPase ?? "—" },
                { k: t("dato_ciudad"), v: activePaseInfo?.ciudad ?? "—" },
                { k: t("dato_paradas"), v: String(waypoints.length) },
              ].map((d) => (
                <div key={d.k} className="min-w-0 px-3 py-2.5 md:px-5 md:py-4">
                  <dt className="text-[10px] uppercase tracking-[0.2em] text-stone-500 md:text-xs">
                    {d.k}
                  </dt>
                  <dd className="mt-0.5 font-serif text-base font-bold leading-tight text-texto-claro md:text-xl">
                    {d.v}
                  </dd>
                </div>
              ))}
            </dl>

            {activePaseInfo ? (
              <div className="space-y-2 text-sm md:space-y-3 md:text-lg">
                {activePaseInfo.horario && (
                  <p className="flex items-center gap-2 text-stone-300">
                    <svg
                      className="h-4 w-4 shrink-0 text-acento-dorado md:h-5 md:w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {activePaseInfo.horario}
                  </p>
                )}
                {(activePaseInfo.inicio || activePaseInfo.ruta) && (
                  <p className="flex items-start gap-2 text-stone-400">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-acento-dorado md:mt-1 md:h-5 md:w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                    {activePaseInfo.inicio && activePaseInfo.fin
                      ? `${activePaseInfo.inicio} → ${activePaseInfo.fin}`
                      : activePaseInfo.ruta}
                  </p>
                )}
                {activePaseInfo.personaje && (
                  <p className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: activePaseInfo.color ?? "#C89B3C" }}
                    />
                    <span className="text-stone-500">{t("personaje")}:</span>
                    <span
                      className="font-medium"
                      style={{ color: activePaseInfo.color ?? "#C89B3C" }}
                    >
                      {activePaseInfo.personaje}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <p className="font-serif text-sm leading-relaxed text-stone-500 md:text-lg">
                {waypoints.map((wp) => wp.calle).join(" → ")}
              </p>
            )}

            {activePaseInfo?.fechaDescripcion && (
              <p className="line-clamp-3 text-xs leading-relaxed text-stone-400 md:line-clamp-none md:text-lg">
                {activePaseInfo.fechaDescripcion}
              </p>
            )}

            <div className="mt-1 flex items-center gap-2 text-acento-dorado/80">
              <span className="text-xs uppercase tracking-[0.28em] md:text-sm">
                {t("scroll_hint")}
              </span>
              <span aria-hidden="true" className="motion-safe:animate-bounce">
                ↓
              </span>
            </div>
          </motion.div>
        ) : isFinale ? (
          <motion.div
            key="finale"
            className="absolute inset-0 flex flex-col justify-center gap-2.5 overflow-hidden px-6 py-3 md:gap-5 md:px-12 md:py-6"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -28 }}
            transition={{ duration: reducedMotion ? 0.2 : 0.5 }}
          >
            <h3 className="hidden font-serif text-4xl font-bold leading-tight text-texto-claro md:block">
              {t("finale_titulo")}
            </h3>

            {/* Lo que antes era la sección Calendario: cuándo y dónde es el pase. */}
            {activePaseInfo && (
              <div className="rounded-xl border border-borde-sutil bg-stone-900/30 p-3.5 md:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-acento-dorado md:text-sm">
                  {t("calendario")}
                </p>
                <p className="mt-1 font-serif text-xl font-bold leading-tight text-texto-claro md:text-3xl">
                  {[fechaPase, activePaseInfo.horario].filter(Boolean).join(" · ") ||
                    activePaseInfo.nombre}
                </p>
                <p className="mt-0.5 truncate text-sm text-stone-500 md:mt-1 md:text-base">
                  {[activePaseInfo.ciudad, activePaseInfo.tipo].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-3 hidden text-base leading-relaxed text-stone-400 md:line-clamp-3">
                  {activePaseInfo.fechaDescripcion}
                </p>
              </div>
            )}

            {sugeridos.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-acento-dorado md:mb-3 md:text-sm">
                  {t("sugeridos")}
                </p>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {sugeridos.map((s) => (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => onSugerido(s.slug)}
                      className="flex min-h-[60px] flex-col justify-center rounded-xl border border-borde-sutil px-3 py-2 text-left md:min-h-[92px] md:px-5 md:py-4 transition-colors hover:border-acento-dorado hover:bg-acento-dorado/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70"
                    >
                      <span className="line-clamp-2 text-sm font-medium leading-snug text-texto-claro md:text-lg">
                        {s.nombre}
                      </span>
                      <span className="mt-0.5 truncate text-xs text-stone-500 md:mt-1 md:text-sm">{s.meta}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onVolver}
              className="inline-flex min-h-[44px] w-fit items-center gap-2 text-xs uppercase tracking-[0.25em] text-acento-dorado/80 md:text-sm transition-colors hover:text-acento-dorado focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70"
            >
              <span aria-hidden="true">‹</span>
              {t("ver_mas_pases")}
            </button>
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
                {/* Visual rotativo (foto real o placeholder si la figura aún no
                    tiene fotografía) */}
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={fotoActual || `ph-${activeIdx}`}
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0 : 0.8 }}
                    >
                      {fotoActual ? (
                        <Image
                          src={fotoActual}
                          alt={activeWp.alt}
                          fill
                          className="object-cover"
                          sizes="(min-width: 768px) 45vw, 100vw"
                          priority={activeIdx === 0}
                        />
                      ) : (
                        <OrigenPlaceholder
                          origen={undefined}
                          nombre={activeWp.label}
                          variant="hero"
                          uid={`recorrido-${activePaseSlug}-${activeIdx}`}
                          className="h-full w-full"
                        />
                      )}
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

                {/* Texto */}
                <div className="flex-shrink-0 px-6 pb-2.5 pt-2 md:px-12 md:pb-6 md:pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-acento-dorado md:text-sm">
                    {activeWp.calle}
                  </p>
                  <h3 className="mt-0.5 font-serif text-2xl font-bold leading-tight text-texto-claro md:mt-1 md:text-4xl">
                    {activeWp.nombre}
                  </h3>
                  {activeWp.leyenda && (
                    <blockquote className="mt-1.5 line-clamp-2 border-l-2 border-acento-dorado/35 pl-3 font-serif text-sm italic leading-snug text-stone-300 md:mt-3 md:pl-4 md:text-xl">
                      &ldquo;{activeWp.leyenda}&rdquo;
                    </blockquote>
                  )}
                  {activeWp.slug && (
                    <Link
                      href={{
                        pathname: "/personajes/[slug]",
                        params: { slug: activeWp.slug },
                      }}
                      className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-acento-dorado/80 md:mt-3 md:text-sm transition-colors duration-200 hover:text-acento-dorado"
                    >
                      {t("ver_ficha")}
                      <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Precarga invisible de la imagen del siguiente waypoint */}
      {waypoints[activeIdx + 1]?.imagen && (
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
  );

  // ── Layout unificado: scroll-driven en móvil y escritorio ─────────────────
  return (
    <section
      ref={containerRef}
      className="relative border-y border-borde-sutil"
      style={{ height: `${Math.round(300 * largoLinea)}vh` }}
    >
      <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-fondo-oscuro md:flex-row">
        {/* ── MAPA — arriba 40dvh (móvil) / izquierda 55% (escritorio) ── */}
        <div className="relative h-[40dvh] flex-shrink-0 md:h-full md:w-[55%]">
          <div ref={mapContainerRef} className="absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-fondo-oscuro/80 via-transparent to-fondo-oscuro/35 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-fondo-oscuro/50" />
          {mapHeader}
          {/* Progress bars — solo móvil */}
          <div className="absolute bottom-3 left-3 right-3 z-20 flex gap-1 md:hidden">
            {navSeq.map((idx, i) => (
              <button
                key={idx}
                type="button"
                aria-label={
                  idx === -1
                    ? t("titulo")
                    : idx === finaleIdx
                      ? t("finale_titulo")
                      : `${t("ir_a")} ${waypoints[idx]!.label}`
                }
                onClick={() => {
                  if (idx === -1) scrollToProgress(0.005);
                  else if (idx === finaleIdx) scrollToProgress(0.999);
                  else scrollToWaypoint(idx);
                }}
                className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20"
              >
                <div
                  className="h-full rounded-full bg-white transition-all ease-out"
                  style={{
                    width: navPos >= i ? "100%" : "0%",
                    transitionDuration: reducedMotion ? "0ms" : "400ms",
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* ── PANEL NARRADOR — derecha 45% ── */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-fondo-oscuro md:border-l md:border-borde-sutil">
          <div className="relative min-h-0 flex-1 overflow-hidden">{storyCard}</div>

          {/* ── Timeline ── */}
          <div className="flex-shrink-0 border-t border-borde-sutil px-6 py-4">
            <div className="flex items-start">
              {waypoints.map((wp, i) => (
                <div key={i} className="flex min-w-0 flex-1 items-center">
                  <button
                    type="button"
                    onClick={() => scrollToWaypoint(i)}
                    aria-label={`${t("ir_a")} ${wp.label}`}
                    aria-current={i === activeIdx ? "true" : undefined}
                    className="group flex flex-shrink-0 flex-col items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70"
                  >
                    <div className="flex min-h-[44px] min-w-[44px] items-center justify-center">
                      <div
                        className={`h-2.5 w-2.5 rounded-full border-2 transition-all duration-500 group-hover:border-acento-dorado ${
                          i <= activeIdx
                            ? "border-acento-dorado bg-acento-dorado shadow-[0_0_8px_rgba(200,155,60,0.65)]"
                            : "border-stone-600 bg-transparent"
                        }`}
                      />
                    </div>
                    <span
                      className={`mt-0.5 text-center text-[10px] uppercase leading-tight tracking-wider md:text-xs transition-colors duration-500 group-hover:text-acento-dorado ${
                        i <= activeIdx ? "text-acento-dorado/75" : "text-stone-500"
                      }`}
                      style={{ maxWidth: 84 }}
                    >
                      {wp.label}
                    </span>
                  </button>
                  {i < waypoints.length - 1 && (
                    <div className="mx-1.5 mb-5 h-px flex-1 overflow-hidden bg-stone-800">
                      <div
                        className="h-full bg-acento-dorado/50 transition-all duration-700 ease-out"
                        style={{
                          width:
                            i < activeIdx ? "100%" : i === activeIdx ? "50%" : "0%",
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
