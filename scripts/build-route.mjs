#!/usr/bin/env node
/**
 * build-route.mjs — Hornea las rutas del recorrido sobre las calles reales.
 *
 * Por cada pase en apps/web/lib/data/recorrido.json toma los `coord` de sus
 * waypoints, pide a OSRM la ruta peatonal que los une siguiendo las calles, y
 * reemplaza `ruta` con la geometría densa devuelta. La ruta queda estática en el
 * JSON: cero llamadas en runtime, el sitio sigue siendo SSG.
 *
 * Uso:  node scripts/build-route.mjs
 *
 * Requiere red. Usa el servidor demo público de OSRM (perfil foot). Si falla por
 * rate-limit o caída, reintenta más tarde o cambia OSRM_BASE por una instancia
 * propia / OpenRouteService.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../apps/web/lib/data/recorrido.json");
const OSRM_BASE = "https://router.project-osrm.org/route/v1/foot";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function snapRoute(coords) {
  const path = coords.map(([lon, lat]) => `${lon},${lat}`).join(";");
  const url = `${OSRM_BASE}/${path}?overview=full&geometries=geojson`;
  const res = await fetch(url);
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

async function main() {
  const data = JSON.parse(await readFile(DATA_PATH, "utf8"));
  if (!Array.isArray(data.pases)) {
    throw new Error("recorrido.json no tiene array `pases`");
  }

  for (const pase of data.pases) {
    const anchors = (pase.waypoints ?? []).map((wp) => wp.coord);
    if (anchors.length < 2) {
      console.warn(`· ${pase.paseSlug}: <2 waypoints, se omite`);
      continue;
    }
    process.stdout.write(`· ${pase.paseSlug}: ${anchors.length} anclas → OSRM… `);
    try {
      const { geometry, snapped } = await snapRoute(anchors);
      const before = pase.ruta?.length ?? 0;
      pase.ruta = geometry.map(round6);
      // Alinear los pines de waypoint a la calle (sobre la línea de la ruta)
      snapped.forEach((loc, i) => {
        if (loc && pase.waypoints[i]) pase.waypoints[i].coord = round6(loc);
      });
      console.log(`ok (${before} → ${pase.ruta.length} puntos, pines alineados)`);
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
