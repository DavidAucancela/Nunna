import type { StyleSpecification } from "maplibre-gl";

/**
 * Raster CARTO Dark Matter — compartido por el mapa nacional (`MapaEcuador`) y
 * el de recorrido de provincia (`RecorridosProvincia`). El endpoint GL vector
 * JSON (`/gl/dark-matter-gl-style/style.json`) requiere API key desde 2023; el
 * CDN raster no.
 *
 * `attribution` va en el `source` a propósito: MapLibre la vuelca sola al
 * `AttributionControl` sin que cada componente tenga que reconstruirla.
 */
export const TILE_STYLE: StyleSpecification = {
  version: 8,
  name: "CARTO Dark Matter",
  sources: {
    carto: {
      type: "raster",
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
  layers: [{ id: "carto", type: "raster", source: "carto" }],
};
