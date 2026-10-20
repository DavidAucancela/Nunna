import { describe, expect, it } from "vitest";
import type { Producto } from "@seres-del-pase/types";
import {
  CANTIDAD_MAXIMA,
  lineasDelCarrito,
  parsearCarritoGuardado,
  reducirCarrito,
  subtotalDe,
  unidadesDe,
} from "./carrito";
import { armarMensajePedido, normalizarNumero, urlPedidoWhatsApp } from "./pedido-whatsapp";

const catalogo: Producto[] = [
  { id: "set-coleccion", tipo: "set", precio: 20, disponible: true, nombre: "" },
  { id: "iman-aya-uma", tipo: "iman", precio: 4, disponible: true, nombre: "Diablo Huma", personajeSlug: "aya-uma" },
  { id: "figura-perro", tipo: "figura", precio: 12, disponible: true, nombre: "Perro", personajeSlug: "perro" },
  { id: "figura-payaso", tipo: "figura", precio: 12, disponible: false, nombre: "Payaso", personajeSlug: "payaso" },
];

describe("reducirCarrito", () => {
  it("agrega, suma cantidades y quita", () => {
    let items = reducirCarrito([], { tipo: "agregar", id: "iman-aya-uma" });
    items = reducirCarrito(items, { tipo: "agregar", id: "iman-aya-uma", cantidad: 2 });
    items = reducirCarrito(items, { tipo: "agregar", id: "set-coleccion" });
    expect(items).toEqual([
      { id: "iman-aya-uma", cantidad: 3 },
      { id: "set-coleccion", cantidad: 1 },
    ]);
    expect(reducirCarrito(items, { tipo: "quitar", id: "iman-aya-uma" })).toEqual([{ id: "set-coleccion", cantidad: 1 }]);
  });

  it("fijar en 0 quita el item y la cantidad tiene tope", () => {
    const items = [{ id: "iman-aya-uma", cantidad: 2 }];
    expect(reducirCarrito(items, { tipo: "fijar", id: "iman-aya-uma", cantidad: 0 })).toEqual([]);
    expect(reducirCarrito(items, { tipo: "fijar", id: "iman-aya-uma", cantidad: 500 })[0]?.cantidad).toBe(CANTIDAD_MAXIMA);
  });
});

describe("lineasDelCarrito", () => {
  it("calcula totales y descarta productos inexistentes o no disponibles", () => {
    const lineas = lineasDelCarrito(
      [
        { id: "iman-aya-uma", cantidad: 3 },
        { id: "set-coleccion", cantidad: 1 },
        { id: "figura-payaso", cantidad: 1 },
        { id: "ya-no-existe", cantidad: 1 },
      ],
      catalogo,
    );
    expect(lineas.map((l) => l.producto.id)).toEqual(["iman-aya-uma", "set-coleccion"]);
    expect(subtotalDe(lineas)).toBe(32);
    expect(unidadesDe(lineas)).toBe(4);
  });
});

describe("parsearCarritoGuardado", () => {
  it("tolera basura en localStorage", () => {
    expect(parsearCarritoGuardado(null)).toEqual([]);
    expect(parsearCarritoGuardado("{no es json")).toEqual([]);
    expect(parsearCarritoGuardado('{"id":"x"}')).toEqual([]);
    expect(parsearCarritoGuardado('[{"id":"a","cantidad":2},{"id":3},{"id":"b","cantidad":-1}]')).toEqual([
      { id: "a", cantidad: 2 },
    ]);
  });
});

describe("armarMensajePedido", () => {
  const lineas = lineasDelCarrito(
    [
      { id: "iman-aya-uma", cantidad: 2 },
      { id: "figura-perro", cantidad: 1 },
    ],
    catalogo,
  );

  it("envío: lista, subtotal, ciudad y costo a convenir", () => {
    const msg = armarMensajePedido(lineas, { tipo: "envio" }, { nombre: " Ana ", ciudad: "Cuenca" }, "es");
    expect(msg).toContain("• 2 × Imán Diablo Huma — $8");
    expect(msg).toContain("• 1 × Figura grande en caja Perro — $12");
    expect(msg).toContain("Subtotal: $20");
    expect(msg).toContain("Envío a Cuenca (costo de envío a convenir)");
    expect(msg).toContain("Nombre: Ana");
  });

  it("retiro: incluye lugar, dirección y locales; en inglés", () => {
    const punto = {
      id: "quito-la-mariscal",
      ciudad: "Quito",
      lugar: "Mercado Artesanal La Mariscal",
      direccion: "Reina Victoria y Jorge Washington",
      locales: "114, 107 y 103",
    };
    const msg = armarMensajePedido(lineas, { tipo: "retiro", punto }, {}, "en");
    expect(msg).toContain("2 × Magnet Diablo Huma");
    expect(msg).toContain(
      "Pick-up at Mercado Artesanal La Mariscal (Reina Victoria y Jorge Washington, locales 114, 107 y 103), Quito",
    );
    expect(msg).not.toContain("Name:");
  });

  it("número y URL de wa.me", () => {
    expect(normalizarNumero("+593 99 123-4567")).toBe("593991234567");
    expect(normalizarNumero("")).toBeNull();
    expect(normalizarNumero(undefined)).toBeNull();
    expect(urlPedidoWhatsApp("593991234567", "Hola & más")).toBe("https://wa.me/593991234567?text=Hola%20%26%20m%C3%A1s");
  });
});
