import { describe, expect, it } from "vitest";
import { getProvincias, getProvinciasConPases, provinciaDePase } from "./provincias.service";
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

  it("incluye provincias sin recorrido trazado todavía (ej. la mayoría de las nuevas)", async () => {
    const pases = await getPases({});
    const [provincias, recorridos] = await Promise.all([
      getProvinciasConPases(pases),
      getRecorridos(),
    ]);
    const conRecorrido = new Set(recorridos.pases.map((r) => r.paseSlug));
    const sinRecorrido = provincias.filter(
      (p) => !p.pases.some((pase) => conRecorrido.has(pase.slug))
    );
    expect(sinRecorrido.length).toBeGreaterThan(0);
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
    const recorridos = await getRecorridos();
    for (const r of recorridos.pases) {
      expect(provinciaDePase(r.paseSlug)).toBeTruthy();
    }
  });
});

describe("acotarRecorridos", () => {
  it("deja solo los recorridos pedidos y fija cuál abre", async () => {
    const recorridos = await getRecorridos();
    const elegido = recorridos.pases[0]!.paseSlug;

    const acotado = acotarRecorridos(recorridos, [elegido], elegido);

    expect(acotado.defaultPaseSlug).toBe(elegido);
    expect(acotado.pases).toHaveLength(1);
    expect(acotado.pases[0]!.paseSlug).toBe(elegido);
  });

  it("descarta recorridos fuera del conjunto (no deja saltar a otra provincia)", async () => {
    const recorridos = await getRecorridos();
    const acotado = acotarRecorridos(recorridos, ["slug-inexistente"], "slug-inexistente");
    expect(acotado.pases).toHaveLength(0);
  });
});
