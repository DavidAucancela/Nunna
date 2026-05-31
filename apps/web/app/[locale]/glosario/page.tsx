import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getGlosario } from "@/lib/data";
import { GlosarioClient } from "@/components/glosario/GlosarioClient";

interface GlosarioPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: GlosarioPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("glosario") };
}

export default async function GlosarioPage({ params }: GlosarioPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const palabras = await getGlosario();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-2">
        <p className="text-sm uppercase tracking-[0.2em] text-acento-dorado">Runasimi</p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-texto-claro md:text-5xl">
          {t("glosario")}
          <span className="ml-3 font-serif text-2xl text-acento-dorado">· Kichwa</span>
        </h1>
        <p className="mt-4 text-stone-400">
          Palabras en kichwa (runasimi) relacionadas con los personajes y festividades del pase.
        </p>
      </header>

      <GlosarioClient palabras={palabras} />
    </div>
  );
}
