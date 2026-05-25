import { createDirectus, rest, staticToken, readItems, readItem } from "@directus/sdk";
import type {
  Personaje,
  PersonajeListItem,
  Pase,
  PaseListItem,
  GlosarioKichwa,
  Locale,
} from "@seres-del-pase/types";

// ── Cliente Directus ─────────────────────────────────────────────────────────

function getDirectusClient() {
  const url = process.env.DIRECTUS_URL;
  const token = process.env.DIRECTUS_STATIC_TOKEN;

  if (!url || !token) {
    throw new Error("DIRECTUS_URL o DIRECTUS_STATIC_TOKEN no configurados");
  }

  return createDirectus(url).with(staticToken(token)).with(rest());
}

// ── Personajes ────────────────────────────────────────────────────────────────

interface GetPersonajesOptions {
  locale?: string;
  limit?: number;
  offset?: number;
}

export async function getPersonajes(options: GetPersonajesOptions): Promise<PersonajeListItem[]> {
  try {
    const client = getDirectusClient();
    const directusUrl = process.env.DIRECTUS_URL ?? "";
    const items = await client.request(
      readItems("personajes", {
        fields: ["id", "slug", "nombre", "nombreKichwa", "resumen", "origen", "publicadoEn", "imagenPortada"],
        filter: { publicadoEn: { _nnull: true } },
        sort: ["nombre"],
        limit: options.limit ?? 100,
        offset: options.offset ?? 0,
      })
    );

    return (items as (PersonajeListItem & { imagenPortada?: string })[]).map((item) => {
      const base: PersonajeListItem = {
        id: item.id,
        slug: item.slug,
        nombre: item.nombre,
        resumen: item.resumen,
        totalPases: 0,
        ...(item.nombreKichwa !== undefined && { nombreKichwa: item.nombreKichwa }),
        ...(item.origen !== undefined && { origen: item.origen }),
        ...(item.imagenPortada !== undefined && {
          imagenPortada: `${directusUrl}/assets/${item.imagenPortada}`,
        }),
      };
      return base;
    });
  } catch (error) {
    console.error("Error cargando personajes:", error);
    return [];
  }
}

export async function getPersonaje(slug: string, locale?: string): Promise<Personaje | null> {
  try {
    const client = getDirectusClient();
    const items = await client.request(
      readItems("personajes", {
        fields: [
          "id",
          "slug",
          "nombre",
          "nombreKichwa",
          "nombresAlt",
          "resumen",
          "descripcion",
          "simbolismo",
          "origen",
          "publicadoEn",
          "imagenPortada",
        ],
        filter: {
          slug: { _eq: slug },
          publicadoEn: { _nnull: true },
        },
        limit: 1,
      })
    );

    if (!items.length) return null;

    const raw = items[0] as unknown as Record<string, unknown>;
    const directusUrl = process.env.DIRECTUS_URL ?? "";

    const multimedia =
      raw.imagenPortada
        ? [
            {
              id: raw.imagenPortada as string,
              tipo: "imagen" as const,
              url: `${directusUrl}/assets/${raw.imagenPortada}`,
              altText: `${raw.nombre} — Seres del Pase`,
              orden: 0,
            },
          ]
        : [];

    return {
      ...(raw as unknown as Personaje),
      tags: [],
      multimedia,
      variantes: [],
      elementos: [],
      apariciones: [],
      testimonios: [],
    };
  } catch (error) {
    console.error(`Error cargando personaje "${slug}":`, error);
    return null;
  }
}

// ── Pases ─────────────────────────────────────────────────────────────────────

interface GetPasesOptions {
  locale?: string;
}

export async function getPases(options: GetPasesOptions): Promise<PaseListItem[]> {
  try {
    const client = getDirectusClient();
    const items = await client.request(
      readItems("pases", {
        fields: ["id", "slug", "nombre", "fechaTipo", "fechaDescripcion", "mes", "dia"],
        sort: ["mes", "dia"],
      })
    );

    return (items as PaseListItem[]).map((item) => ({
      ...item,
      totalPersonajes: 0,
    }));
  } catch (error) {
    console.error("Error cargando pases:", error);
    return [];
  }
}

// ── Glosario ──────────────────────────────────────────────────────────────────

export async function getGlosario(): Promise<GlosarioKichwa[]> {
  try {
    const client = getDirectusClient();
    const items = await client.request(
      readItems("glosario_kichwa", {
        fields: ["id", "palabra", "traduccion", "pronunciacion", "contexto", "ejemplos"],
        sort: ["palabra"],
      })
    );

    return items as GlosarioKichwa[];
  } catch (error) {
    console.error("Error cargando glosario:", error);
    return [];
  }
}
