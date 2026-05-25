#!/usr/bin/env node
/**
 * Sube las imágenes de los 4 personajes principales desde /media/ a Directus
 * y vincula cada imagen al campo imagenPortada del personaje correspondiente.
 *
 * Uso: node scripts/upload-images.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MEDIA_DIR = resolve(__dirname, "../media");

const BASE_URL =
  process.env.DIRECTUS_URL || "https://directus-production-d593.up.railway.app";
const TOKEN =
  process.env.DIRECTUS_STATIC_TOKEN || "oWZPyUD4btoC8GoEwc2sabfD17CBWhPX";

const PERSONAJES = [
  {
    slug: "aya-uma",
    imagenFile: "DiabloHuma.png",
    title: "Aya Uma — Seres del Pase",
    altText:
      "Aya Uma con su máscara bifronte de doce cuernos y traje multicolor en el pase riobambeño",
  },
  {
    slug: "diablos-de-lata",
    imagenFile: "Diablo de lata.png",
    title: "Diablo de Lata — Seres del Pase",
    altText:
      "Diablo de Lata con máscara roja de hojalata y sonajeros metálicos en el pase riobambeño",
  },
  {
    slug: "payaso",
    imagenFile: "Payaso.png",
    title: "Payaso (Pukllakuk) — Seres del Pase",
    altText:
      "Payaso del pase riobambeño con traje de colores estridentes y máscara de rasgos exagerados",
  },
  {
    slug: "perro",
    imagenFile: "Perro.png",
    title: "Perro (Allku) — Seres del Pase",
    altText:
      "Perro (Allku) con traje que imita el pelaje de un perro chusco en el pase riobambeño",
  },
];

async function getPersonajeId(slug) {
  const res = await fetch(
    `${BASE_URL}/items/personajes?filter[slug][_eq]=${slug}&fields=id`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  const data = await res.json();
  return data?.data?.[0]?.id ?? null;
}

async function uploadImage(filePath, title, altText) {
  const fileBuffer = readFileSync(filePath);
  const fileName = filePath.split("/").pop();

  const formData = new FormData();
  formData.append("title", title);
  formData.append(
    "file",
    new Blob([fileBuffer], { type: "image/png" }),
    fileName
  );

  const res = await fetch(`${BASE_URL}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data?.data?.id ?? null;
}

async function updatePersonaje(id, imagenPortadaId) {
  const res = await fetch(`${BASE_URL}/items/personajes/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imagenPortada: imagenPortadaId }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update failed ${res.status}: ${text}`);
  }
  return true;
}

async function main() {
  console.log("=".repeat(60));
  console.log("  Seres del Pase — Carga de imágenes");
  console.log("=".repeat(60));

  for (const p of PERSONAJES) {
    const filePath = `${MEDIA_DIR}/${p.imagenFile}`;
    process.stdout.write(`\n📷 ${p.slug} (${p.imagenFile}) ... `);

    if (!existsSync(filePath)) {
      console.log(`⚠  Archivo no encontrado: ${filePath}`);
      continue;
    }

    const personajeId = await getPersonajeId(p.slug);
    if (!personajeId) {
      console.log(`⚠  Personaje no encontrado en Directus: ${p.slug}`);
      continue;
    }

    const fileId = await uploadImage(filePath, p.title, p.altText);
    if (!fileId) {
      console.log(`⚠  Error subiendo imagen`);
      continue;
    }

    await updatePersonaje(personajeId, fileId);
    console.log(`✓ fileId=${fileId}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("  ✅ Imágenes cargadas y vinculadas.");
  console.log("=".repeat(60) + "\n");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
