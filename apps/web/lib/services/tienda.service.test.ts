import { describe, expect, it } from "vitest";
import { getEntrega, getProductos } from "./tienda.service";
import { getPersonajes } from "./personajes.service";

describe("getProductos", () => {
  it("cada personaje publicado tiene su imán y el set los incluye a todos", async () => {
    const [productos, personajes] = await Promise.all([getProductos(), getPersonajes({})]);
    const imanes = new Set(productos.filter((p) => p.tipo === "iman").map((p) => p.personajeSlug));
    const set = productos.find((p) => p.tipo === "set");
    for (const personaje of personajes) {
      expect(imanes.has(personaje.slug)).toBe(true);
      expect(set?.incluye).toContain(personaje.slug);
    }
  });

  it("resuelve nombre e imagen desde el personaje y ordena set → imanes → figuras", async () => {
    const productos = await getProductos();
    expect(productos[0]?.tipo).toBe("set");
    const tipos = productos.map((p) => p.tipo);
    expect(tipos.lastIndexOf("iman")).toBeLessThan(tipos.indexOf("figura"));
    const imanAyaUma = productos.find((p) => p.id === "iman-aya-uma");
    expect(imanAyaUma?.nombre).toBe("Diablo Huma");
    expect(imanAyaUma?.imagen).toMatch(/^\/personajes\/aya-uma\//);
    for (const p of productos.filter((x) => x.tipo !== "set")) {
      expect(p.nombre).toBeTruthy();
      expect(p.ilustracion).toBeTruthy();
    }
  });

  it("expone el punto de retiro de Quito", async () => {
    const entrega = await getEntrega();
    expect(entrega.envio.costo).toBe("a-convenir");
    expect(entrega.retiro.map((r) => r.ciudad)).toContain("Quito");
  });
});
