"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { usePasosAnclados } from "@/lib/scroll-por-pasos";

// Scroll (en vh) que ocupa cada tramo entre dos fotos.
const VH_POR_TRAMO = 50;

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

/**
 * Progreso real de cada parada sobre la ruta, en la misma escala que usa
 * `getRouteAtProgress` (índice fraccional de vértice / total). El `progress` del
 * JSON es aproximado y la parada se encendía antes o después de que el punto
 * rojo la alcanzara. Se proyecta el `coord` sobre cada tramo y se busca hacia
 * adelante desde la parada anterior (las rutas pueden pasar dos veces cerca).
 */
function alinearARuta(
  waypoints: RecorridoWaypoint[],
  ruta: [number, number][]
): RecorridoWaypoint[] {
  const total = ruta.length - 1;
  if (total < 1) return waypoints;
  // lon escalada por cos(lat): distancias comparables en una ciudad
  const k = Math.cos(((ruta[0]![1] ?? 0) * Math.PI) / 180);
  let desde = 0;
  return waypoints.map((wp) => {
    let mejor = { d: Infinity, at: desde };
    for (let i = Math.floor(desde); i < total; i++) {
      const [ax, ay] = ruta[i]!;
      const [bx, by] = ruta[i + 1]!;
      const dx = (bx - ax) * k;
      const dy = by - ay;
      const largo = dx * dx + dy * dy;
      const px = (wp.coord[0] - ax) * k;
      const py = wp.coord[1] - ay;
      const t = largo === 0 ? 0 : Math.max(0, Math.min(1, (px * dx + py * dy) / largo));
      const ex = px - t * dx;
      const ey = py - t * dy;
      const d = ex * ex + ey * ey;
      const at = Math.max(desde, i + t);
      if (d < mejor.d - 1e-14) mejor = { d, at };
    }
    desde = mejor.at;
    return { ...wp, progress: mejor.at / total };
  });
}

function fotosDe(wp: RecorridoWaypoint): string[] {
  return [wp.imagen, ...wp.imagenesExtra].filter(Boolean);
}

/**
 * Un paso = una foto. Las fotos de una parada se reparten entre ella y la
 * siguiente: cada cambio de foto avanza el recorrido, también dentro de la
 * misma parada. Una parada sin fotos es un paso (con su placeholder).
 */
interface Paso {
  wp: number;
  foto: number;
  src: string;
  progress: number;
}

function construirPasos(waypoints: RecorridoWaypoint[]): Paso[] {
  return waypoints.flatMap((wp, i) => {
    const fotos = fotosDe(wp);
    const n = Math.max(1, fotos.length);
    const fin = Math.max(wp.progress, waypoints[i + 1]?.progress ?? 1);
    return Array.from({ length: n }, (_, k) => ({
      wp: i,
      foto: k,
      src: fotos[k] ?? "",
      progress: wp.progress + ((fin - wp.progress) * k) / n,
    }));
  });
}

/**
 * Nudos de la línea de tiempo: inicio, cada paso y fin de ruta, más un último
 * tramo quieto para el cierre. El scroll reparte lo mismo entre nudo y nudo, así
 * cada foto dura igual aunque las calles entre ellas midan distinto.
 */
function nudosDe(pasos: Paso[]): number[] {
  const nudos = [0, ...pasos.map((p) => p.progress), 1, 1];
  for (let i = 1; i < nudos.length; i++) nudos[i] = Math.max(nudos[i]!, nudos[i - 1]!);
  return nudos;
}

/**
 * Del scroll `s` (0–1) al progreso sobre la ruta y al tramo en curso:
 * tramo 0 = camino a la primera foto · tramo j+1 = foto j · último = cierre.
 */
function enLinea(nudos: number[], s: number): { p: number; tramo: number } {
  const tramos = nudos.length - 1;
  const x = Math.max(0, Math.min(1, s)) * tramos;
  const i = Math.min(tramos - 1, Math.floor(x));
  return { p: nudos[i]! + (nudos[i + 1]! - nudos[i]!) * (x - i), tramo: i };
}

type EstadoPunto = "inicio" | "pendiente" | "activa" | "visitada" | "final";

