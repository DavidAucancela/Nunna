import { describe, expect, it } from "vitest";
import { getRecorridos } from "@/lib/data";
import { getElementosPase } from "./elementos.service";
import { mergeRielParadas } from "./riel";

describe("mergeRielParadas", () => {
  it("combina waypoints de personaje + elementos, ordenados por progress ascendente", async () => {
    const recorridos = await getRecorridos();
    const recorridoPase = recorridos.pases.find(
      (p) => p.paseSlug === "instituto-tecnologico-riobamba"
    );
    expect(recorridoPase).toBeDefined();

    const elementos = await getElementosPase("instituto-tecnologico-riobamba");
    const paradas = mergeRielParadas(recorridoPase!.waypoints, elementos);

    expect(paradas).toHaveLength(9);
    for (let i = 1; i < paradas.length; i++) {
      expect(paradas[i]!.progress).toBeGreaterThanOrEqual(paradas[i - 1]!.progress);
    }

    const tipos = paradas.map((p) => p.tipo);
    expect(tipos).toEqual([
      "elemento",
      "personaje",
      "elemento",
      "personaje",
      "elemento",
      "personaje",
      "elemento",
      "personaje",
      "elemento",
    ]);
  });

  it("degrada a solo-personajes cuando no hay elementos curados", async () => {
    const recorridos = await getRecorridos();
    const recorridoPase = recorridos.pases.find(
      (p) => p.paseSlug === "instituto-tecnologico-riobamba"
    );
    const paradas = mergeRielParadas(recorridoPase!.waypoints, []);
    expect(paradas.every((p) => p.tipo === "personaje")).toBe(true);
    expect(paradas).toHaveLength(recorridoPase!.waypoints.length);
  });
});

describe("getElementosPase", () => {
  it("devuelve los 5 elementos curados para instituto-tecnologico-riobamba", async () => {
    const elementos = await getElementosPase("instituto-tecnologico-riobamba");
    expect(elementos).toHaveLength(5);
    expect(elementos.map((e) => e.nombre)).toEqual([
      "Chamiza",
      "Banda de pueblo",
      "Castillo de fuegos",
      "Prioste con canasta",
      "Vaca loca",
    ]);
  });

  it("devuelve [] para cualquier otro slug de pase", async () => {
    expect(await getElementosPase("cdi-gotitas-de-dulzura")).toEqual([]);
    expect(await getElementosPase("pase-inexistente")).toEqual([]);
  });
});
