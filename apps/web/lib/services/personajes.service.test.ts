import { describe, expect, it } from "vitest";
import { getPersonaje, getPersonajes } from "./personajes.service";

describe("getPersonajes", () => {
  it("devuelve un PersonajeListItem por cada entrada de personajes.json", async () => {
    const personajes = await getPersonajes({});
    expect(personajes.length).toBeGreaterThan(0);
    for (const p of personajes) {
      expect(p.slug).toBeTruthy();
      expect(p.nombre).toBeTruthy();
    }
  });

  it("withImage filtra a los que tienen imagenPortada", async () => {
    const todos = await getPersonajes({});
    const conImagen = await getPersonajes({ withImage: true });
    expect(conImagen.length).toBeLessThanOrEqual(todos.length);
    expect(conImagen.every((p) => !!p.imagenPortada)).toBe(true);
  });

  it("respeta limit/offset", async () => {
    const pagina = await getPersonajes({ limit: 1, offset: 0 });
    expect(pagina).toHaveLength(1);
  });
});

describe("getPersonaje", () => {
  it("construye multimedia con imagenPortada como primer elemento", async () => {
    const personaje = await getPersonaje("aya-uma");
    expect(personaje).not.toBeNull();
    expect(personaje?.multimedia[0]?.id).toBe("aya-uma-portada");
  });

  it("devuelve null para un slug inexistente", async () => {
    const personaje = await getPersonaje("no-existe");
    expect(personaje).toBeNull();
  });

  it("solo mapea experiencia/hotspots cuando el flag está activo", async () => {
    const personaje = await getPersonaje("aya-uma");
    expect(personaje?.experiencia).toBe(true);
    expect(personaje?.hotspots?.length).toBeGreaterThan(0);
  });
});

describe("tarjeta impresa", () => {
  it("cada personaje trae el arte de su tarjeta, con archivos en public/ y orden único", async () => {
    const { existsSync } = await import("node:fs");
    const personajes = await getPersonajes({});
    const ordenes = new Set<number>();
    for (const p of personajes) {
      expect(p.tarjeta, p.slug).toBeDefined();
      expect(existsSync(`public${p.tarjeta!.ilustracion}`), p.tarjeta!.ilustracion).toBe(true);
      expect(existsSync(`public${p.tarjeta!.icono}`), p.tarjeta!.icono).toBe(true);
      ordenes.add(p.tarjeta!.orden);
    }
    // El reverso de la tarjeta ordena los círculos: dos personajes en el mismo lugar se pisarían.
    expect(ordenes.size).toBe(personajes.length);
  });
});
