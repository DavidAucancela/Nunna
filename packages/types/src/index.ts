// ─────────────────────────────────────────────────────────────────────────────
// Tipos del dominio — Seres del Pase
// Estos tipos reflejan el schema Prisma y sirven como contrato entre
// el frontend (Next.js), el backend (NestJS) y el CMS (Directus).
// ─────────────────────────────────────────────────────────────────────────────

export type TipoOrigen = "prehispanico" | "colonial" | "mestizo" | "mixto";
export type TipoMedia = "imagen" | "audio" | "video";
export type RolEnPase = "principal" | "acompanante" | "musical" | "ceremonial";
export type RolUsuario = "admin" | "editor" | "lector";
export type Locale = "es" | "qu" | "en";

// ── Personaje ────────────────────────────────────────────────────────────────

export interface Personaje {
  id: string;
  slug: string;
  nombre: string;
  nombreKichwa?: string;
  nombresAlt: string[];
  resumen: string;
  descripcion: string;
  simbolismo?: string;
  origen?: TipoOrigen;
  variantes: VariantePersonaje[];
  elementos: ElementoTraje[];
  apariciones: PasePersonaje[];
  multimedia: Media[];
  testimonios: Testimonio[];
  tags: Tag[];
  publicadoEn?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonajeListItem
  extends Pick<Personaje, "id" | "slug" | "nombre" | "nombreKichwa" | "resumen" | "origen"> {
  imagenPortada?: string;
  totalPases: number;
}

// ── Variante regional ────────────────────────────────────────────────────────

export interface VariantePersonaje {
  id: string;
  personajeId: string;
  nombre: string;
  region: string;
  diferencias: string;
  ubicacion?: Ubicacion;
}

// ── Elemento del traje ───────────────────────────────────────────────────────

export interface ElementoTraje {
  id: string;
  slug: string;
  nombre: string;
  nombreKichwa?: string;
  descripcion: string;
  material?: string;
  significado?: string;
  multimedia: Media[];
  obligatorio: boolean;
  notas?: string;
}

// ── Pase / Festividad ────────────────────────────────────────────────────────

export interface Pase {
  id: string;
  slug: string;
  nombre: string;
  fechaTipo: "fija" | "movil";
  fechaDescripcion: string;
  mes?: number;
  dia?: number;
  resumen: string;
  historia: string;
  ubicacion?: Ubicacion;
  personajes: PasePersonaje[];
  multimedia: Media[];
  testimonios: Testimonio[];
}

export interface PaseListItem
  extends Pick<Pase, "id" | "slug" | "nombre" | "fechaTipo" | "fechaDescripcion" | "mes" | "dia"> {
  imagenPortada?: string;
  totalPersonajes: number;
}

export interface PasePersonaje {
  paseId: string;
  personajeId: string;
  personaje: PersonajeListItem;
  rol?: RolEnPase;
  notas?: string;
}

// ── Ubicación / Geografía ────────────────────────────────────────────────────

export interface Ubicacion {
  id: string;
  nombre: string;
  parroquia?: string;
  canton?: string;
  provincia?: string;
  pais?: string;
  latitud: number;
  longitud: number;
  descripcion?: string;
}

// ── Multimedia ───────────────────────────────────────────────────────────────

export interface Media {
  id: string;
  tipo: TipoMedia;
  url: string;
  urlThumb?: string;
  titulo?: string;
  descripcion?: string;
  altText: string;
  autor?: string;
  licencia?: string;
  fecha?: string;
  orden: number;
}

// ── Testimonio ───────────────────────────────────────────────────────────────

export interface Testimonio {
  id: string;
  texto: string;
  autor: string;
  cargo?: string;
  fecha?: string;
  fuente?: string;
  url?: string;
  citaBibliografica?: string;
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  slug: string;
  nombre: string;
  descripcion?: string;
}

// ── Glosario Kichwa ──────────────────────────────────────────────────────────

export interface GlosarioKichwa {
  id: string;
  palabra: string;
  traduccion: string;
  pronunciacion?: string;
  contexto?: string;
  ejemplos: string[];
}

// ── Búsqueda ─────────────────────────────────────────────────────────────────

export interface SearchResult {
  tipo: "personaje" | "pase" | "elemento" | "glosario";
  id: string;
  slug: string;
  nombre: string;
  resumen?: string;
  score: number;
  imagenPortada?: string;
}

export interface SearchQuery {
  q: string;
  tipo?: SearchResult["tipo"][];
  locale?: Locale;
  limit?: number;
  offset?: number;
}

// ── API responses ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}
