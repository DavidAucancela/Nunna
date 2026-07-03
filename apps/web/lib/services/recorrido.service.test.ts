import { describe, expect, it } from "vitest";
import { getRecorridos } from "./recorrido.service";

describe("getRecorridos", () => {
  it("cruza cada waypoint con su personaje en personajes.json", async () => {
    const recorridos = await getRecorridos();
    expect(recorridos.pases.length).toBeGreaterThan(0);
    for (const pase of recorridos.pases) {
      for (const wp of pase.waypoints) {
        expect(wp.nombre).toBeTruthy();
        expect(wp.alt).toContain("en el pase");
      }
    }
  });

  it("defaultPaseSlug corresponde a uno de los pases del recorrido", async () => {
    const recorridos = await getRecorridos();
    expect(recorridos.pases.some((p) => p.paseSlug === recorridos.defaultPaseSlug)).toBe(true);
  });
});
