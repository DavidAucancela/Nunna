import type { Personaje, PersonajeListItem, TipoOrigen, Narrativa, Hotspot, Media, Artesano } from "@seres-del-pase/types";
import personajesRaw from "../data/personajes.json";

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
  if (p.narrativa?.leyenda) item.leyenda = p.narrativa.leyenda;
  return item;
}

function toPersonaje(p: PersonajeRaw): Personaje {
  const multimediaDerived: Media[] = p.imagenPortada
    ? [{ id: `${p.id}-portada`, tipo: "imagen", url: p.imagenPortada, altText: `${p.nombre} — Nunna`, orden: 0 }]
    : [];
  const multimedia = [...multimediaDerived, ...(p.multimedia as Media[])];

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
  if (p.narrativa) personaje.narrativa = p.narrativa as Narrativa;
  if ("imagenBanner" in p && p.imagenBanner) personaje.imagenBanner = p.imagenBanner as string;
  if ("experiencia" in p && p.experiencia) personaje.experiencia = p.experiencia as boolean;
  if ("audioAmbiente" in p && p.audioAmbiente) personaje.audioAmbiente = p.audioAmbiente as string;
  if ("artesanoFirma" in p && p.artesanoFirma) personaje.artesanoFirma = p.artesanoFirma as string;
  if ("artesano" in p && p.artesano) personaje.artesano = p.artesano as Artesano;
  if (p.hotspots?.length) personaje.hotspots = p.hotspots as Hotspot[];
  return personaje;
}

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
