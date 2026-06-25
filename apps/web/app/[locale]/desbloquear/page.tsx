import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { getPersonajes } from "@/lib/data";
import { FadeUp } from "@/components/ui/FadeUp";
import { DesbloquearForm, type PersonajeLite } from "@/modules/desbloqueo/components/DesbloquearForm";

interface DesbloquearPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DesbloquearPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "desbloquear" });
  return {
    title: t("titulo"),
    description: t("subtitulo"),
  };
}

export default async function DesbloquearPage({ params }: DesbloquearPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [personajes, t] = await Promise.all([
    getPersonajes({}),
    getTranslations({ locale, namespace: "desbloquear" }),
  ]);

  const lookup: PersonajeLite[] = personajes.map((p) => ({
    slug: p.slug,
    nombre: p.nombre,
    origen: p.origen ?? null,
    imagenPortada: p.imagenPortada ?? null,
  }));

  return (
    <section className="mx-auto max-w-2xl px-5 py-20 sm:px-6 sm:py-28">
      <FadeUp>
        <div className="mb-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-acento-dorado">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-texto-claro sm:text-5xl">
            {t("titulo")}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-stone-400">{t("subtitulo")}</p>
        </div>
        <DesbloquearForm personajes={lookup} />
      </FadeUp>
    </section>
  );
}
