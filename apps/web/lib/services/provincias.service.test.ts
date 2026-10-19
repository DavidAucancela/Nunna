import { describe, expect, it } from "vitest";
import {
  getProvincias,
  getProvinciasConPases,
  limitarPasesPorProvincia,
  MAX_PASES_POR_PROVINCIA,
} from "./provincias.service";
import { getPases } from "./pases.service";
import { acotarRecorridos, getRecorridos } from "./recorrido.service";

describe("getProvincias", () => {
  it("cataloga las 24 provincias con slug único y región válida", async () => {
    const provincias = await getProvincias();
    expect(provincias).toHaveLength(24);

    const slugs = new Set(provincias.map((p) => p.slug));
    expect(slugs.size).toBe(24);

    const regiones = new Set(["sierra", "costa", "amazonia", "insular"]);
    for (const p of provincias) {
      expect(regiones.has(p.region)).toBe(true);
      expect(p.nombre).toBeTruthy();
    }
  });
});

describe("getProvinciasConPases", () => {
  it("solo devuelve provincias con al menos un pase con fecha de calendario", async () => {
    const pases = await getPases({});
    const provincias = await getProvinciasConPases(pases);

    expect(provincias.length).toBeGreaterThan(0);

    for (const provincia of provincias) {
      expect(provincia.pases.length).toBeGreaterThan(0);
      for (const pase of provincia.pases) {
        expect(pase.provincia).toBe(provincia.slug);
        expect(pase.mes).not.toBeUndefined();
      }
    }
  });

  it("no filtra por recorrido trazado: una provincia marcada puede tener pases sin ruta", async () => {
    const pases = await getPases({});
    const [provincias, recorridos] = await Promise.all([
      getProvinciasConPases(pases),
      getRecorridos(),
    ]);
    const conRecorrido = new Set(recorridos.pases.map((r) => r.paseSlug));
    // El criterio de inclusión es "tiene pase con mes", no "tiene ruta": debe
    // seguir habiendo pases dentro de provincias marcadas que no tienen trazado
    // (cobertura parcial → la sección Recorrido cae a "próximamente" por pase).
    const pasesSinRuta = provincias
      .flatMap((p) => p.pases)
      .filter((pase) => !conRecorrido.has(pase.slug));
    expect(pasesSinRuta.length).toBeGreaterThan(0);
  });

  it("toda provincia referenciada por un pase existe en el catálogo", async () => {
    const [pases, catalogo] = await Promise.all([getPases({}), getProvincias()]);
    const slugs = new Set(catalogo.map((p) => p.slug));
    for (const pase of pases) {
      if (pase.provincia) {
        expect(slugs.has(pase.provincia)).toBe(true);
      }
    }
  });

  it("cada pase con recorrido resuelve su provincia", async () => {
    const [recorridos, pases] = await Promise.all([getRecorridos(), getPases({})]);
    for (const r of recorridos.pases) {
      expect(pases.find((p) => p.slug === r.paseSlug)?.provincia).toBeTruthy();
    }
  });
});

describe("acotarRecorridos", () => {
  it("deja solo los recorridos pedidos", async () => {
    const recorridos = await getRecorridos();
    const elegido = recorridos.pases[0]!.paseSlug;

    const acotado = acotarRecorridos(recorridos, [elegido]);

    expect(acotado.pases).toHaveLength(1);
    expect(acotado.pases[0]!.paseSlug).toBe(elegido);
  });

  it("descarta recorridos fuera del conjunto (no deja saltar a otra provincia)", async () => {
    const recorridos = await getRecorridos();
    const acotado = acotarRecorridos(recorridos, ["slug-inexistente"]);
    expect(acotado.pases).toHaveLength(0);
  });
});

describe("limitarPasesPorProvincia", () => {
  it("deja como máximo 5 pases por provincia y prioriza los que tienen recorrido", async () => {
    const [pases, recorridos] = await Promise.all([getPases({}), getRecorridos()]);
    const rutas = new Map(recorridos.pases.map((r) => [r.paseSlug, r.esDemo]));
    const completas = await getProvinciasConPases(pases);
    const limitadas = limitarPasesPorProvincia(completas, rutas);

    for (const provincia of limitadas) {
      expect(provincia.pases.length).toBeLessThanOrEqual(MAX_PASES_POR_PROVINCIA);
      const original = completas.find((p) => p.slug === provincia.slug)!;
      const conRutaTotal = original.pases.filter((p) => rutas.has(p.slug)).length;
      const conRutaQuedan = provincia.pases.filter((p) => rutas.has(p.slug)).length;
      // Ningún pase recorrible se queda fuera mientras quepa.
      expect(conRutaQuedan).toBe(Math.min(conRutaTotal, MAX_PASES_POR_PROVINCIA));
    }
    // Chimborazo tiene más de 5 en el calendario: el recorte sí aplica ahí.
    expect(completas.find((p) => p.slug === "chimborazo")!.pases.length).toBeGreaterThan(
      MAX_PASES_POR_PROVINCIA,
    );
  });
});