interface Punto {
  root: HTMLDivElement;
  foto: HTMLDivElement;
  estado: EstadoPunto | null;
  src: string;
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
 * Recorrido con scroll de un solo pase: el punto rojo viaja calle por calle
 * sincronizado al scroll y cada parada es una foto en el mapa que se enciende
 * al llegar y se apaga al dejarla. El panel muestra la foto del paso a pantalla
 * completa. Es la tercera vista de `/pases` y la única que usa el scroll: se
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
  const { ruta, centro, zoom } = activeRoute;
  const waypoints = useMemo(
    () => alinearARuta(activeRoute.waypoints, ruta),
    [activeRoute.waypoints, ruta]
  );
  const activePaseInfo = pasesInfo.find((p) => p.slug === activePaseSlug);
  // "6 de enero" / "abril" (sin día) para la ficha de inicio y el cierre.
  const fechaPase =
    activePaseInfo?.mes != null
      ? new Intl.DateTimeFormat(locale, {
          month: "long",
          ...(activePaseInfo.dia != null ? { day: "numeric" } : {}),
          timeZone: "UTC",
        }).format(new Date(Date.UTC(2024, activePaseInfo.mes - 1, activePaseInfo.dia ?? 1)))
      : null;

  const pasos = construirPasos(waypoints);
  const nudos = nudosDe(pasos);
  const FIN = pasos.length; // índice centinela del panel de cierre
  const portadas = waypoints.map((wp) => fotosDe(wp)[0] ?? "");
  const mosaico = portadas.filter(Boolean).slice(0, 4);

  const onMapaListoRef = useRef(onMapaListo);
  onMapaListoRef.current = onMapaListo;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const dotMarkerRef = useRef<MapLibreMarker | null>(null);
  const puntosRef = useRef<Punto[]>([]);
  // Estado inicial = ruta completa dibujada ("pase ya recorrido") con las fotos
  // grandes. Al primer scroll real se borra y comienza desde el punto de inicio.
  const startedRef = useRef(false);
  const progresoRef = useRef(0);
  // -1 = inicio · 0..FIN-1 = paso (foto) · FIN = cierre
  const [paso, setPaso] = useState(-1);
  const pasoRef = useRef(-1);
  const [inView, setInView] = useState(false);

  // ── Mapa ──────────────────────────────────────────────────────────────────
  function pintarRuta(p: number, full = false) {
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
  }

  function setPunto(i: number, estado: EstadoPunto, src: string) {
    const punto = puntosRef.current[i];
    if (!punto) return;
    const destello = () => {
      punto.foto.classList.remove("wp-destello");
      void punto.foto.offsetWidth; // reinicia la animación
      punto.foto.classList.add("wp-destello");
    };
    if (punto.estado !== estado) {
      punto.estado = estado;
      punto.root.dataset.estado = estado;
      punto.root.style.zIndex = estado === "activa" ? "3" : "1";
      if (estado === "activa") destello();
    }
    if (src && punto.src !== src) {
      const habiaFoto = punto.src !== "";
      punto.src = src;
      // Mismo archivo que usa el panel (las imágenes van sin optimizar): sale de caché.
      punto.foto.style.backgroundImage = `url("${src}")`;
      if (habiaFoto && estado === "activa") destello();
    }
  }

  // Enciende la parada del paso actual, apaga las ya pasadas y deja titilando
  // las que faltan.
  function pintarPuntos(pasoActual: number, p: number) {
    const activo = pasoActual >= 0 && pasoActual < FIN ? pasos[pasoActual]! : null;
    waypoints.forEach((wp, i) => {
      let estado: EstadoPunto;
      if (!startedRef.current) estado = "inicio";
      else if (pasoActual >= FIN) estado = "final";
      else if (activo?.wp === i) estado = "activa";
      else estado = p >= wp.progress ? "visitada" : "pendiente";
      const src = estado === "activa" && activo?.src ? activo.src : portadas[i] ?? "";
      setPunto(i, estado, src);
    });
  }

