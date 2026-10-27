"use client";

import { useEffect, useRef } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { TILE_STYLE } from "@/lib/map/tile-style";
import { PUNTO_RETIRO } from "@/lib/contacto/retiro";

/** Mapa pequeño (fijo, no se arrastra) con el punto de retiro. Carga MapLibre al acercarse a pantalla. */
export function MapaRetiro({ etiqueta }: { etiqueta: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    let map: MapLibreMap | undefined;
    let cancelado = false;

    const io = new IntersectionObserver(
      async ([entrada]) => {
        if (!entrada?.isIntersecting) return;
        io.disconnect();
        const maplibregl = (await import("maplibre-gl")).default;
        if (cancelado) return;

        map = new maplibregl.Map({
          container,
          style: TILE_STYLE,
          center: PUNTO_RETIRO.lngLat,
          zoom: 15.6,
          interactive: false,
          attributionControl: { compact: true },
        });
        map.on("error", (e: unknown) => console.error("[MapLibre]", e));

        const punto = document.createElement("span");
        punto.className = "relative flex h-5 w-5";
        punto.innerHTML =
          '<span class="absolute inset-0 rounded-full bg-acento-rojo/60 motion-safe:animate-ping"></span>' +
          '<span class="relative block h-5 w-5 rounded-full border-2 border-white bg-acento-rojo shadow-lg"></span>';
        new maplibregl.Marker({ element: punto, anchor: "center" }).setLngLat(PUNTO_RETIRO.lngLat).addTo(map);

        // Con interactive:false la atribución compacta nunca se pliega sola (ver MapaEcuador).
        map.on("load", () => {
          container.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
        });
      },
      { rootMargin: "200px" },
    );
    io.observe(container);

    return () => {
      cancelado = true;
      io.disconnect();
      map?.remove();
    };
  }, []);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={etiqueta}
      className="h-44 w-full overflow-hidden rounded-xl border border-borde-sutil bg-stone-900"
    />
  );
}
