import { describe, expect, it } from "vitest";
import { boundsFromGeoJSON, boundsFromLineas, boundsFromFeatureCollection } from "./bounds";

describe("boundsFromGeoJSON", () => {
  it("calcula el bbox de un Polygon simple", () => {
    const polygon: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [-79, -1],
          [-78, -1],
          [-78, 0],
          [-79, 0],
          [-79, -1],
        ],
      ],
    };
    expect(boundsFromGeoJSON(polygon)).toEqual([
      [-79, -1],
      [-78, 0],
    ]);
  });

  it("calcula el bbox de un MultiPolygon (ej. Galápagos, islas separadas)", () => {
    const multi: GeoJSON.MultiPolygon = {
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [-91, -1],
            [-90.5, -1],
            [-90.5, -0.5],
            [-91, -0.5],
            [-91, -1],
          ],
        ],
        [
          [
            [-89.5, 0.5],
            [-89, 0.5],
            [-89, 1],
            [-89.5, 1],
            [-89.5, 0.5],
          ],
        ],
      ],
    };
    expect(boundsFromGeoJSON(multi)).toEqual([
      [-91, -1],
      [-89, 1],
    ]);
  });
});

describe("boundsFromLineas", () => {
  it("calcula el bbox de la unión de varias rutas", () => {
    const rutaA: GeoJSON.Position[] = [
      [-78.65, -1.66],
      [-78.6, -1.6],
    ];
    const rutaB: GeoJSON.Position[] = [
      [-78.7, -1.7],
      [-78.55, -1.55],
    ];
    expect(boundsFromLineas([rutaA, rutaB])).toEqual([
      [-78.7, -1.7],
      [-78.55, -1.55],
    ]);
  });

  it("devuelve null para una lista vacía", () => {
    expect(boundsFromLineas([])).toBeNull();
  });
});

describe("boundsFromFeatureCollection", () => {
  it("une el bbox de varias geometrías", () => {
    const a: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [-79, -1],
          [-78, -1],
          [-78, 0],
          [-79, 0],
          [-79, -1],
        ],
      ],
    };
    const b: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [
        [
          [-77, 0],
          [-76, 0],
          [-76, 1],
          [-77, 1],
          [-77, 0],
        ],
      ],
    };
    expect(boundsFromFeatureCollection([a, b])).toEqual([
      [-79, -1],
      [-76, 1],
    ]);
  });
});
