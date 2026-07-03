import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPases, getRecorridos } from "@/lib/data";
import { localeAlternates } from "@/lib/seo";
import { PaseMapSection } from "@/modules/home/components/PaseMapSection";

interface PasesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PasesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pases" });

  return {
    title: t("titulo"),
    description: t("descripcion"),
    alternates: localeAlternates("/pases", locale),
  };
}

export default async function PasesPage({ params }: PasesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pases" });

  const [pases, recorridos] = await Promise.all([
    getPases({ locale }),
    getRecorridos(),
  ]);

  // Pases con recorrido oficial publicado (horario + ruta)
  const oficiales = pases.filter((p) => p.horario && p.ruta);

  return (
    <div>
      {/* Header */}
      <header className="mx-auto max-w-7xl px-6 pt-16">
        <p className="text-sm uppercase tracking-[0.2em] text-acento-dorado">{t("org")}</p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-texto-claro md:text-5xl">
          {t("titulo")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-400">{t("intro_oficial")}</p>

        {oficiales.length > 0 && (
          <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-acento-dorado/30 bg-acento-dorado/8 px-4 py-2.5">
            <svg className="h-4 w-4 text-acento-dorado" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span className="text-sm font-medium text-acento-dorado">
              {t("dia_banner", { count: oficiales.length })}
            </span>
          </div>
        )}
      </header>

      {/* Mapa interactivo — Un pase, un camino (full-bleed) */}
      <div className="mt-12">
        <PaseMapSection recorridos={recorridos} pasesInfo={pases} />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16">
        {/* Nota de fuente oficial */}
        <section className="rounded-2xl border border-stone-800 bg-stone-900/30 p-5">
          <div className="flex gap-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p className="text-sm text-stone-500">{t("nota")}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
