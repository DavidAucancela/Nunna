import type { PuntoRetiro } from "@seres-del-pase/types";
import { formatoPrecio, subtotalDe, type LineaCarrito } from "./carrito";

// Mensaje del pedido que se envía por WhatsApp (fase 1 de la tienda: sin pasarela de pago).

export type EntregaElegida = { tipo: "envio" } | { tipo: "retiro"; punto: PuntoRetiro };

export interface DatosComprador {
  nombre?: string;
  ciudad?: string;
}

const TEXTOS = {
  es: {
    saludo: "¡Hola Nunna! Quiero hacer este pedido:",
    nombre: { iman: "Imán", figura: "Figura grande en caja", set: "Colección completa (6 imanes) en caja de regalo" },
    subtotal: "Subtotal",
    entrega: "Entrega",
    envio: "Envío a",
    envioSinCiudad: "Envío dentro de Ecuador",
    envioCosto: "(costo de envío a convenir)",
    retiro: "Retiro en",
    nombreLabel: "Nombre",
    cierre: "¿Me confirman disponibilidad y forma de pago? ¡Gracias!",
  },
  en: {
    saludo: "Hi Nunna! I'd like to place this order:",
    nombre: { iman: "Magnet", figura: "Large boxed figure", set: "Full collection (6 magnets) in a gift box" },
    subtotal: "Subtotal",
    entrega: "Delivery",
    envio: "Shipping to",
    envioSinCiudad: "Shipping within Ecuador",
    envioCosto: "(shipping cost to be agreed)",
    retiro: "Pick-up at",
    nombreLabel: "Name",
    cierre: "Could you confirm availability and payment method? Thank you!",
  },
} as const;

export function nombreDeLinea(linea: LineaCarrito, locale: string): string {
  const t = TEXTOS[locale === "en" ? "en" : "es"];
  const base = t.nombre[linea.producto.tipo];
  return linea.producto.nombre ? `${base} ${linea.producto.nombre}` : base;
}

export function armarMensajePedido(
  lineas: LineaCarrito[],
  entrega: EntregaElegida,
  datos: DatosComprador,
  locale: string,
): string {
  const t = TEXTOS[locale === "en" ? "en" : "es"];
  const precio = (n: number) => formatoPrecio(n, locale);
  const nombre = datos.nombre?.trim();
  const ciudad = datos.ciudad?.trim();

  const filas = lineas.map((l) => `• ${l.cantidad} × ${nombreDeLinea(l, locale)} — ${precio(l.total)}`);

  const entregaTexto =
    entrega.tipo === "retiro"
      ? `${t.retiro} ${entrega.punto.lugar} (${entrega.punto.direccion}${
          entrega.punto.locales ? `, locales ${entrega.punto.locales}` : ""
        }), ${entrega.punto.ciudad}`
      : `${ciudad ? `${t.envio} ${ciudad}` : t.envioSinCiudad} ${t.envioCosto}`;

  return [
    t.saludo,
    "",
    ...filas,
    "",
    `${t.subtotal}: ${precio(subtotalDe(lineas))}`,
    `${t.entrega}: ${entregaTexto}`,
    ...(nombre ? [`${t.nombreLabel}: ${nombre}`] : []),
    "",
    t.cierre,
  ].join("\n");
}

/** Solo dígitos: wa.me exige el número internacional sin "+", espacios ni guiones. */
export function normalizarNumero(numero: string | undefined): string | null {
  const digitos = (numero ?? "").replace(/\D/g, "");
  return digitos.length >= 8 ? digitos : null;
}

export function urlPedidoWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
