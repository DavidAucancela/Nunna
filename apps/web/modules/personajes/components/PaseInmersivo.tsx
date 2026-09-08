"use client";

import { useEffect, useRef, useState } from "react";
import {
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
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
import type { RecorridoPase } from "@/lib/data";
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
  recorrido: RecorridoPase;
  /** Personaje dueño de la ficha — su parada se resalta ("aquí va {nombre}"). */
  personajeSlug: string;
  nombre: string;
  accentColor: string;
}

/**
 * Recorrido inmersivo de un pase real en la ficha del personaje (destino del
 * QR). Reusa la mecánica de `RecorridoScrollytelling` de `/pases` — punto rojo
 * que viaja calle por calle sincronizado al scroll, mapa estático — pero para
 * un solo pase y con el panel narrador en 3D (la foto de cada parada entra
 * girando sobre un eje de perspectiva + parallax con el puntero y una inclinación
 * ligada al scroll). Gated: solo se monta cuando el personaje está desbloqueado
 * (ver `PaseInmersivoGated`).
 */
export function PaseInmersivo({
  recorrido,
  personajeSlug,
  nombre,
  accentColor,
}: Props) {
  const t = useTranslations("pase_inmersivo");
  const reducedMotion = useReducedMotion();

  const { ruta, waypoints, centro, zoom, paseNombre } = recorrido;
  const finaleIdx = waypoints.length; // índice centinela del panel de cierre

  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const dotMarkerRef = useRef<MapLibreMarker | null>(null);
  const waypointMarkersRef = useRef<HTMLDivElement[]>([]);
  const pinActiveRef = useRef<boolean[]>([]);
  const prevActiveIdxRef = useRef(-1);
  // Estado inicial = ruta completa dibujada ("pase ya recorrido"). Al primer
  // scroll real se borra y comienza desde el punto de inicio.
  const startedRef = useRef(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const activeIdxRef = useRef(-1);
  activeIdxRef.current = activeIdx;
  const [inView, setInView] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);

  // ── Parallax con el puntero sobre el panel narrador (solo escritorio) ──────
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateY = useSpring(useTransform(pointerX, [-1, 1], [-7, 7]), {
    stiffness: 120,
    damping: 18,
  });
  const rotateXPointer = useSpring(useTransform(pointerY, [-1, 1], [5, -5]), {
    stiffness: 120,
    damping: 18,
  });

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
      if (pinActiveRef.current[i] === active) return;
      pinActiveRef.current[i] = active;
      stylePin(el, active);
    });
  };

  const onPinClickRef = useRef<(i: number) => void>(() => {});
  onPinClickRef.current = (i: number) => scrollToWaypoint(i);

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
    scrollToProgress(wp.progress * 0.92 + 0.04 + 0.006); // justo pasado el umbral
  }

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Inclinación sutil del panel ligada al avance del scroll (se suma al parallax
  // del puntero). En reduced-motion queda plano.
  const tiltScroll = useTransform(
    scrollYProgress,
    [0, 1],
    reducedMotion ? [0, 0] : [4, -4]
  );

  useMotionValueEvent(scrollYProgress, "change", (raw) => {
    const p = Math.max(0, Math.min(1, (raw - 0.04) / 0.92));

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
  });

  // Rotación automática de las fotos de la parada activa
  useEffect(() => {
    setPhotoIdx(0);
    const wp =
      activeIdx >= 0 && activeIdx < waypoints.length ? waypoints[activeIdx] : null;
    if (!wp || reducedMotion) return;
    const total = [wp.imagen, ...wp.imagenesExtra].filter(Boolean).length;
    if (total <= 1) return;
    const id = setInterval(() => setPhotoIdx((i) => (i + 1) % total), 3800);
    return () => clearInterval(id);
  }, [activeIdx, waypoints, reducedMotion]);

  // Init de MapLibre solo cuando la sección se acerca al viewport.
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
    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled) return;

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

        const lons = ruta.map((c) => c[0]);
        const lats = ruta.map((c) => c[1]);
        m.fitBounds(
          [
            [Math.min(...lons), Math.min(...lats)],
            [Math.max(...lons), Math.max(...lats)],
          ],
          { padding: { top: 96, bottom: 56, left: 48, right: 48 }, duration: 0 }
        );

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

        const startEl = document.createElement("div");
        startEl.style.cssText =
          "width:12px;height:12px;border-radius:50%;background:#C89B3C;border:2px solid #fff;box-shadow:0 0 14px rgba(200,155,60,0.9)";
        new maplibregl.Marker({ element: startEl }).setLngLat(ruta[0]!).addTo(m);

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

        waypointMarkersRef.current = [];
        waypoints.forEach((wp, i) => {
          const el = document.createElement("div");
          const esProtagonista = wp.slug === personajeSlug;
          el.style.cssText = [
            `width:${esProtagonista ? 32 : 26}px`,
            `height:${esProtagonista ? 32 : 26}px`,
            "border-radius:50%",
            "background:rgba(200,155,60,0.07)",
            "border:1.5px solid rgba(200,155,60,0.22)",
            "color:rgba(200,155,60,0.38)",
            "display:flex",
            "align-items:center",
            "justify-content:center",
            `font-size:${esProtagonista ? 13 : 11}px`,
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
        const initialActive = !startedRef.current;
        waypointMarkersRef.current.forEach((el) => stylePin(el, initialActive));
        pinActiveRef.current = waypoints.map(() => initialActive);

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
  }, [inView, ruta, waypoints, centro, zoom, personajeSlug]);

  const activeWp =
    activeIdx >= 0 && activeIdx < waypoints.length ? waypoints[activeIdx] : null;
  const isFinale = activeIdx === finaleIdx;
  const fotos = activeWp
    ? [activeWp.imagen, ...activeWp.imagenesExtra].filter(Boolean)
    : [];
  const fotoActual = fotos[photoIdx] ?? fotos[0] ?? "";
  const navSeq = [-1, ...waypoints.map((_, i) => i), finaleIdx];
  const navPos = navSeq.indexOf(activeIdx);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (reducedMotion || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    pointerX.set(((e.clientX - r.left) / r.width) * 2 - 1);
    pointerY.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  // ── Cabecera sobre el mapa ────────────────────────────────────────────────
  const mapHeader = (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 px-5 pt-6 md:px-7 md:pt-8">
      <p className="text-[10px] uppercase tracking-[0.3em] text-acento-dorado">
        {t("eyebrow")}
      </p>
      <h3 className="mt-1 font-serif text-2xl font-bold text-texto-claro md:text-3xl">
        {t("titulo", { nombre })}
      </h3>
      <p className="mt-1 text-xs text-stone-400">{paseNombre}</p>
    </div>
  );

  // ── Tarjeta narradora (inicio / parada / cierre) ─────────────────────────
  const storyCard = (
    <div
      className="absolute inset-0"
      style={{ perspective: 1400 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
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
              {t("eyebrow")}
            </p>
            <h3 className="font-serif text-2xl font-bold leading-tight text-texto-claro md:text-[1.8rem]">
              {paseNombre}
            </h3>
            <p className="font-serif text-sm leading-relaxed text-stone-400">
              {t("intro", { nombre })}
            </p>
            <p className="font-serif text-sm leading-relaxed text-stone-500">
              {waypoints.map((wp) => wp.calle).join(" → ")}
            </p>
            <div className="mt-1 flex items-center gap-2 text-acento-dorado/80">
              <span className="text-[10px] uppercase tracking-[0.28em]">
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
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -28 }}
            transition={{ duration: reducedMotion ? 0.2 : 0.5 }}
          >
            <div className="h-10 w-px bg-gradient-to-b from-transparent to-acento-dorado/50" />
            <h3 className="font-serif text-2xl font-bold leading-tight text-texto-claro md:text-[1.8rem]">
              {t("finale_titulo")}
            </h3>
            <p className="max-w-[320px] font-serif text-sm leading-relaxed text-stone-400">
              {t("finale_texto", { nombre })}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={activeIdx}
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, rotateY: -18, z: -160, y: 32 }
            }
            animate={
              reducedMotion
                ? { opacity: 1 }
                : { opacity: 1, rotateY: 0, z: 0, y: 0 }
            }
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, rotateY: 14, z: -90 }
            }
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : { duration: 0.85, ease: [0.22, 1, 0.36, 1] }
            }
          >
            {/* Capa interna: parallax vivo con el puntero + inclinación por
                scroll, componido sobre el giro de entrada del contenedor. */}
            <motion.div
              className="absolute inset-0 flex flex-col"
              style={{
                transformStyle: "preserve-3d",
                rotateX: tiltScroll,
                rotateY,
              }}
            >
            {activeWp && (
              <>
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  {/* Capa de profundidad — misma foto, atrás, desenfocada */}
                  {fotoActual && !reducedMotion && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 scale-110 opacity-40 blur-xl"
                      style={{ transform: "translateZ(-90px) scale(1.15)" }}
                    >
                      <Image
                        src={fotoActual}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 45vw, 100vw"
                      />
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    <motion.div
                      key={fotoActual || `ph-${activeIdx}`}
                      className="absolute inset-0"
                      style={{ transform: "translateZ(0)" }}
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
                          uid={`pase-inmersivo-${recorrido.paseSlug}-${activeIdx}`}
                          className="h-full w-full"
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-fondo-oscuro" />

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

                <div
                  className="flex-shrink-0 px-6 pb-2.5 pt-2"
                  style={{ transform: "translateZ(40px)" }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-acento-dorado">
                    {activeWp.calle}
                    <span className="ml-2 text-stone-500">
                      {t("parada", { n: activeIdx + 1, total: waypoints.length })}
                    </span>
                  </p>
                  <h3 className="mt-0.5 font-serif text-xl font-bold leading-tight text-texto-claro md:text-2xl">
                    {activeWp.nombre}
                  </h3>
                  {activeWp.slug === personajeSlug && (
                    <p
                      className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-texto-claro"
                      style={{ backgroundColor: accentColor }}
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-texto-claro/90"
                      />
                      {t("aqui_va", { nombre })}
                    </p>
                  )}
                  {activeWp.dato ? (
                    <p className="mt-1.5 line-clamp-3 font-serif text-xs leading-snug text-stone-400 md:text-sm">
                      {activeWp.dato}
                    </p>
                  ) : (
                    activeWp.leyenda && (
                      <blockquote className="mt-1.5 line-clamp-2 border-l-2 border-acento-dorado/35 pl-3 font-serif text-xs italic leading-snug text-stone-400 md:text-sm">
                        &ldquo;{activeWp.leyenda}&rdquo;
                      </blockquote>
                    )
                  )}
                  {activeWp.slug && activeWp.slug !== personajeSlug && (
                    <Link
                      href={{
                        pathname: "/personajes/[slug]",
                        params: { slug: activeWp.slug },
                      }}
                      className="mt-2 inline-flex min-h-[40px] items-center gap-1.5 text-[11px] uppercase tracking-[0.3em] text-acento-dorado/80 transition-colors duration-200 hover:text-acento-dorado"
                    >
                      {t("ver_ficha")}
                      <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
              </>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Precarga invisible de la imagen de la siguiente parada */}
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

  return (
    <section
      ref={containerRef}
      className="relative border-y border-borde-sutil"
      style={{ height: "300vh" }}
    >
      <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-fondo-oscuro md:flex-row">
        {/* ── MAPA — arriba 45dvh (móvil) / izquierda 55% (escritorio) ── */}
        <div className="relative h-[45dvh] flex-shrink-0 md:h-full md:w-[55%]">
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
                    ? t("titulo", { nombre })
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
                        style={
                          wp.slug === personajeSlug
                            ? { boxShadow: `0 0 0 2px ${accentColor}, 0 0 0 4px var(--color-fondo-oscuro, #0F0E0C)` }
                            : undefined
                        }
                      />
                    </div>
                    <span
                      className={`mt-0.5 text-center text-[9px] uppercase leading-tight tracking-wider transition-colors duration-500 group-hover:text-acento-dorado ${
                        i <= activeIdx ? "text-acento-dorado/75" : "text-stone-500"
                      }`}
                      style={{ maxWidth: 50 }}
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
