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

export interface CapituloNarrativa {
  titulo: string;
  texto: string;
}

export interface Narrativa {
  leyenda: string;
  secreto: string;
  capitulos: CapituloNarrativa[];
  /** Términos a enfatizar en los capítulos; los kichwa muestran tooltip con su significado. */
  palabrasClave?: string[];
}

/**
 * "Beat" del modo presentación de la ficha: un elemento visual (que genera el
 * autor) con una frase breve. La secuencia de beats reemplaza el texto largo de
 * la narrativa. `visual` es opcional → si falta, el beat cae a un placeholder.
 */
export interface PresentacionBeat {
  id: string;
  /** /personajes/[slug]-historia-N.webp — lo genera el autor; si falta, se usa placeholder. */
  visual?: string;
  altText: string;
  /** Eyebrow corto opcional ("El origen"). */
  kicker?: string;
  /** Frase corta / título del beat. */
  titulo?: string;
  /** 1–2 frases máximo. */
  texto?: string;
}

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  titulo: string;
  cuerpo: string;
  /** Material del elemento (Fase 4 — anatomía). */
  material?: string;
  /** Quién fabrica el elemento (Fase 4 — anatomía). */
  artesano?: string;
}

export interface Artesano {
  nombre: string;
  ciudad?: string;
  foto?: string;
  bio?: string;
}

/** Arte de la tarjeta impresa que acompaña al imán (frente en collage + ícono de línea del reverso). */
export interface TarjetaArte {
  /** Nombre tal como está impreso (ej. "Diablo Huma" para aya-uma). */
  nombre: string;
  /** Posición en la colección del reverso (1–6, de izquierda a derecha y de arriba abajo). */
  orden: number;
  /** Ilustración del frente, PNG con fondo transparente. */
  ilustracion: string;
  /** Ícono de línea del reverso (negro sobre blanco, cuadrado) — la colección de la tarjeta. */
  icono: string;
  /** Color del nombre en la placa del frente. */
  color: string;
  /**
   * La ilustración llena el recuadro del frente (se recorta), como las de fondo completo;
   * si falta, flota recortada sobre el café de la tarjeta.
   */
  llena?: boolean;
}

export interface Personaje {
  id: string;
  slug: string;
  nombre: string;
  nombreKichwa?: string;
  nombresAlt: string[];
  resumen: string;
  /**
   * Gancho corto (~1 frase) que se pinta grande en la primera pantalla de la
   * ficha; el resto del `resumen` queda plegado bajo "Leer más". Si falta, se
   * deriva la primera frase del `resumen`.
   */
  resumenCorto?: string;
  descripcion: string;
  simbolismo?: string;
  origen?: TipoOrigen;
  imagenBanner?: string;
  tarjeta?: TarjetaArte;
  /** Foto de escena (landscape) para el hero de /desbloquear/[slug] — distinta del banner de la ficha. */
  imagenIngreso?: string;
  /** Activa la experiencia inmersiva v2 (hero "Despertar", etc.). */
  experiencia?: boolean;
  /** Pista de audio ambiente para el hero inmersivo (opt-in, sin autoplay). */
  audioAmbiente?: string;
  /** Firma corta bajo el secreto (ej: "Taller Guamán, Riobamba"). */
  artesanoFirma?: string;
  /** Datos completos del artesano que creó el imán físico. */
  artesano?: Artesano;
  narrativa?: Narrativa;
  /** Secuencia visual del modo presentación (reemplaza el texto largo si existe). */
  presentacion?: PresentacionBeat[];
  hotspots?: Hotspot[];
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
  imagenBanner?: string;
  imagenIngreso?: string;
  /** Foto de los 4 imanes juntos (landscape) — usada en la estantería horizontal donde el retrato se ve muy recortado. */
  imagenGrupo?: string;
  tarjeta?: TarjetaArte;
  totalPases: number;
  /** Frase de la narrativa — texto de relación en el escenario de cross-sell. */
  leyenda?: string;
}

// ── Tienda ───────────────────────────────────────────────────────────────────

/** iman = imán suelto con su tarjeta · set = la colección completa en caja de regalo · figura = figura grande en caja. */
export type TipoProducto = "iman" | "set" | "figura";

/** Producto de la tienda ya resuelto contra personajes.json (nombre e imagen salen del personaje). */
export interface Producto {
  id: string;
  tipo: TipoProducto;
  /** Precio en dólares. */
  precio: number;
  disponible: boolean;
  /** Nombre del personaje tal como está impreso en la tarjeta (vacío para el set). */
  nombre: string;
  /** Personaje del producto (imán / figura). */
  personajeSlug?: string;
  /** Foto del producto; si falta, la UI usa la ilustración de la tarjeta. */
  imagen?: string;
  /** Ilustración de la tarjeta del personaje (fallback visual). */
  ilustracion?: string;
  /** Personajes que trae el set. */
  incluye?: string[];
}

export interface PuntoRetiro {
  id: string;
  ciudad: string;
  lugar: string;
  direccion: string;
  locales?: string;
  horario?: string;
}

export interface EntregaTienda {
  envio: { cobertura: string; costo: "a-convenir" | number };
  retiro: PuntoRetiro[];
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
  /** Datos del recorrido oficial (solo pases con ruta publicada). */
  tipo?: string;
  horario?: string;
  ruta?: string;
  inicio?: string;
  fin?: string;
  personaje?: string;
  /** Slug del personaje destacado — clave de cruce con personajes.json (el nombre es solo display). */
  personajeSlug?: string;
  color?: string;
  /** Slug de la provincia — clave de cruce con provincias.json. */
  provincia?: string;
  ciudad?: string;
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