  // ── Navegación por scroll ─────────────────────────────────────────────────
  function scrollToRaw(raw: number) {
    const el = containerRef.current;
    if (!el) return;
    const sectionTop = el.getBoundingClientRect().top + window.scrollY;
    const scrollable = el.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: sectionTop + raw * scrollable,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  // Lleva el scroll al paso j (-1 = inicio, FIN = cierre).
  function irAPaso(j: number) {
    if (j < 0) return scrollToRaw(0.005);
    if (j >= FIN) return scrollToRaw(0.995);
    const s = (j + 1) / (nudos.length - 1);
    scrollToRaw(0.04 + s * 0.92 + 0.004); // justo pasado el nudo de la foto
  }

  // Los puntos del mapa viven fuera de React: el clic pasa por una ref.
  const onPuntoClickRef = useRef<(i: number) => void>(() => {});
  onPuntoClickRef.current = (i: number) => irAPaso(pasos.findIndex((p) => p.wp === i));

  // Swipe horizontal sobre el panel: foto siguiente / anterior.
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    irAPaso(dx < 0 ? paso + 1 : paso - 1);
  };

  // Si el padre cambia `paseSlug` sin remontar el componente: reinicia y, si el
  // usuario estaba dentro del scroll fijado, lo vuelve al inicio de la sección.
  const primeraCorrida = useRef(true);
  useEffect(() => {
    if (primeraCorrida.current) {
      primeraCorrida.current = false;
      return;
    }
    startedRef.current = false;
    pasoRef.current = -1;
    setPaso(-1);
    const el = containerRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < 64 && r.bottom > window.innerHeight) scrollToRaw(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paseSlug]);

  // Un gesto = un paso: inicio + cada foto + cierre. El ancla va justo pasado el
  // nudo de la foto (como `irAPaso`), así el punto rojo ya llegó a la parada.
  const tramosTotales = nudos.length - 1;
  usePasosAnclados(containerRef, [
    0,
    ...Array.from({ length: FIN + 1 }, (_, j) => 0.04 + (0.92 * (j + 1 + 0.15)) / tramosTotales),
  ]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (raw) => {
    const s = Math.max(0, Math.min(1, (raw - 0.04) / 0.92));
    const { p, tramo } = enLinea(nudos, s);
    progresoRef.current = p;

    // Sin scroll real todavía → ruta completa y fotos grandes.
    if (!startedRef.current) {
      if (p <= 0.001) {
        pintarRuta(0, true);
        pintarPuntos(-1, 0);
        if (pasoRef.current !== -1) {
          pasoRef.current = -1;
          setPaso(-1);
        }
        return;
      }
      startedRef.current = true;
    }

    const nuevo = Math.min(FIN, tramo - 1);

    pintarRuta(p);
    pintarPuntos(nuevo, p);
    if (nuevo !== pasoRef.current) {
      pasoRef.current = nuevo;
      setPaso(nuevo);
    }
  });

  // Inicializar MapLibre solo cuando la sección se acerca al viewport.
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

