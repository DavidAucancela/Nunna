import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { getPersonajes, getRecorridos } from "@/lib/data";
import { ColeccionClient } from "@/modules/coleccion/components/ColeccionClient";
import type { PersonajeLite } from "@/modules/coleccion/types";
import { PaseCameraSection } from "@/modules/pases/components/PaseCameraSection";

interface ColeccionPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ColeccionPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coleccion" });
  return {
    title: t("titulo"),
    description: t("subtitulo"),
  };
}

export default async function ColeccionPage({ params }: ColeccionPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const personajes = await getPersonajes({});
  const lookup: PersonajeLite[] = personajes.map((p) => ({
    slug: p.slug,
    nombre: p.nombre,
    nombreKichwa: p.nombreKichwa ?? null,
    origen: p.origen ?? null,
    imagenPortada: p.imagenPortada ?? null,
    imagenBanner: p.imagenBanner ?? null,
    imagenGrupo: p.imagenGrupo ?? null,
    leyenda: p.leyenda ?? null,
    tarjeta: p.tarjeta ?? null,
  }));

  // Premio de la colección completa: recorrido en primera persona del pase real (no demo)
  // con más personajes con ficha. Se arma aquí (server) y el cliente lo muestra solo al
  // reunir todos los personajes.
  const { pases } = await getRecorridos();
  const personajesEnPase = (p: (typeof pases)[number]) => p.waypoints.filter((w) => w.slug).length;
  const recorrido = pases.filter((p) => !p.esDemo).sort((a, b) => personajesEnPase(b) - personajesEnPase(a))[0];

  return (
    <ColeccionClient
      personajes={lookup}
      recorrido={recorrido ? <PaseCameraSection recorridoPase={recorrido} /> : null}
    />
  );
}
