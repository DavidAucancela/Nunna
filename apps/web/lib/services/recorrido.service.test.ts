import { describe, expect, it } from "vitest";
import { getRecorridos } from "./recorrido.service";

describe("getRecorridos", () => {
  it("cada waypoint tiene nombre y alt, con o sin ficha de personaje", async () => {
    const recorridos = await getRecorridos();
    expect(recorridos.pases.length).toBeGreaterThan(0);
    for (const pase of recorridos.pases) {
      for (const wp of pase.waypoints) {
        expect(wp.nombre).toBeTruthy();
        expect(wp.alt).toContain("en el pase");
      }
    }
  });

  it("waypoint con personajeSlug se cruza con personajes.json (trae slug)", async () => {
    const recorridos = await getRecorridos();
    const conFicha = recorridos.pases
      .flatMap((p) => p.waypoints)
      .filter((wp) => wp.slug);
    expect(conFicha.length).toBeGreaterThan(0);
    for (const wp of conFicha) {
      expect(wp.slug).toBeTruthy();
    }
  });

  it("waypoint inline (sin personajeSlug) queda sin slug pero con nombre/leyenda", async () => {
    const recorridos = await getRecorridos();
    const inline = recorridos.pases
      .flatMap((p) => p.waypoints)
      .filter((wp) => !wp.slug);
    // Hay recorridos demo sembrados sin ficha de personaje todavía.
    expect(inline.length).toBeGreaterThan(0);
    for (const wp of inline) {
      expect(wp.slug).toBeUndefined();
      expect(wp.nombre).toBeTruthy();
    }
  });

  it("marca esDemo en los recorridos de referencia y no en los reales", async () => {
    const recorridos = await getRecorridos();
    const real = recorridos.pases.find(
      (p) => p.paseSlug === "instituto-tecnologico-riobamba"
    );
    expect(real?.esDemo).toBe(false);
    expect(recorridos.pases.some((p) => p.esDemo)).toBe(true);
  });

  it("defaultPaseSlug corresponde a uno de los pases del recorrido", async () => {
    const recorridos = await getRecorridos();
    expect(recorridos.pases.some((p) => p.paseSlug === recorridos.defaultPaseSlug)).toBe(true);
  });
});