  // Init + re-init del mapa. Cambiar de pase reconstruye limpio vía el cleanup.
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!inView || !container) return;
    let map: MapLibreMap | undefined;
    let ro: ResizeObserver | undefined;
    // El import es async: si el efecto se limpia mientras está pendiente, hay
    // que descartar el mapa que se cree después (si no, queda huérfano).
    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled) return;

      // MapLibre lee offsetHeight al inicializar, antes del primer paint —
      // fijar la altura en px desde el wrapper y mantenerla sincronizada.
      const wrapper = container.parentElement;
      const syncHeight = () => {
        container.style.width = "100%";
        container.style.height = `${wrapper?.offsetHeight || window.innerHeight}px`;
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

        // Encuadrar toda la ruta — mapa estático, la cámara no persigue el scroll.
        // Margen extra para que las fotos grandes del inicio no se corten.
        const lons = ruta.map((c) => c[0]);
        const lats = ruta.map((c) => c[1]);
        m.fitBounds(
          [
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)],
          ],
          {
            padding: window.matchMedia("(min-width: 768px)").matches
              ? { top: 120, bottom: 64, left: 72, right: 72 }
              : { top: 84, bottom: 36, left: 44, right: 44 },
            duration: 0,
          }
        );

        // Ruta completa tenue (punteada)
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
            "line-opacity": 0.2,
            "line-dasharray": [2, 3],
          },
        });

        // Ruta recorrida — arranca COMPLETA (estado inicial).
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
          paint: { "line-color": "#B8312F", "line-width": 20, "line-opacity": 0.18 },
        });
        m.addLayer({
          id: "route-progress-line",
          type: "line",
          source: "route-progress",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#B8312F", "line-width": 4, "line-opacity": 1 },
        });

        // Paradas: una foto circular por parada, sin números.
        puntosRef.current = waypoints.map((wp, i) => {
          const root = document.createElement("div");
          root.className = "wp-punto";
          root.style.setProperty("--wp-retardo", `${(i * 0.35).toFixed(2)}s`);
          if (!portadas[i]) root.dataset.sinFoto = "";
          const foto = document.createElement("div");
          foto.className = "wp-punto__foto";
          foto.setAttribute("aria-hidden", "true");
          foto.addEventListener("click", () => onPuntoClickRef.current(i));
          foto.addEventListener("animationend", (e) => {
            if (e.animationName === "wp-destello") foto.classList.remove("wp-destello");
          });
          root.appendChild(foto);
          new maplibregl.Marker({ element: root, anchor: "center" }).setLngLat(wp.coord).addTo(m);
          return { root, foto, estado: null, src: "" };
        });

        // Cabeza del recorrido (punto rojo con pulso). Va debajo de la parada
        // activa para no tapar su foto.
        const dotEl = document.createElement("div");
        dotEl.style.cssText =
          "width:16px;height:16px;border-radius:50%;background:#B8312F;border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 0 22px rgba(184,49,47,0.9);position:relative;z-index:2";
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const pulseRing = document.createElement("div");
        pulseRing.style.cssText =
          "position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(184,49,47,0.45)" +
          (prefersReduced ? "" : ";animation:pulse-ring 1.6s ease-out infinite");
        dotEl.appendChild(pulseRing);
        const dotMarker = new maplibregl.Marker({ element: dotEl, anchor: "center" });
        dotMarker.setLngLat(startedRef.current ? ruta[0]! : ruta[ruta.length - 1]!).addTo(m);
        dotMarkerRef.current = dotMarker;

        // Repintar al estado actual (p. ej. re-init por rotación a mitad del recorrido).
        if (startedRef.current) {
          const p = progresoRef.current;
          pintarRuta(p, pasoRef.current >= FIN);
        }
        pintarPuntos(pasoRef.current, progresoRef.current);
      });
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      map?.remove();
      mapRef.current = null;
      dotMarkerRef.current = null;
      puntosRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, activePaseSlug, ruta, waypoints, centro, zoom]);

  const pasoActual = paso >= 0 && paso < FIN ? pasos[paso]! : null;
  const activeWp = pasoActual ? waypoints[pasoActual.wp]! : null;
  const isFinale = paso >= FIN;
  // Al inicio y al cierre el panel ya nombra el pase: sobre el mapa solo "volver".
  const showSelector = paso === -1 || isFinale;
  const siguienteSrc = pasos[paso + 1]?.src;

  const demoBadge = activeRoute.esDemo ? (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-acento-dorado/30 bg-fondo-oscuro/60 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-acento-dorado/90 backdrop-blur-sm md:text-xs">
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-acento-dorado" />
      {t("ruta_referencia")}
    </span>
  ) : null;

  // ── Cabecera sobre el mapa (volver + nombre del pase mientras se recorre) ──
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
      <AnimatePresence>
        {!showSelector && (
          <motion.div
            key="chip"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.3 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-acento-dorado/30 bg-fondo-oscuro/70 px-3.5 py-1.5 backdrop-blur-sm">
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-acento-dorado" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-acento-dorado md:text-sm">
                {activeRoute.paseNombre}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Barra de progreso: un tramo por foto, separada por parada ─────────────
  const barraPasos = (
    <div className="absolute left-4 right-4 top-3 z-20 flex md:left-8 md:right-8 md:top-5">
      {pasos.map((ps, j) => (
        <button
          key={j}
          type="button"
          onClick={() => irAPaso(j)}
          aria-label={t("ver_foto", { n: j + 1 })}
          aria-current={j === paso ? "step" : undefined}
          className={`group flex h-6 flex-1 items-center focus-visible:outline-none ${
            j > 0 && pasos[j - 1]!.wp !== ps.wp ? "ml-2" : j > 0 ? "ml-1" : ""
          }`}
        >
          <span className="h-[3px] w-full overflow-hidden rounded-full bg-white/25 group-focus-visible:ring-2 group-focus-visible:ring-acento-dorado/70">
            <span
              className="block h-full rounded-full bg-acento-dorado transition-[width] ease-out"
              style={{
                width: j <= paso ? "100%" : "0%",
                transitionDuration: reducedMotion ? "0ms" : "450ms",
              }}
            />
          </span>
        </button>
      ))}
    </div>
  );

  // ── Inicio: mosaico grande con las fotos del pase + ficha breve ────────────
  const vistaInicio = (
    <motion.div
      key="start"
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
      transition={{ duration: reducedMotion ? 0.2 : 0.5 }}
    >
      {mosaico.length > 0 && (
        <div
          className={`absolute inset-0 grid gap-0.5 ${mosaico.length > 1 ? "grid-cols-2" : ""} ${
            mosaico.length > 2 ? "grid-rows-2" : ""
          }`}
        >
          {mosaico.map((src, i) => (
            <motion.div
              key={`${i}-${src}`}
              className={`relative overflow-hidden ${mosaico.length === 3 && i === 0 ? "row-span-2" : ""}`}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.18 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reducedMotion ? 0.2 : 0.9, delay: reducedMotion ? 0 : 0.08 * i, ease: "easeOut" }}
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover object-[50%_25%]"
                sizes="(min-width: 768px) 23vw, 50vw"
                priority={i < 2}
              />
            </motion.div>
          ))}
        </div>
      )}
      <div
        className={`pointer-events-none absolute inset-0 ${
          mosaico.length > 0
            ? "bg-gradient-to-t from-fondo-oscuro via-fondo-oscuro/70 to-fondo-oscuro/5"
            : ""
        }`}
      />

      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col gap-2 px-6 pb-5 md:gap-4 md:px-12 md:pb-10 ${
          mosaico.length > 0 ? "" : "top-0 justify-center"
        }`}
      >
        {demoBadge}
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-acento-dorado md:text-sm">
          {activePaseInfo?.tipo ?? t("eyebrow")}
        </p>
        <h3 className="font-serif text-2xl font-bold leading-[1.1] text-texto-claro md:text-5xl">
          {activePaseInfo?.nombre ?? activeRoute.paseNombre}
        </h3>

        {/* Cuándo · dónde · cuántas paradas */}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-300 md:text-lg">
          {[fechaPase, activePaseInfo?.horario, activePaseInfo?.ciudad, t("paradas", { n: waypoints.length })]
            .filter(Boolean)
            .map((dato, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true" className="h-1 w-1 rounded-full bg-acento-dorado/60" />}
                {dato}
              </span>
            ))}
        </p>

        {(activePaseInfo?.inicio || activePaseInfo?.ruta) && (
          <p className="hidden text-base text-stone-400 md:block">
            {activePaseInfo.inicio && activePaseInfo.fin
              ? `${activePaseInfo.inicio} → ${activePaseInfo.fin}`
              : activePaseInfo.ruta}
          </p>
        )}
        {activePaseInfo?.fechaDescripcion && (
          <p className="hidden text-base leading-relaxed text-stone-400 md:line-clamp-3">
            {activePaseInfo.fechaDescripcion}
          </p>
        )}

        <div className="mt-1 flex items-center gap-2 text-acento-dorado/80">
          <span className="text-xs uppercase tracking-[0.28em] md:text-sm">{t("scroll_hint")}</span>
          <span aria-hidden="true" className="motion-safe:animate-bounce">↓</span>
        </div>
      </div>
    </motion.div>
  );

  // ── Parada: foto a pantalla completa + pie breve ──────────────────────────
  const vistaParada = activeWp && pasoActual && (
    <motion.div
      key="parada"
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0.2 : 0.45 }}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={pasoActual.src || `ph-${pasoActual.wp}`}
          className="absolute inset-0 overflow-hidden"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.14 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1.02 }}
          exit={{ opacity: 0 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { opacity: { duration: 0.7 }, scale: { duration: 5, ease: "easeOut" } }
          }
        >
          {pasoActual.src ? (
            <Image
              src={pasoActual.src}
              alt={activeWp.alt}
              fill
              className="object-cover object-[50%_30%]"
              sizes="(min-width: 768px) 45vw, 100vw"
              priority={paso === 0}
            />
          ) : (
            <OrigenPlaceholder
              origen={undefined}
              variant="hero"
              uid={`recorrido-${activePaseSlug}-${pasoActual.wp}`}
              className="h-full w-full"
            />
          )}
        </motion.div>
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-fondo-oscuro via-fondo-oscuro/15 to-fondo-oscuro/50" />

      {barraPasos}

      <AnimatePresence mode="wait">
        <motion.div
          key={pasoActual.wp}
          className="absolute inset-x-0 bottom-0 px-6 pb-5 md:px-12 md:pb-10"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: reducedMotion ? 0.15 : 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-acento-dorado md:text-sm">
            <svg className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {activeWp.calle}
          </p>
          {activeWp.leyenda && (
            <blockquote className="mt-2 line-clamp-2 border-l-2 border-acento-dorado/50 pl-3 font-serif text-base italic leading-snug text-texto-claro/90 md:mt-3 md:line-clamp-3 md:pl-4 md:text-2xl">
              &ldquo;{activeWp.leyenda}&rdquo;
            </blockquote>
          )}
          {activeWp.slug && (
            <Link
              href={{ pathname: "/personajes/[slug]", params: { slug: activeWp.slug } }}
              className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-acento-dorado/80 transition-colors duration-200 hover:text-acento-dorado md:mt-3 md:text-sm"
            >
              {t("ver_ficha")}
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );

  // ── Cierre: cuándo es + pases sugeridos ───────────────────────────────────
  const vistaCierre = (
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

      {activePaseInfo && (
        <div className="rounded-xl border border-borde-sutil bg-stone-900/30 p-3.5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-acento-dorado md:text-sm">
            {t("calendario")}
          </p>
          <p className="mt-1 font-serif text-xl font-bold leading-tight text-texto-claro md:text-3xl">
            {[fechaPase, activePaseInfo.horario].filter(Boolean).join(" · ") || activePaseInfo.nombre}
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
                className="flex min-h-[60px] flex-col justify-center rounded-xl border border-borde-sutil px-3 py-2 text-left transition-colors hover:border-acento-dorado hover:bg-acento-dorado/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70 md:min-h-[92px] md:px-5 md:py-4"
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
        className="inline-flex min-h-[44px] w-fit items-center gap-2 text-xs uppercase tracking-[0.25em] text-acento-dorado/80 transition-colors hover:text-acento-dorado focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70 md:text-sm"
      >
        <span aria-hidden="true">‹</span>
        {t("ver_mas_pases")}
      </button>
    </motion.div>
  );

  // ── Layout: scroll-driven en móvil y escritorio ───────────────────────────
  return (
    <section
      ref={containerRef}
      className="relative border-y border-borde-sutil"
      style={{ height: `${Math.round(100 + VH_POR_TRAMO * (nudos.length - 1))}vh` }}
    >
      <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-fondo-oscuro md:flex-row">
        {/* ── MAPA — arriba 40dvh (móvil) / izquierda 55% (escritorio) ── */}
        <div className="relative h-[40dvh] flex-shrink-0 md:h-full md:w-[55%]">
          <div ref={mapContainerRef} className="absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-fondo-oscuro/80 via-transparent to-fondo-oscuro/35 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-fondo-oscuro/50" />
          {mapHeader}
        </div>

        {/* ── PANEL — la foto manda ── */}
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="relative min-h-0 flex-1 overflow-hidden bg-fondo-oscuro md:border-l md:border-borde-sutil"
        >
          <AnimatePresence mode="wait">
            {paso === -1 ? vistaInicio : isFinale ? vistaCierre : vistaParada}
          </AnimatePresence>

          {/* Precarga invisible de la foto siguiente */}
          {siguienteSrc && (
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-0" aria-hidden="true">
              <Image src={siguienteSrc} alt="" fill className="object-cover" sizes="(min-width: 768px) 45vw, 100vw" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
