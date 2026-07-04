import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PersonajesGrid } from "@/modules/personajes/components/PersonajesGrid";
import { FadeUp } from "@/components/ui/FadeUp";
import { getPersonajes } from "@/lib/data";
import { localeAlternates } from "@/lib/seo";

interface PersonajesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PersonajesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "personajes" });
  return {
    title: t("titulo"),
    description: t("descripcion"),
    alternates: localeAlternates("/personajes", locale),
  };
}

const PROXIMOS = [
  { nombre: "Curiquingue", nombreKichwa: "Kuriquingui" },
  { nombre: "Sacha Runa", nombreKichwa: "Sacha Runa" },
  { nombre: "Rey Moro", nombreKichwa: "Muru Inka" },
  { nombre: "Capitán", nombreKichwa: "Kapitán" },
  { nombre: "Ángel", nombreKichwa: "Ángel" },
];

export default async function PersonajesPage({ params }: PersonajesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "personajes" });

  const personajes = await getPersonajes({ locale, withImage: true });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-12 mt-4">
        <p className="text-sm uppercase tracking-[0.2em] text-acento-dorado">
          Ecuador
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-texto-claro md:text-5xl">
          {t("titulo")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-400">{t("descripcion")}</p>
      </header>

      <PersonajesGrid personajes={personajes} />

      {/* Próximamente */}
      <FadeUp delay={0.2}>
        <div className="mt-16 rounded-2xl border border-borde-sutil bg-stone-950/50 px-8 py-10 text-center">
          <span className="text-acento-dorado select-none text-lg" aria-hidden="true">✦</span>
          <h2 className="mt-3 font-serif text-2xl font-bold text-texto-claro">
            Más personajes del pase, próximamente
          </h2>
          <p className="mt-3 mx-auto max-w-md text-stone-400">
            El catálogo sigue creciendo. Estos personajes se revelarán en los próximos meses:
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {PROXIMOS.map((p) => (
              <span
                key={p.nombre}
                className="rounded-full border border-stone-800 bg-stone-900/60 px-4 py-1.5 text-sm text-stone-500"
              >
                <span className="font-serif italic text-stone-600 mr-1.5">{p.nombreKichwa}</span>
                {p.nombre}
              </span>
            ))}
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
