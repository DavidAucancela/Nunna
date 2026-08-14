import { describe, expect, it } from "vitest";
import { PALETA_RUTAS, colorParaRuta } from "./paleta-rutas";

describe("PALETA_RUTAS", () => {
  it("nunca contiene el rojo reservado para 'provincia seleccionada'", () => {
    expect(PALETA_RUTAS.map((c) => c.toUpperCase())).not.toContain("#B8312F");
  });

  it("no tiene colores duplicados", () => {
    expect(new Set(PALETA_RUTAS).size).toBe(PALETA_RUTAS.length);
  });
});

describe("colorParaRuta", () => {
  it("devuelve un color válido para cualquier índice dentro del rango", () => {
    expect(colorParaRuta(0)).toBe(PALETA_RUTAS[0]);
    expect(colorParaRuta(PALETA_RUTAS.length - 1)).toBe(PALETA_RUTAS[PALETA_RUTAS.length - 1]);
  });

  it("cicla la paleta si hay más rutas que colores", () => {
    expect(colorParaRuta(PALETA_RUTAS.length)).toBe(PALETA_RUTAS[0]);
    expect(colorParaRuta(PALETA_RUTAS.length + 2)).toBe(PALETA_RUTAS[2]);
  });
});
