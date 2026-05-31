import type { Personaje, PersonajeListItem, PaseListItem, GlosarioKichwa, TipoOrigen } from "@seres-del-pase/types";
import personajesRaw from "./data/personajes.json";
import glosarioRaw from "./data/glosario.json";
import pasesRaw from "./data/pases.json";

type PersonajeRaw = typeof personajesRaw[number];

function toListItem(p: PersonajeRaw): PersonajeListItem {
  const item: PersonajeListItem = {
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    resumen: p.resumen,
    totalPases: 0,
  };
  if (p.nombreKichwa) item.nombreKichwa = p.nombreKichwa;
  if (p.origen) item.origen = p.origen as TipoOrigen;
  if (p.imagenPortada) item.imagenPortada = p.imagenPortada;
  return item;
}

function toPersonaje(p: PersonajeRaw): Personaje {
  const multimedia = p.imagenPortada
    ? [
        {
          id: p.id,
          tipo: "imagen" as const,
          url: p.imagenPortada,
          altText: `${p.nombre} — Nunna`,
          orden: 0,
        },
      ]
    : [];

  const personaje: Personaje = {
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    nombresAlt: p.nombresAlt,
    resumen: p.resumen,
    descripcion: p.descripcion,
    variantes: [],
    elementos: [],
    apariciones: [],
    multimedia,
    testimonios: [],
    tags: [],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
  if (p.nombreKichwa) personaje.nombreKichwa = p.nombreKichwa;
  if (p.simbolismo) personaje.simbolismo = p.simbolismo;
  if (p.origen) personaje.origen = p.origen as TipoOrigen;
  if (p.publicadoEn) personaje.publicadoEn = p.publicadoEn;
  return personaje;
}

// ── Personajes ────────────────────────────────────────────────────────────────

interface GetPersonajesOptions {
  locale?: string;
  limit?: number;
  offset?: number;
  withImage?: boolean;
}

export async function getPersonajes(options: GetPersonajesOptions): Promise<PersonajeListItem[]> {
  const { limit = 100, offset = 0, withImage } = options;
  const data = withImage ? personajesRaw.filter((p) => !!p.imagenPortada) : personajesRaw;
  return data.slice(offset, offset + limit).map(toListItem);
}

export async function getPersonaje(slug: string, _locale?: string): Promise<Personaje | null> {
  const raw = personajesRaw.find((p) => p.slug === slug);
  if (!raw) return null;
  return toPersonaje(raw);
}

// ── Pases ─────────────────────────────────────────────────────────────────────

interface GetPasesOptions {
  locale?: string;
}

export async function getPases(_options: GetPasesOptions): Promise<PaseListItem[]> {
  return pasesRaw.map((p) => {
    const pase: PaseListItem = {
      id: p.id,
      slug: p.slug,
      nombre: p.nombre,
      fechaTipo: p.fechaTipo as PaseListItem["fechaTipo"],
      fechaDescripcion: p.fechaDescripcion,
      totalPersonajes: p.totalPersonajes,
    };
    if (p.mes !== null) pase.mes = p.mes;
    if (p.dia !== null) pase.dia = p.dia;
    if (p.imagenPortada) pase.imagenPortada = p.imagenPortada;
    return pase;
  });
}

// ── Glosario ──────────────────────────────────────────────────────────────────

export async function getGlosario(): Promise<GlosarioKichwa[]> {
  return glosarioRaw as GlosarioKichwa[];
}
