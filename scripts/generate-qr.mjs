#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Nunna — Generador de QR para las tarjetas de imán
//
// Genera un PNG de alta resolución por cada personaje activo, codificando la
// URL absoluta con esquema (https://.../es/personajes/<slug>). Reemplaza la
// generación manual anterior (dos PNG en apps/web/public/qr/ hechos a mano sin
// "https://", que QrScanner.tsx no podía resolver — ver docs/GUIA-DOMINIO-QR.md §6).
//
// Uso:
//   node scripts/generate-qr.mjs                          # usa NEXT_PUBLIC_SITE_URL o el fallback
//   NEXT_PUBLIC_SITE_URL=https://nunna-ecu.com node scripts/generate-qr.mjs
// ─────────────────────────────────────────────────────────────────────────────

import QRCode from "qrcode";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

// Mismo fallback que apps/web/lib/site-url.ts — mientras no haya dominio propio
// activo, los QR deben apuntar a donde el sitio realmente responde.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nunnaec-production.up.railway.app";
const OUT_DIR = path.join(REPO_ROOT, "apps/web/public/qr");
const PERSONAJES_PATH = path.join(REPO_ROOT, "apps/web/lib/data/personajes.json");

const personajes = JSON.parse(await readFile(PERSONAJES_PATH, "utf-8"));

for (const { slug } of personajes) {
  const url = `${SITE_URL}/es/personajes/${slug}`;
  const dest = path.join(OUT_DIR, `qr-${slug}.png`);
  await QRCode.toFile(dest, url, {
    width: 1024, // resolución alta para imprenta, no para pantalla
    margin: 2,
    errorCorrectionLevel: "H", // tolera bien el desgaste/roce del imán físico
  });
  console.log(`${slug} → ${url} → ${dest}`);
}
