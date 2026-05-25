#!/usr/bin/env node
/**
 * setup-directus.mjs
 * Crea las 13 colecciones de Seres del Pase en Directus via API REST.
 * Uso: node scripts/setup-directus.mjs
 *
 * Es idempotente — si una colección ya existe, la omite y continúa.
 */

const BASE_URL =
  process.env.DIRECTUS_URL || "https://directus-production-d593.up.railway.app";
const TOKEN =
  process.env.DIRECTUS_STATIC_TOKEN || "oWZPyUD4btoC8GoEwc2sabfD17CBWhPX";

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const msg = data?.errors?.[0]?.message ?? res.statusText;
    // "already exists" no es un error real — colección duplicada, la saltamos
    if (msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("duplicate")) {
      console.log(`    (ya existe, se omite)`);
      return null;
    }
    console.warn(`    ⚠  ${method} ${path} → ${res.status}: ${msg}`);
    return null;
  }
  return data;
}

// ─── Constructores de campo ───────────────────────────────────────────────────

function f(field, type, meta = {}, schema = {}) {
  return { field, type, meta, schema };
}

const ID = f("id", "integer", { hidden: true, readonly: true }, { is_primary_key: true, has_auto_increment: true });

// ─── Crear colección ──────────────────────────────────────────────────────────

async function col(name, displayName, icon, fields) {
  process.stdout.write(`\n📦 ${displayName} (${name}) ... `);
  const result = await api("POST", "/collections", {
    collection: name,
    meta: {
      icon,
      translations: [{ language: "es-ES", translation: displayName }],
    },
    schema: {},
    fields: [ID, ...fields],
  });
  if (result) process.stdout.write("✓\n");
  return result;
}

// ─── Crear relación ───────────────────────────────────────────────────────────

