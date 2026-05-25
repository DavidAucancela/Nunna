import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getGlosario } from "@/lib/directus";

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

  const grupos = palabras.reduce<Record<string, typeof palabras>>((acc, p) => {
    const letra = p.palabra[0]?.toUpperCase() ?? "#";
    if (!acc[letra]) acc[letra] = [];
    acc[letra]!.push(p);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-serif text-4xl font-bold text-texto-claro md:text-5xl">
        {t("glosario")}
        <span className="ml-3 font-serif text-2xl text-acento-dorado">· Kichwa</span>
      </h1>
      <p className="mt-4 text-stone-400">
        Palabras en kichwa (runasimi) relacionadas con los personajes y festividades del pase.
      </p>

      <div className="mt-12 space-y-10">
        {Object.entries(grupos)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([letra, palabrasGrupo]) => (
            <section key={letra}>
              <h2 className="mb-4 border-b border-borde-sutil pb-2 font-serif text-2xl font-bold text-acento-dorado">
                {letra}
              </h2>
              <dl className="space-y-4">
                {palabrasGrupo.map((p) => (
                  <div key={p.id}>
                    <dt className="flex items-baseline gap-3">
                      <span className="font-serif text-lg font-semibold italic text-texto-claro">
                        {p.palabra}
                      </span>
                      {p.pronunciacion && (
                        <span className="text-xs text-stone-500">[{p.pronunciacion}]</span>
                      )}
                    </dt>
                    <dd className="mt-1 text-stone-400">
                      <strong className="text-stone-300">{p.traduccion}</strong>
                      {p.contexto && <span className="ml-2 text-sm">— {p.contexto}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
      </div>
    </div>
  );
}
