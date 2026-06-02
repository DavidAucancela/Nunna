import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { getPersonaje, getPersonajes } from "@/lib/data";
import { HistoriaExperiencia } from "@/components/historia/HistoriaExperiencia";

interface HistoriaPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const personajes = await getPersonajes({});
  return personajes.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: HistoriaPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const personaje = await getPersonaje(slug, locale);

  if (!personaje) return { title: "No encontrado" };

  return {
    title: `${personaje.nombre} — Historia`,
    description: personaje.narrativa?.leyenda ?? personaje.resumen,
    robots: { index: false, follow: false },
  };
}

export default async function HistoriaPage({ params }: HistoriaPageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  const personaje = await getPersonaje(slug, locale);
  if (!personaje || !personaje.narrativa) notFound();

  const t = await getTranslations({ locale, namespace: "historia" });

  const imagenPortada = personaje.multimedia.find((m) => m.tipo === "imagen")?.url;
  const imagenBanner = personaje.imagenBanner ?? undefined;

  return (
    <div className="min-h-screen bg-black">
      <HistoriaExperiencia
        nombre={personaje.nombre}
        nombreKichwa={personaje.nombreKichwa}
        nombresAlt={personaje.nombresAlt}
        origen={personaje.origen}
        imagenPortada={imagenPortada}
        imagenBanner={imagenBanner}
        narrativa={personaje.narrativa}
        slugPersonaje={personaje.slug}
        locale={locale}
        t={{
          saltar: t("saltar"),
          capitulo: t("capitulo"),
          secreto_titulo: t("secreto_titulo"),
          secreto_subtitulo: t("secreto_subtitulo"),
          cta: t("cta"),
          volver: t("volver"),
          espiritu_despierta: t("espiritu_despierta"),
          scroll_hint: t("scroll_hint"),
          copiar_secreto: t("copiar_secreto"),
          copiado: t("copiado"),
          compartir_whatsapp: t("compartir_whatsapp"),
          compartir_mensaje: t("compartir_mensaje"),
        }}
      />
    </div>
  );
}
