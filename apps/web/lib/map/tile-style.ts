/**
 * Estilo base de todos los mapas MapLibre de la app: el mapa nacional
 * (`MapaEcuador`), el de recorridos de provincia (`RecorridosProvincia`) y los
 * dos scrollytelling de recorrido (`RecorridoScrollytelling` en /pases,
 * `PaseInmersivo` en la ficha del personaje).
 *
 * ⚠ Antes se usaba el CDN raster de CARTO Dark Matter sin API key. CARTO cerró
 * ese acceso (2025): ahora cada tile keyless vuelve como un PNG placeholder con
 * la marca de agua "API KEY REQUIRED". Se cambió a **OpenFreeMap** (estilo
 * vector `dark`): sin API key, sin límite de uso, atribución OSM ya incluida en
 * el propio style JSON. Proyecto comunitario de OpenStreetMap
 * (https://openfreemap.org); si algún día hace falta independencia total de
 * infraestructura, se auto-hostea con un `docker run` y se cambia solo esta URL.
 *
 * Override por entorno: `NEXT_PUBLIC_MAP_STYLE_URL` (p. ej. un estilo de CARTO
 * con `?api_key=`, Stadia `alidade_smooth_dark`, o un pmtiles propio). Debe ser
 * un estilo **oscuro** — el resto de la UI (líneas de ruta rojas/doradas,
 * degradados a `fondo-oscuro`) asume fondo oscuro.
 *
 * MapLibre acepta `style` como URL string o como objeto `StyleSpecification`;
 * aquí es siempre una URL, así que los consumidores hacen `style: TILE_STYLE`
 * sin más.
 */
export const TILE_STYLE: string =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
  "https://tiles.openfreemap.org/styles/dark";
