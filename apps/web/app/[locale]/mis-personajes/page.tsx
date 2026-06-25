import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { getPersonajes } from "@/lib/data";
import { ColeccionClient } from "@/modules/desbloqueo/components/ColeccionClient";
import type { PersonajeLite } from "@/modules/desbloqueo/components/DesbloquearForm";

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
    origen: p.origen ?? null,
    imagenPortada: p.imagenPortada ?? null,
  }));

  return <ColeccionClient personajes={lookup} />;
}