async function rel(collection, field, related, meta = {}) {
  const result = await api("POST", "/relations", {
    collection,
    field,
    related_collection: related,
    meta,
  });
  if (result) console.log(`    ✓ ${collection}.${field} → ${related}`);
  else console.log(`    (relación ${collection}.${field} → ${related} ya existe o falló)`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("  Seres del Pase — Setup de Directus");
  console.log(`  URL: ${BASE_URL}`);
  console.log("=".repeat(60));

  // ── 1. ubicaciones ──────────────────────────────────────────────────────────
  await col("ubicaciones", "Ubicaciones", "place", [
    f("nombre",      "string",  { interface: "input",           required: true  }, { is_nullable: false }),
    f("parroquia",   "string",  { interface: "input"                            }, {}),
    f("canton",      "string",  { interface: "input"                            }, { default_value: "Riobamba"   }),
    f("provincia",   "string",  { interface: "input"                            }, { default_value: "Chimborazo" }),
    f("pais",        "string",  { interface: "input"                            }, { default_value: "Ecuador"    }),
    f("latitud",     "float",   { interface: "input",           required: true  }, { is_nullable: false }),
    f("longitud",    "float",   { interface: "input",           required: true  }, { is_nullable: false }),
    f("descripcion", "text",    { interface: "input-multiline"                  }, {}),
  ]);

  // ── 2. tags ─────────────────────────────────────────────────────────────────
  await col("tags", "Tags", "label", [
    f("nombre",      "string",  { interface: "input",           required: true  }, { is_nullable: false }),
    f("slug",        "string",  { interface: "input",           required: true  }, { is_nullable: false, is_unique: true }),
    f("color",       "string",  { interface: "select-color"                     }, {}),
    f("descripcion", "string",  { interface: "input"                            }, {}),
  ]);

  // ── 3. glosario_kichwa ──────────────────────────────────────────────────────
  await col("glosario_kichwa", "Glosario Kichwa", "menu_book", [
    f("palabra",        "string", { interface: "input",          required: true }, { is_nullable: false }),
    f("traduccion",     "string", { interface: "input",          required: true }, { is_nullable: false }),
    f("pronunciacion",  "string", { interface: "input",          note: "Transcripción fonética" }, {}),
    f("contexto",       "text",   { interface: "input-multiline"                }, {}),
    f("ejemplos",       "text",   { interface: "input-multiline"                }, {}),
  ]);

  // ── 4. media ────────────────────────────────────────────────────────────────
  await col("media", "Media", "perm_media", [
    f("tipo",      "string", {
      interface: "select-dropdown",
      required: true,
      options: { choices: [
        { text: "Imagen", value: "imagen" },
        { text: "Audio",  value: "audio"  },
        { text: "Video",  value: "video"  },
      ]},
    }, { is_nullable: false }),
    f("url",       "string", { interface: "input",          required: true, note: "URL pública del archivo" }, { is_nullable: false }),
    f("altText",   "string", { interface: "input",          required: true, note: "Descripción para lectores de pantalla (OBLIGATORIO)" }, { is_nullable: false }),
    f("descripcion","text",  { interface: "input-multiline"                  }, {}),
    f("credito",   "string", { interface: "input",          note: "Autor / fuente"  }, {}),
    f("archivo",   "uuid",   { interface: "file", special: ["file"]          }, {}),
  ]);

  // ── 5. personajes ───────────────────────────────────────────────────────────
  await col("personajes", "Personajes", "person", [
    f("slug",          "string",    { interface: "input",              required: true, note: "ej: aya-uma" }, { is_nullable: false, is_unique: true }),
    f("nombre",        "string",    { interface: "input",              required: true }, { is_nullable: false }),
    f("nombreKichwa",  "string",    { interface: "input",              note: "Nombre en kichwa / runasimi" }, {}),
    f("nombresAlt",    "json",      { interface: "tags", special: ["cast-json"], note: "Otros nombres conocidos" }, {}),
    f("resumen",       "text",      { interface: "input-multiline",    required: true, note: "1-2 párrafos de introducción" }, { is_nullable: false }),
    f("descripcion",   "text",      { interface: "input-rich-text-html", required: true }, { is_nullable: false }),
    f("simbolismo",    "text",      { interface: "input-multiline"     }, {}),
    f("origen",        "text",      { interface: "input-multiline",    note: "Prehispánico, colonial, mestizo, etc." }, {}),
    f("publicadoEn",   "timestamp", { interface: "datetime",           note: "Dejar vacío para guardar como borrador" }, {}),
    f("imagenPortada", "uuid",      { interface: "file", special: ["file"] }, {}),
  ]);

  // ── 6. variantes_personaje ──────────────────────────────────────────────────
  await col("variantes_personaje", "Variantes de Personaje", "alt_route", [
    f("personajeId",  "integer", { interface: "select-dropdown-m2o", required: true }, { is_nullable: false }),
    f("nombre",       "string",  { interface: "input",               required: true }, { is_nullable: false }),
    f("region",       "string",  { interface: "input",               required: true, note: "ej: Cacha, Chimborazo" }, { is_nullable: false }),
    f("diferencias",  "text",    { interface: "input-multiline",     required: true }, { is_nullable: false }),
    f("ubicacionId",  "integer", { interface: "select-dropdown-m2o" }, {}),
  ]);

  // ── 7. elementos_traje ──────────────────────────────────────────────────────
  await col("elementos_traje", "Elementos del Traje", "checkroom", [
    f("slug",         "string", { interface: "input",          required: true }, { is_nullable: false, is_unique: true }),
    f("nombre",       "string", { interface: "input",          required: true }, { is_nullable: false }),
    f("nombreKichwa", "string", { interface: "input"                          }, {}),
    f("descripcion",  "text",   { interface: "input-multiline", required: true }, { is_nullable: false }),
    f("material",     "string", { interface: "input",          note: "ej: cuero, lana, plumas" }, {}),
    f("significado",  "text",   { interface: "input-multiline" }, {}),
  ]);

  // ── 8. pases ────────────────────────────────────────────────────────────────
  await col("pases", "Pases", "celebration", [
    f("slug",             "string",  { interface: "input",          required: true }, { is_nullable: false, is_unique: true }),
    f("nombre",           "string",  { interface: "input",          required: true }, { is_nullable: false }),
    f("fechaTipo",        "string",  {
      interface: "select-dropdown",
      required: true,
      options: { choices: [{ text: "Fecha fija", value: "fija" }, { text: "Fecha móvil", value: "movil" }] },
    }, { is_nullable: false }),
    f("fechaDescripcion", "string",  { interface: "input",          required: true, note: "ej: 6 de enero / Corpus Christi" }, { is_nullable: false }),
    f("mes",              "integer", { interface: "input",          note: "1-12" }, {}),
    f("dia",              "integer", { interface: "input",          note: "1-31" }, {}),
    f("resumen",          "text",    { interface: "input-multiline", required: true }, { is_nullable: false }),
    f("historia",         "text",    { interface: "input-rich-text-html", required: true }, { is_nullable: false }),
    f("ubicacionId",      "integer", { interface: "select-dropdown-m2o" }, {}),
  ]);

  // ── 9. testimonios ──────────────────────────────────────────────────────────
  await col("testimonios", "Testimonios", "format_quote", [
    f("contenido",   "text",    { interface: "input-multiline",  required: true, note: "Cita textual" }, { is_nullable: false }),
    f("fuente",      "string",  { interface: "input",            required: true, note: "Título del libro, artículo o entrevista" }, { is_nullable: false }),
    f("autorNombre", "string",  { interface: "input"             }, {}),
    f("autorRol",    "string",  { interface: "input",            note: "ej: Historiador, Portador de la tradición" }, {}),
    f("anio",        "integer", { interface: "input",            note: "Año de la fuente" }, {}),
    f("personajeId", "integer", { interface: "select-dropdown-m2o" }, {}),
    f("paseId",      "integer", { interface: "select-dropdown-m2o" }, {}),
  ]);

  // ── 10. personaje_elementos (M2M junction) ──────────────────────────────────
  await col("personaje_elementos", "Personaje ↔ Elementos", "link", [
    f("personajeId", "integer", {}, {}),
    f("elementoId",  "integer", {}, {}),
    f("obligatorio", "boolean", { interface: "boolean" }, { default_value: true }),
    f("notas",       "string",  { interface: "input"   }, {}),
  ]);

  // ── 11. pase_personajes (M2M junction) ─────────────────────────────────────
  await col("pase_personajes", "Pase ↔ Personajes", "link", [
    f("paseId",      "integer", {}, {}),
    f("personajeId", "integer", {}, {}),
    f("rol",         "string",  {
      interface: "select-dropdown",
      options: { choices: [{ text: "Principal", value: "principal" }, { text: "Acompañante", value: "acompanante" }] },
    }, {}),
    f("notas", "string", { interface: "input" }, {}),
  ]);

  // ── 12. media_relaciones (polymorphic junction) ─────────────────────────────
  await col("media_relaciones", "Media ↔ Entidades", "link", [
    f("mediaId",     "integer", {}, {}),
    f("entidadTipo", "string",  {
      interface: "select-dropdown",
      options: { choices: [
        { text: "Personaje",          value: "personajes"      },
        { text: "Pase",               value: "pases"           },
        { text: "Elemento de traje",  value: "elementos_traje" },
      ]},
    }, {}),
    f("entidadId",   "string",  { interface: "input" }, {}),
    f("orden",       "integer", { interface: "input" }, { default_value: 0 }),
  ]);

  // ── 13. personaje_tags (M2M junction) ──────────────────────────────────────
  await col("personaje_tags", "Personaje ↔ Tags", "link", [
    f("personajeId", "integer", {}, {}),
    f("tagId",       "integer", {}, {}),
  ]);

  // ─── Relaciones ─────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("  Creando relaciones...");
  console.log("─".repeat(60));

  await rel("variantes_personaje", "personajeId", "personajes");
  await rel("variantes_personaje", "ubicacionId",  "ubicaciones");

  await rel("pases",       "ubicacionId", "ubicaciones");

  await rel("testimonios", "personajeId", "personajes");
  await rel("testimonios", "paseId",      "pases");

  await rel("personaje_elementos", "personajeId", "personajes");
  await rel("personaje_elementos", "elementoId",  "elementos_traje");

  await rel("pase_personajes",     "paseId",      "pases");
  await rel("pase_personajes",     "personajeId", "personajes");

  await rel("media_relaciones",    "mediaId",     "media");

  await rel("personaje_tags",      "personajeId", "personajes");
  await rel("personaje_tags",      "tagId",       "tags");

  // ─── Resultado ───────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("  ✅ Setup completado.");
  console.log(`  Verifica en: ${BASE_URL}/admin`);
  console.log("=".repeat(60) + "\n");
}

main().catch((err) => {
  console.error("\n❌ Error fatal:", err.message);
  process.exit(1);
});
