import { describe, expect, it } from "vitest";
import { anclasDeEscenas, pasoPorPosicion, resolverPaso } from "./scroll-por-pasos";

const A = [1000, 1800, 2600, 3400];

describe("resolverPaso", () => {
  it("frena en el primer ancla si un scroll rápido entra desde arriba", () => {
    expect(resolverPaso(-1, 2900, A)).toEqual({ idx: 0, frenarEn: 1000 });
  });

  it("no deja cruzar más de un ancla por gesto", () => {
    expect(resolverPaso(0, 3300, A)).toEqual({ idx: 1, frenarEn: 1800 });
    expect(resolverPaso(3, 1200, A)).toEqual({ idx: 2, frenarEn: 2600 });
  });

  it("entre anclas vecinas el scroll es libre", () => {
    expect(resolverPaso(1, 2200, A)).toEqual({ idx: 1, frenarEn: null });
    expect(resolverPaso(1, 2600, A)).toEqual({ idx: 2, frenarEn: null });
  });

  it("desde el último paso la página sigue normal hacia abajo", () => {
    expect(resolverPaso(3, 9000, A)).toEqual({ idx: 4, frenarEn: null });
  });

  it("desde el primer paso se puede salir hacia arriba", () => {
    expect(resolverPaso(0, 200, A)).toEqual({ idx: -1, frenarEn: null });
  });

  it("al volver desde abajo frena en el último ancla", () => {
    expect(resolverPaso(4, 1500, A)).toEqual({ idx: 3, frenarEn: 3400 });
  });
});

describe("pasoPorPosicion", () => {
  it("ubica el paso sin historia", () => {
    expect(pasoPorPosicion(10, A)).toBe(-1);
    expect(pasoPorPosicion(1000, A)).toBe(0);
    expect(pasoPorPosicion(2000, A)).toBe(1);
    expect(pasoPorPosicion(5000, A)).toBe(4);
  });
});

describe("anclasDeEscenas", () => {
  it("cada ancla cae dentro de su escena (floor(progreso · n))", () => {
    const n = 4;
    anclasDeEscenas(n).forEach((a, i) => expect(Math.min(n - 1, Math.floor(a * n))).toBe(i));
  });
});
