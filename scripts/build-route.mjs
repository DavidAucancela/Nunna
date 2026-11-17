#!/usr/bin/env node
/**
 * build-route.mjs — Hornea las rutas del recorrido sobre las calles reales.
 *
 * Por cada pase en apps/web/lib/data/recorrido.json toma los `coord` de sus
 * waypoints, pide a OSRM la ruta peatonal que los une siguiendo las calles, y
 * reemplaza `ruta` con la geometría densa devuelta. La ruta queda estática en el
 * JSON: cero llamadas en runtime, el sitio sigue siendo SSG.
 *
 * Uso:  node scripts/build-route.mjs                 → todos los pases
 *       node scripts/build-route.mjs slug-a slug-b   → solo esos pases
 *
 * Dos modos por pase:
 *  - Sin `anclas`: la ruta une los `coord` de los waypoints, en orden, y cada pin
 *    se pega a la calle (modo original).
 *  - Con `anclas` (lista ordenada de [lon,lat]: inicio, cada giro del afiche, fin):
 *    la ruta pasa por esas anclas — así sigue la vuelta exacta del afiche oficial,
 *    también ida y vuelta por la misma calle. Cada waypoint se coloca SOBRE la ruta
 *    en su `progress` (fracción del largo), así los personajes quedan repartidos.
 *
 * Requiere red. Usa el OSRM peatonal de FOSSGIS (routing.openstreetmap.de, perfil
 * foot de verdad: ignora sentidos de circulación). El demo de project-osrm.org solo
 * corría perfil car. Si falla por rate-limit o caída, reintenta más tarde o cambia
 * OSRM_BASE (variable de entorno) por otra instancia.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../apps/web/lib/data/recorrido.json");
const OSRM_BASE =
  process.env.OSRM_BASE ?? "https://routing.openstreetmap.de/routed-foot/route/v1/driving";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function snapRoute(coords) {
  const path = coords.map(([lon, lat]) => `${lon},${lat}`).join(";");
  const url = `${OSRM_BASE}/${path}?overview=full&geometries=geojson`;
  const res = await fetch(url, { headers: { "User-Agent": "nunna-build-route/1.0 (+https://nunna-ecu.com)" } });
  if (!res.ok) throw new Error(`OSRM ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.code !== "Ok" || !json.routes?.[0]) {
    throw new Error(`OSRM sin ruta: ${json.code ?? "desconocido"}`);
  }
  return {
    geometry: json.routes[0].geometry.coordinates, // [[lon,lat], ...]
    // ubicación de cada ancla pegada a la calle, en orden de entrada
    snapped: (json.waypoints ?? []).map((w) => w.location),
  };
}

const round6 = ([lon, lat]) => [Number(lon.toFixed(6)), Number(lat.toFixed(6))];

/** Distancia aproximada en metros (suficiente a escala de ciudad). */
function metros([lon1, lat1], [lon2, lat2]) {
  const kx = 111320 * Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180);
  return Math.hypot((lon2 - lon1) * kx, (lat2 - lat1) * 110574);
}

/** Punto de la polilínea a la fracción `t` (0–1) de su largo. */
function puntoEnFraccion(linea, t) {
  const tramos = linea.slice(1).map((p, i) => metros(linea[i], p));
  const total = tramos.reduce((a, b) => a + b, 0);
  let falta = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 0; i < tramos.length; i++) {
    if (falta <= tramos[i] || i === tramos.length - 1) {
      const f = tramos[i] ? falta / tramos[i] : 0;
      const [a, b] = [linea[i], linea[i + 1]];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
    falta -= tramos[i];
  }
  return linea[linea.length - 1];
}

async function main() {
  const data = JSON.parse(await readFile(DATA_PATH, "utf8"));
  if (!Array.isArray(data.pases)) {
    throw new Error("recorrido.json no tiene array `pases`");
  }

  const soloSlugs = new Set(process.argv.slice(2));
  for (const slug of soloSlugs) {
    if (!data.pases.some((p) => p.paseSlug === slug)) throw new Error(`No hay pase "${slug}" en recorrido.json`);
  }

  for (const pase of data.pases) {
    if (soloSlugs.size && !soloSlugs.has(pase.paseSlug)) continue;
    const conAnclas = Array.isArray(pase.anclas) && pase.anclas.length >= 2;
    const anchors = conAnclas ? pase.anclas : (pase.waypoints ?? []).map((wp) => wp.coord);
    if (anchors.length < 2) {
      console.warn(`· ${pase.paseSlug}: <2 waypoints, se omite`);
      continue;
    }
    process.stdout.write(`· ${pase.paseSlug}: ${anchors.length} anclas → OSRM… `);
    try {
      const { geometry, snapped } = await snapRoute(anchors);
      const before = pase.ruta?.length ?? 0;
      pase.ruta = geometry.map(round6);
      if (conAnclas) {
        // Cada personaje va sobre la ruta, en su fracción del recorrido
        for (const wp of pase.waypoints ?? []) wp.coord = round6(puntoEnFraccion(geometry, wp.progress));
        const largo = geometry.slice(1).reduce((acc, p, i) => acc + metros(geometry[i], p), 0);
        console.log(`ok (${before} → ${pase.ruta.length} puntos, ${(largo / 1000).toFixed(2)} km)`);
      } else {
        // Alinear los pines de waypoint a la calle (sobre la línea de la ruta)
        snapped.forEach((loc, i) => {
          if (loc && pase.waypoints[i]) pase.waypoints[i].coord = round6(loc);
        });
        console.log(`ok (${before} → ${pase.ruta.length} puntos, pines alineados)`);
      }
    } catch (err) {
      console.log(`FALLÓ — ${err.message} (ruta sin cambios)`);
    }
    await sleep(1100); // cortesía con el servidor demo (rate limit)
  }

  await writeFile(DATA_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log("✓ recorrido.json actualizado");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
