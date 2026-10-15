import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { getPersonaje, getPersonajes } from "@/lib/data";

// Preview al compartir la ficha (WhatsApp, redes): el frente de la tarjeta del imán
// —su ilustración en collage— junto al nombre y la leyenda, con los colores de la
// tarjeta impresa. Se genera en el build (una por personaje e idioma) — sigue SSG.

export const alt = "Nunna — personaje de las fiestas populares del Ecuador";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONDO = "#37220A";
const DORADO = "#F4CB1B";
const FILETE = "#E0B919";
const PLACA = "#FFF9E6";

export async function generateStaticParams() {
  const personajes = await getPersonajes({});
  return personajes.map((p) => ({ slug: p.slug }));
}

/** PNG de `public/` como data URI (satori no lee rutas del sitio ni WebP). */
async function pngDataUri(ruta: string): Promise<string> {
  const buf = await readFile(path.join(process.cwd(), "public", ruta));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const personaje = await getPersonaje(slug);
  const tarjeta = personaje?.tarjeta;
  const ilustracion = tarjeta ? await pngDataUri(tarjeta.ilustracion) : null;
  const nombre = personaje?.nombre ?? "Nunna";
  // Nombre secundario: el impreso en la tarjeta si difiere (Diablo Huma), si no el kichwa.
  const secundario =
    tarjeta && tarjeta.nombre.toLowerCase() !== nombre.toLowerCase()
      ? tarjeta.nombre
      : personaje?.nombreKichwa && personaje.nombreKichwa !== nombre
        ? personaje.nombreKichwa
        : null;
  const leyenda = personaje?.narrativa?.leyenda ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: FONDO,
          padding: 18,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            border: `12px solid ${DORADO}`,
            padding: 14,
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              border: `3px solid ${FILETE}`,
              padding: "0 56px 0 40px",
              gap: 56,
            }}
          >
            {ilustracion && (
              <div
                style={{
                  width: 380,
                  height: 470,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  overflow: "hidden",
                  borderRadius: tarjeta?.llena ? 10 : 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- satori no usa next/image */}
                <img
                  src={ilustracion}
                  alt=""
                  width={380}
                  height={470}
                  style={{ objectFit: tarjeta?.llena ? "cover" : "contain", width: 380, height: 470 }}
                />
              </div>
            )}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 24, letterSpacing: 6, color: DORADO, textTransform: "uppercase" }}>
                Nunna · Fiestas del Ecuador
              </div>
              <div
                style={{
                  marginTop: 18,
                  fontSize: nombre.length > 12 ? 76 : 96,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: PLACA,
                }}
              >
                {nombre}
              </div>
              {secundario && (
                <div
                  style={{
                    marginTop: 14,
                    fontSize: 36,
                    fontWeight: 700,
                    // Los colores de la placa están pensados sobre crema: sobre el café se pierden.
                    color: DORADO,
                  }}
                >
                  {secundario}
                </div>
              )}
              {leyenda && (
                <div style={{ marginTop: 30, fontSize: 32, lineHeight: 1.3, color: PLACA, opacity: 0.85 }}>
                  {`“${leyenda}”`}
                </div>
              )}
              <div style={{ marginTop: 36, fontSize: 26, fontWeight: 700, color: DORADO }}>
                NUNNA-ECU.COM
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
