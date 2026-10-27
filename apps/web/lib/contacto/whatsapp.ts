// Contacto por WhatsApp: no hay carrito ni pago en el sitio. La persona elige sus personajes en
// /contacto, ve el precio, elige la entrega (envío o retiro) y se abre un chat con el pedido ya escrito.

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
    soy: (nombre: string) => `Soy ${nombre}.`,
    cuenta: (correo: string) => `Te escribo desde mi cuenta ${correo}.`,
    generico: "Quiero saber más sobre los imanes de los personajes.",
    retirar: "Me gustaría llevarme estos imanes y pasar a retirarlos al Mercado Artesanal La Mariscal, en Quito:",
    imanes: (n: number) => (n === 1 ? "1 imán" : `${n} imanes`),
    serian: (n: number) => (n === 1 ? "Sería" : "Serían"),
    con: "con la",
    unidad: (n: number) => (n === 1 ? `a $${PRECIOS.unidad}` : `a $${PRECIOS.unidad} cada uno`),
    coleccion: `colección completa ${TAMANO_COLECCION} × $${PRECIOS.coleccion}`,
    trio: `promo ${TAMANO_TRIO} × $${PRECIOS.trio}`,
    total: (t: number) => `$${t} en total`,
    masEnvio: (t: number) => `$${t} más el envío`,
    retiroCierre: "¿Qué día puedo pasar por ellos y cómo les pago? ¡Gracias!",
    envio: "Me gustaría pedir estos imanes con envío:",
    envioGenerico: "Quiero saber cuánto cuesta el envío a mi ciudad.",
    datos: "Les dejo mis datos para el envío:",
    campoNombre: "Nombre:",
    campos: ["Ciudad y provincia:", "Dirección:", "Teléfono:"],
    envioCierre: "¿Cuánto me costaría el envío? ¡Gracias!",
  },
  en: {
    saludo: "Hi Nunna!",
    soy: (nombre: string) => `I'm ${nombre}.`,
    cuenta: (correo: string) => `I'm writing from my account ${correo}.`,
    generico: "I'd like to know more about the character magnets.",
    retirar: "I'd love to get these magnets and pick them up at Mercado Artesanal La Mariscal, in Quito:",
    imanes: (n: number) => (n === 1 ? "1 magnet" : `${n} magnets`),
    serian: () => "That's",
    con: "with the",
    unidad: (n: number) => (n === 1 ? `at $${PRECIOS.unidad}` : `at $${PRECIOS.unidad} each`),
    coleccion: `full collection ${TAMANO_COLECCION} × $${PRECIOS.coleccion}`,
    trio: `${TAMANO_TRIO} × $${PRECIOS.trio} deal`,
    total: (t: number) => `$${t} in total`,
    masEnvio: (t: number) => `$${t} plus shipping`,
    retiroCierre: "When can I come by, and how do I pay? Thanks!",
    envio: "I'd like to order these magnets with shipping:",
    envioGenerico: "I'd like to know how much shipping to my city costs.",
    datos: "Here are my shipping details:",
    campoNombre: "Name:",
    campos: ["City and province:", "Address:", "Phone:"],
    envioCierre: "How much would shipping be? Thanks!",
  },
} as const;

type Textos = (typeof TEXTOS)[keyof typeof TEXTOS];

function textos(locale: string): Textos {
  return TEXTOS[locale === "en" ? "en" : "es"];
}

/**
 * "Serían 3 imanes con la promo 3 × $10: $10 en total." — con `envio`, "…: $10 más el envío."
 * Si mezcla promo y sueltos, el desglose va entre paréntesis.
 */
export function lineaPrecio(cantidad: number, locale: string, { envio = true }: { envio?: boolean } = {}): string {
  const t = textos(locale);
  const c = cotizar(cantidad);
  const promos: string[] = [];
  if (c.colecciones > 0) promos.push(c.colecciones > 1 ? `${c.colecciones} × ${t.coleccion}` : t.coleccion);
  if (c.trios > 0) promos.push(c.trios > 1 ? `${c.trios} × ${t.trio}` : t.trio);
  let detalle: string;
  if (promos.length === 0) detalle = t.unidad(c.sueltos);
  else if (promos.length === 1 && c.sueltos === 0 && c.colecciones + c.trios === 1) detalle = `${t.con} ${promos[0]}`;
  else detalle = `(${[...promos, ...(c.sueltos > 0 ? [`${c.sueltos} × $${PRECIOS.unidad}`] : [])].join(" + ")})`;
  const monto = envio ? t.masEnvio(c.total) : t.total(c.total);
  return `${t.serian(c.cantidad)} ${t.imanes(c.cantidad)} ${detalle}: ${monto}.`;
}

function listaPersonajes(personajes: readonly string[]): string[] {
  return personajes.map((p) => `• ${p}`);
}

interface DatosMensaje {
  personajes: readonly string[];
  locale: string;
  /** Nombre de la cuenta (Google lo trae); va en el saludo. */
  nombre?: string | null | undefined;
  /** Correo de la cuenta: solo se usa si no hay nombre (enlace mágico). */
  correo?: string | null | undefined;
}

/** "¡Hola Nunna! Soy Ana Pérez." · "¡Hola Nunna! Te escribo desde mi cuenta ana@…" · "¡Hola Nunna!" */
function saludo(t: Textos, nombre?: string | null, correo?: string | null): string {
  const quien = nombre?.trim() ? t.soy(nombre.trim()) : correo ? t.cuenta(correo) : null;
  return quien ? `${t.saludo} ${quien}` : t.saludo;
}

/** Mensaje de "Retiro en Quito": el pedido para pasar a recogerlo al mercado. */
export function armarMensajeRetiro({ personajes, locale, nombre, correo }: DatosMensaje): string {
  const t = textos(locale);
  if (personajes.length === 0) return `${saludo(t, nombre, correo)} ${t.generico}`;
  return [
    saludo(t, nombre, correo),
    t.retirar,
    ...listaPersonajes(personajes),
    lineaPrecio(personajes.length, locale, { envio: false }),
    "",
    t.retiroCierre,
  ].join("\n");
}

/** Mensaje de "Envío a todo Ecuador": el pedido + la plantilla de datos para enviarlo. */
export function armarMensajeEnvio({ personajes, locale, nombre, correo }: DatosMensaje): string {
  const t = textos(locale);
  if (personajes.length === 0) {
    return [`${saludo(t, nombre, correo)} ${t.envioGenerico}`, t.campos[0]].join("\n");
  }
  return [
    saludo(t, nombre, correo),
    t.envio,
    ...listaPersonajes(personajes),
    lineaPrecio(personajes.length, locale),
    "",
    t.datos,
    // Con el nombre de la cuenta ya en el saludo, no se vuelve a pedir.
    ...(nombre?.trim() ? [] : [t.campoNombre]),
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
