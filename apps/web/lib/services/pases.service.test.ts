import { describe, expect, it } from "vitest";
import { getPases } from "./pases.service";
import { getPersonajes } from "./personajes.service";

describe("getPases", () => {
  it("todo personajeSlug presente existe en personajes.json (o queda documentado como pendiente)", async () => {
    const [pases, personajes] = await Promise.all([getPases({}), getPersonajes({})]);
    const slugs = new Set(personajes.map((p) => p.slug));
    for (const pase of pases) {
      if (pase.personajeSlug) {
        expect(slugs.has(pase.personajeSlug)).toBe(true);
      }
    }
  });

  it("mapea los campos opcionales del recorrido oficial cuando existen", async () => {
    const pases = await getPases({});
    const conRuta = pases.filter((p) => p.ruta);
    expect(conRuta.length).toBeGreaterThan(0);
    for (const p of conRuta) {
      expect(p.horario).toBeTruthy();
    }
  });

  it("pasa la geografía (provincia/ciudad) al PaseListItem cuando existe", async () => {
    const pases = await getPases({});
    const conProvincia = pases.filter((p) => p.provincia);
    // La mayoría declara provincia; una festividad multi-región (Inti Raymi) no,
    // y eso es válido — validate-data solo advierte, no bloquea.
    expect(conProvincia.length).toBeGreaterThan(0);
    for (const p of conProvincia) {
      expect(typeof p.provincia).toBe("string");
    }
  });
});
