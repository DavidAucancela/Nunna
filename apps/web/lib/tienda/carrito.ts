import type { Producto } from "@seres-del-pase/types";

// Lógica pura del carrito (sin React) — la usa CarritoProvider y se testea aparte.

export interface ItemCarrito {
  id: string;
  cantidad: number;
}

export const CANTIDAD_MAXIMA = 99;

export type AccionCarrito =
  | { tipo: "agregar"; id: string; cantidad?: number }
  | { tipo: "fijar"; id: string; cantidad: number }
  | { tipo: "quitar"; id: string }
  | { tipo: "vaciar" }
  | { tipo: "reemplazar"; items: ItemCarrito[] };

const acotar = (n: number) => Math.max(0, Math.min(CANTIDAD_MAXIMA, Math.floor(n)));

export function reducirCarrito(items: ItemCarrito[], accion: AccionCarrito): ItemCarrito[] {
  switch (accion.tipo) {
    case "agregar": {
      const suma = accion.cantidad ?? 1;
      const existe = items.some((i) => i.id === accion.id);
      if (!existe) return [...items, { id: accion.id, cantidad: acotar(suma) }].filter((i) => i.cantidad > 0);
      return items.map((i) => (i.id === accion.id ? { ...i, cantidad: acotar(i.cantidad + suma) } : i));
    }
    case "fijar": {
      const cantidad = acotar(accion.cantidad);
      if (cantidad === 0) return items.filter((i) => i.id !== accion.id);
      return items.map((i) => (i.id === accion.id ? { ...i, cantidad } : i));
    }
    case "quitar":
      return items.filter((i) => i.id !== accion.id);
    case "vaciar":
      return [];
    case "reemplazar":
      return accion.items;
  }
}

export interface LineaCarrito {
  producto: Producto;
  cantidad: number;
  total: number;
}

/** Cruza los items con el catálogo; descarta ids que ya no existan o no estén disponibles. */
export function lineasDelCarrito(items: ItemCarrito[], catalogo: Producto[]): LineaCarrito[] {
  const porId = new Map(catalogo.map((p) => [p.id, p]));
  const lineas: LineaCarrito[] = [];
  for (const item of items) {
    const producto = porId.get(item.id);
    if (!producto || !producto.disponible || item.cantidad <= 0) continue;
    lineas.push({ producto, cantidad: item.cantidad, total: producto.precio * item.cantidad });
  }
  return lineas;
}

export const subtotalDe = (lineas: LineaCarrito[]) => lineas.reduce((s, l) => s + l.total, 0);
export const unidadesDe = (lineas: LineaCarrito[]) => lineas.reduce((s, l) => s + l.cantidad, 0);

/** Lee el carrito guardado sin confiar en su forma (localStorage puede traer cualquier cosa). */
export function parsearCarritoGuardado(raw: string | null): ItemCarrito[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (i): i is ItemCarrito =>
          !!i && typeof i === "object" && typeof (i as ItemCarrito).id === "string" &&
          typeof (i as ItemCarrito).cantidad === "number",
      )
      .map((i) => ({ id: i.id, cantidad: acotar(i.cantidad) }))
      .filter((i) => i.cantidad > 0);
  } catch {
    return [];
  }
}

export function formatoPrecio(valor: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
  }).format(valor);
}
