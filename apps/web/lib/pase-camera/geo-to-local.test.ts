import { describe, expect, it } from "vitest";
import { getRecorridos } from "@/lib/data";
import { construirPuntosControl, proyectarLocal, simplificarRuta } from "./geo-to-local";

describe("proyectarLocal", () => {
  it("el propio centro proyecta a [0, 0]", () => {
    const centro: [number, number] = [-78.6502, -1.6657];
    expect(proyectarLocal(centro, centro)).toEqual([0, 0]);
  });

  it("mueve hacia +x al este y +z al norte", () => {
    const centro: [number, number] = [-78.6502, -1.6657];
    const [x, z] = proyectarLocal(centro, [-78.6492, -1.6647]);
    expect(x).toBeGreaterThan(0);
    expect(z).toBeGreaterThan(0);
  });
});

describe("simplificarRuta", () => {
  it("colapsa una línea recta a solo sus extremos", () => {
    const puntos: [number, number][] = [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ];
    expect(simplificarRuta(puntos, 1)).toEqual([
      [0, 0],
      [3, 0],
    ]);
  });

  it("conserva un giro real que excede el epsilon", () => {
    const puntos: [number, number][] = [
      [0, 0],
      [5, 0],
      [10, 0],
      [10, 5],
      [10, 10],
    ];
    const simplificado = simplificarRuta(puntos, 1);
    expect(simplificado).toContainEqual([10, 0]);
    expect(simplificado[0]).toEqual([0, 0]);
    expect(simplificado[simplificado.length - 1]).toEqual([10, 10]);
  });

  it("con epsilon muy grande colapsa a solo los extremos", () => {
    const puntos: [number, number][] = [
      [0, 0],
      [5, 0],
      [10, 0],
      [10, 5],
      [10, 10],
    ];
    expect(simplificarRuta(puntos, 1000)).toEqual([
      [0, 0],
      [10, 10],
    ]);
  });
});

describe("construirPuntosControl", () => {
  it("deriva puntos de control válidos de la ruta real de instituto-tecnologico-riobamba", async () => {
    const recorridos = await getRecorridos();
    const recorridoPase = recorridos.pases.find(
      (p) => p.paseSlug === "instituto-tecnologico-riobamba"
    );
    expect(recorridoPase).toBeDefined();

    const puntos = construirPuntosControl(recorridoPase!.ruta, recorridoPase!.centro);

    expect(puntos.length).toBeGreaterThanOrEqual(2);
    expect(puntos.length).toBeLessThan(recorridoPase!.ruta.length);
    for (const [, y] of puntos) {
      expect(y).toBeGreaterThan(1);
      expect(y).toBeLessThan(2.5);
    }
  });
});
