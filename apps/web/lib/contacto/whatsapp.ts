// Contacto por WhatsApp: no hay carrito ni pago en el sitio. La persona elige sus personajes en
// /contacto, ve el precio y se abre un chat con el pedido ya escrito.

import { PRECIOS, TAMANO_COLECCION, TAMANO_TRIO, cotizar } from "./precios";

/** Solo dígitos: wa.me exige el número internacional sin "+", espacios ni guiones. */
export function normalizarNumero(numero: string | undefined): string | null {
  const digitos = (numero ?? "").replace(/\D/g, "");
  return digitos.length >= 8 ? digitos : null;
}

/**
 * Número que recibe los mensajes, con código de país (ej. 593991234567).
 * NEXT_PUBLIC_* se incrusta al compilar: en Railway hay que ponerla ANTES del build.
 * Si falta, /contacto muestra "muy pronto" en vez de los botones de WhatsApp.
 */
export const WHATSAPP_CONTACTO = normalizarNumero(process.env.NEXT_PUBLIC_WHATSAPP_CONTACTO);

export function urlWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

const TEXTOS = {
  es: {
    saludo: "¡Hola Nunna!",
    generico: "Quiero saber más sobre los imanes de los personajes.",
    pedir: "Quiero pedir estos imanes:",
    imanes: (n: number) => (n === 1 ? "1 imán" : `${n} imanes`),
    coleccion: `colección completa ${TAMANO_COLECCION} × $${PRECIOS.coleccion}`,
    trio: `promo ${TAMANO_TRIO} × $${PRECIOS.trio}`,
    total: (t: number) => `total $${t}, sin envío.`,
    cierre: "¿Me cuentan cómo pagar y la entrega?",
    envio: "Quiero que me envíen mi pedido:",
    envioGenerico: "Quiero saber cuánto cuesta el envío a mi ciudad.",
    datos: "Mis datos para el envío:",
    campos: ["Nombre:", "Ciudad y provincia:", "Dirección:", "Teléfono:"],
    envioCierre: "¿Cuánto cuesta el envío a mi ciudad?",
  },
  en: {
    saludo: "Hi Nunna!",
    generico: "I'd like to know more about the character magnets.",
    pedir: "I'd like to order these magnets:",
    imanes: (n: number) => (n === 1 ? "1 magnet" : `${n} magnets`),
    coleccion: `full collection ${TAMANO_COLECCION} × $${PRECIOS.coleccion}`,
    trio: `${TAMANO_TRIO} × $${PRECIOS.trio} deal`,
    total: (t: number) => `total $${t}, shipping not included.`,
    cierre: "How do I pay and get them?",
    envio: "I'd like my order shipped:",
    envioGenerico: "I'd like to know how much shipping to my city costs.",
    datos: "My shipping details:",
    campos: ["Name:", "City and province:", "Address:", "Phone:"],
    envioCierre: "How much is shipping to my city?",
  },
} as const;

type Textos = (typeof TEXTOS)[keyof typeof TEXTOS];

function textos(locale: string): Textos {
  return TEXTOS[locale === "en" ? "en" : "es"];
}

/** "3 imanes (promo 3 × $10): total $10, sin envío." */
export function lineaPrecio(cantidad: number, locale: string): string {
  const t = textos(locale);
  const c = cotizar(cantidad);
  const partes: string[] = [];
  if (c.colecciones > 0) partes.push(c.colecciones > 1 ? `${c.colecciones} × ${t.coleccion}` : t.coleccion);
  if (c.trios > 0) partes.push(c.trios > 1 ? `${c.trios} × ${t.trio}` : t.trio);
  if (c.sueltos > 0) partes.push(`${c.sueltos} × $${PRECIOS.unidad}`);
  return `${t.imanes(c.cantidad)} (${partes.join(" + ")}): ${t.total(c.total)}`;
}

function listaPersonajes(personajes: readonly string[]): string[] {
  return personajes.map((p) => `• ${p}`);
}

/** Mensaje del botón principal: el pedido con sus personajes y el total. */
export function armarMensajePedido({ personajes, locale }: { personajes: readonly string[]; locale: string }): string {
  const t = textos(locale);
  if (personajes.length === 0) return `${t.saludo} ${t.generico}`;
  return [
    `${t.saludo} ${t.pedir}`,
    ...listaPersonajes(personajes),
    lineaPrecio(personajes.length, locale),
    t.cierre,
  ].join("\n");
}

/** Mensaje de "Envío a todo Ecuador": el pedido + la plantilla de datos para enviarlo. */
export function armarMensajeEnvio({ personajes, locale }: { personajes: readonly string[]; locale: string }): string {
  const t = textos(locale);
  if (personajes.length === 0) {
    return [`${t.saludo} ${t.envioGenerico}`, t.campos[1]].join("\n");
  }
  return [
    `${t.saludo} ${t.envio}`,
    ...listaPersonajes(personajes),
    lineaPrecio(personajes.length, locale),
    "",
    t.datos,
    ...t.campos,
    "",
    t.envioCierre,
  ].join("\n");
}

/** Enlace a /contacto con el personaje ya marcado. */
export function hrefContacto(slug?: string) {
  return slug
    ? ({ pathname: "/contacto", query: { personaje: slug } } as const)
    : ({ pathname: "/contacto" } as const);
}
