"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import type { Recorridos, RecorridoWaypoint } from "@/lib/data";
import type { PaseListItem } from "@seres-del-pase/types";
import { TILE_STYLE } from "@/lib/map/tile-style";
import { boundsFromLineas } from "@/lib/map/bounds";
import { colorParaRuta } from "@/lib/map/paleta-rutas";

// `/personajes/[slug]` se localiza distinto por idioma (`i18n/routing.ts`) — un
// <a> plano (el popup de MapLibre vive fuera del árbol de React, no puede usar
// el <Link> de next-intl) tiene que replicar ese mapeo a mano.
const SEGMENTO_PERSONAJES: Record<string, string> = { es: "personajes", en: "characters" };

function personajeHref(locale: string, slug: string): string {
  return `/${locale}/${SEGMENTO_PERSONAJES[locale] ?? "personajes"}/${slug}`;
}

function escapeHtml(s: string): string {
  const mapa: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return s.replace(/[&<>"']/g, (c) => mapa[c]!);
}

interface Props {
  recorridos: Recorridos;
  pasesInfo?: PaseListItem[];
}

/**
 * Mapa estático de la provincia: TODOS sus recorridos con ruta trazada se
 * dibujan a la vez, cada uno de un color distinto (`colorParaRuta`) + selector
 * de pases (chips, reemplaza a la leyenda estática). Sin selección ("Todos")
 * se ven las N rutas a la vez, igual que antes. Al elegir un pase se atenúan
 * las demás rutas y marcadores, la cámara encuadra solo esa ruta, y debajo
 * aparece una grilla con sus personajes (imagen + link a ficha) — antes solo
 * visible pasando el mouse por cada marcador uno por uno.
 */
export function RecorridosProvincia({ recorridos, pasesInfo = [] }: Props) {
  const t = useTranslations("pases.mapa");
  const tPases = useTranslations("pases");
  const locale = useLocale();

  const outerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, MapLibreMarker[]>>(new Map());
  const [mapReady, setMapReady] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  // Provincia distinta (navegación en /pases) → vuelve a "todos los recorridos".
  useEffect(() => {
    setActiveSlug(null);
  }, [recorridos]);

  // Init perezoso: el mapa se crea vía IntersectionObserver cuando la sección
  // se acerca al viewport — no descargar maplibre-gl/tiles si el usuario no
  // llega hasta aquí (misma estrategia que ya usaba PaseMapSection).
  useEffect(() => {
    const wrapper = outerRef.current;
    const container = mapContainerRef.current;
    if (!wrapper || !container) return;

    let map: MapLibreMap | undefined;
    let ro: ResizeObserver | undefined;
    let cancelled = false;

    function init() {
      (async () => {
        const maplibregl = (await import("maplibre-gl")).default;
        if (cancelled) return;

        const syncHeight = () => {
          container!.style.width = "100%";
          container!.style.height = `${wrapper!.offsetHeight || 480}px`;
        };
        syncHeight();

        map = new maplibregl.Map({
          container: container!,
          style: TILE_STYLE,
          center: recorridos.pases[0]?.centro ?? [-78.65, -1.66],
          zoom: recorridos.pases[0]?.zoom ?? 12,
          attributionControl: { compact: true },
        });
        mapRef.current = map;

        ro = new ResizeObserver(() => {
          syncHeight();
          map?.resize();
        });
        ro.observe(wrapper!);

        const m = map;
        m.on("error", (e: unknown) => console.error("[MapLibre]", e));

        m.on("load", () => {
          const featuresRuta: GeoJSON.Feature[] = recorridos.pases.map((pase) => ({
            type: "Feature",
            properties: { paseSlug: pase.paseSlug },
            geometry: { type: "LineString", coordinates: pase.ruta },
          }));

          m.addSource("rutas", {
            type: "geojson",
            data: { type: "FeatureCollection", features: featuresRuta },
          });

          // Expresión `match` por `paseSlug` → color: una sola capa para N rutas,
          // en vez de un addLayer por pase.
          const colorMatch: unknown[] = ["match", ["get", "paseSlug"]];
          recorridos.pases.forEach((pase, i) => {
            colorMatch.push(pase.paseSlug, colorParaRuta(i));
          });
          colorMatch.push("#999999"); // fallback, no debería alcanzarse nunca

          m.addLayer({
            id: "rutas-glow",
            type: "line",
            source: "rutas",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": colorMatch as unknown as maplibregl.ExpressionSpecification,
              "line-width": 12,
              "line-opacity": 0.14,
            },
          });
          m.addLayer({
            id: "rutas-line",
            type: "line",
            source: "rutas",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": colorMatch as unknown as maplibregl.ExpressionSpecification,
              "line-width": 3.5,
              "line-opacity": 1,
            },
          });

          const bounds = boundsFromLineas(recorridos.pases.map((p) => p.ruta));
          if (bounds) {
            m.fitBounds(bounds, { padding: { top: 48, bottom: 48, left: 48, right: 48 }, duration: 0 });
          }

          recorridos.pases.forEach((pase, i) => {
            const color = colorParaRuta(i);
            pase.waypoints.forEach((wp, wi) => {
              const el = document.createElement("div");
              el.style.cssText = [
                "width:24px",
                "height:24px",
                "border-radius:50%",
                `background:${color}`,
                "border:2px solid rgba(255,255,255,0.85)",
                `box-shadow:0 0 10px ${color}99`,
                "display:flex",
                "align-items:center",
                "justify-content:center",
                "color:#0F0E0C",
                "font-size:11px",
                "font-weight:700",
                "cursor:pointer",
              ].join(";");
              el.textContent = String(wi + 1);

              const verFicha = tPases("ver_ficha_personaje", { nombre: wp.nombre });
              const popupHtml = `
                <div style="width:200px;font-family:ui-sans-serif,system-ui,sans-serif;">
                  <img src="${wp.imagen}" alt="${escapeHtml(wp.alt)}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;display:block" />
                  <div style="padding:8px 2px 2px;">
                    <p style="margin:0;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${color};">${escapeHtml(pase.paseNombre)}</p>
                    <h4 style="margin:2px 0 4px;font-size:14px;font-weight:700;color:#EFEAE0;">${escapeHtml(wp.nombre)}</h4>
                    <a href="${personajeHref(locale, wp.slug)}" style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${color};text-decoration:none;">${escapeHtml(verFicha)} →</a>
                  </div>
                </div>
              `;
              const popup = new maplibregl.Popup({
                offset: 16,
                closeButton: true,
                maxWidth: "220px",
              }).setHTML(popupHtml);

              const marker = new maplibregl.Marker({ element: el, anchor: "center" })
                .setLngLat(wp.coord)
                .setPopup(popup)
                .addTo(m);

              el.addEventListener("mouseenter", () => {
                if (!popup.isOpen()) marker.togglePopup();
              });

              const lista = markersRef.current.get(pase.paseSlug) ?? [];
              lista.push(marker);
              markersRef.current.set(pase.paseSlug, lista);
            });
          });

          setMapReady(true);
        });
      })();
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          init();
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" }
    );
    io.observe(wrapper);

    return () => {
      cancelled = true;
      io.disconnect();
      ro?.disconnect();
      map?.remove();
      mapRef.current = null;
      markersRef.current.clear();
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Selección de pase: atenúa el resto, encuadra la ruta elegida y muestra
  // solo sus marcadores. `activeSlug === null` = "Todos" (comportamiento
  // original: las N rutas a la vez, cámara sobre la unión de todas). ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const opacityLinea: unknown[] = ["match", ["get", "paseSlug"]];
    const opacityGlow: unknown[] = ["match", ["get", "paseSlug"]];
    recorridos.pases.forEach((pase) => {
      const activa = activeSlug === null || pase.paseSlug === activeSlug;
      opacityLinea.push(pase.paseSlug, activa ? 1 : 0.12);
      opacityGlow.push(pase.paseSlug, activa ? 0.14 : 0.03);
    });
    opacityLinea.push(1);
    opacityGlow.push(0.14);
    map.setPaintProperty("rutas-line", "line-opacity", opacityLinea as maplibregl.ExpressionSpecification);
    map.setPaintProperty("rutas-glow", "line-opacity", opacityGlow as maplibregl.ExpressionSpecification);

    markersRef.current.forEach((marcadores, slug) => {
      const visible = activeSlug === null || slug === activeSlug;
      marcadores.forEach((m) => {
        m.getElement().style.display = visible ? "" : "none";
      });
    });

    const paseActivo = activeSlug ? recorridos.pases.find((p) => p.paseSlug === activeSlug) : undefined;
    const bounds = boundsFromLineas(paseActivo ? [paseActivo.ruta] : recorridos.pases.map((p) => p.ruta));
    if (bounds) {
      map.fitBounds(bounds, { padding: { top: 48, bottom: 48, left: 48, right: 48 }, duration: 500 });
    }
  }, [activeSlug, mapReady, recorridos]);

  return (
    <div ref={outerRef} className="mx-auto max-w-7xl px-6">
      <div className="relative h-[55vh] min-h-[360px] w-full overflow-hidden rounded-2xl border border-borde-sutil md:h-[65vh]">
        <div ref={mapContainerRef} className="absolute inset-0" />
      </div>

      {/* ── Selector: color ↔ pase. Con 1 solo pase queda como leyenda simple
          (nada que elegir); con ≥2 cada chip es un botón que aísla esa ruta. ── */}
      <div className="mt-5">
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-stone-600">
          {t("leyenda_titulo")}
        </p>
        <ul className="flex flex-wrap gap-2">
          {recorridos.pases.length > 1 && (
            <li>
              <button
                type="button"
                onClick={() => setActiveSlug(null)}
                aria-pressed={activeSlug === null}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  activeSlug === null
                    ? "border-acento-dorado bg-acento-dorado/10 text-texto-claro"
                    : "border-borde-sutil text-stone-400 hover:border-stone-600 hover:text-texto-claro"
                }`}
              >
                {t("todos")}
              </button>
            </li>
          )}
          {recorridos.pases.map((pase, i) => {
            const paseInfo = pasesInfo.find((p) => p.slug === pase.paseSlug);
            const activo = activeSlug === pase.paseSlug;
            const esBoton = recorridos.pases.length > 1;
            const contenido = (
              <>
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colorParaRuta(i) }}
                />
                <span>{pase.paseNombre}</span>
                {paseInfo?.tipo && <span className="text-xs text-stone-500">· {paseInfo.tipo}</span>}
              </>
            );
            if (!esBoton) {
              return (
                <li key={pase.paseSlug} className="flex items-center gap-2 text-sm text-texto-claro">
                  {contenido}
                </li>
              );
            }
            return (
              <li key={pase.paseSlug}>
                <button
                  type="button"
                  onClick={() => setActiveSlug(activo ? null : pase.paseSlug)}
                  aria-pressed={activo}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    activo
                      ? "border-acento-dorado bg-acento-dorado/10 text-texto-claro"
                      : "border-borde-sutil text-stone-400 hover:border-stone-600 hover:text-texto-claro"
                  }`}
                >
                  {contenido}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Personajes del pase elegido — reemplaza tener que pasar el mouse
          por cada marcador del mapa uno por uno. ── */}
      {activeSlug && (
        <div className="mt-6">
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-stone-600">
            {t("personajes_titulo")}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {(recorridos.pases.find((p) => p.paseSlug === activeSlug)?.waypoints ?? []).map(
              (wp: RecorridoWaypoint) => (
                <Link
                  key={wp.slug}
                  href={{ pathname: "/personajes/[slug]", params: { slug: wp.slug } }}
                  className="group overflow-hidden rounded-xl border border-borde-sutil transition-colors hover:border-acento-dorado"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-stone-900">
                    <Image
                      src={wp.imagen}
                      alt={wp.alt}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw"
                    />
                  </div>
                  <p className="px-2.5 py-2 text-sm font-medium text-texto-claro">{wp.nombre}</p>
                </Link>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
