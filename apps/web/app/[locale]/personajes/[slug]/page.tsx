import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 3600;
import { getPersonaje, getPersonajes } from "@/lib/directus";
import { PersonajeCard } from "@/components/personajes/PersonajeCard";

interface PersonajePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const personajes = await getPersonajes({});
  return personajes.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PersonajePageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const personaje = await getPersonaje(slug, locale);

  if (!personaje) return { title: "No encontrado" };

  const imagenPortada = personaje.multimedia.find((m) => m.tipo === "imagen");

  return {
    title: personaje.nombre,
    description: personaje.resumen,
    openGraph: {
      title: `${personaje.nombre} | Seres del Pase`,
      description: personaje.resumen,
      images: imagenPortada ? [{ url: imagenPortada.url, alt: imagenPortada.altText }] : [],
    },
  };
}

const ORIGEN_LABELS: Record<string, string> = {
  prehispanico: "Prehispánico",
  colonial: "Colonial",
  mestizo: "Mestizo",
  mixto: "Mixto",
};

export default async function PersonajePage({ params }: PersonajePageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  const [personaje, todosLosPersonajes] = await Promise.all([
    getPersonaje(slug, locale),
    getPersonajes({ locale, limit: 8 }),
  ]);

  if (!personaje) notFound();

  const imagenPortada = personaje.multimedia.find((m) => m.tipo === "imagen");
  const otrosPersonajes = todosLosPersonajes.filter((p) => p.slug !== slug).slice(0, 4);

  return (
    <article>
      {/* Hero a pantalla completa */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden">
        {imagenPortada ? (
          <Image
            src={imagenPortada.url}
            alt={imagenPortada.altText}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-fondo-oscuro via-fondo-oscuro/40 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-5 pb-12 sm:px-6 sm:pb-16">
          {personaje.nombreKichwa && (
            <p className="font-serif text-base italic text-acento-dorado sm:text-lg">
              {personaje.nombreKichwa}
            </p>
          )}
          <h1 className="mt-1 font-serif text-4xl font-bold leading-tight text-texto-claro sm:text-5xl md:text-7xl">
            {personaje.nombre}
          </h1>
          {personaje.origen && (
            <span className="mt-3 inline-block rounded-full border border-stone-700 bg-stone-900/80 px-3 py-1 text-xs text-stone-400 backdrop-blur-sm">
              {ORIGEN_LABELS[personaje.origen] ?? personaje.origen}
            </span>
          )}
        </div>
      </section>

      {/* Contenido principal */}
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
        {/* Resumen */}
        <p className="text-lg leading-relaxed text-stone-300 sm:text-xl">{personaje.resumen}</p>

        {/* Descripción */}
        <section className="mt-10 sm:mt-12">
          <h2 className="font-serif text-xl font-bold text-texto-claro sm:text-2xl">
            Historia y significado
          </h2>
          <div className="prose prose-invert mt-5 max-w-none text-stone-400 sm:mt-6">
            <p>{personaje.descripcion}</p>
          </div>
        </section>

        {/* Simbolismo */}
        {personaje.simbolismo && (
          <section className="mt-10 sm:mt-12">
            <h2 className="font-serif text-xl font-bold text-texto-claro sm:text-2xl">
              Simbolismo
            </h2>
            <p className="mt-4 leading-relaxed text-stone-400">{personaje.simbolismo}</p>
          </section>
        )}

        {/* Testimonios */}
        {personaje.testimonios.length > 0 && (
          <section className="mt-14 sm:mt-16">
            <h2 className="font-serif text-xl font-bold text-texto-claro sm:text-2xl">
              Testimonios
            </h2>
            <div className="mt-5 space-y-7 sm:mt-6 sm:space-y-8">
              {personaje.testimonios.map((t) => (
                <blockquote key={t.id} className="border-l-2 border-acento-dorado pl-5 sm:pl-6">
                  <p className="text-base italic leading-relaxed text-stone-300 sm:text-lg">
                    "{t.texto}"
                  </p>
                  <footer className="mt-3 text-sm text-stone-500">
                    <span className="font-medium text-stone-400">{t.autor}</span>
                    {t.cargo && ` · ${t.cargo}`}
                    {t.fuente && (
                      <span className="ml-2 text-stone-600">
                        —{" "}
                        {t.url ? (
                          <a
                            href={t.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-stone-400"
                          >
                            {t.fuente}
                          </a>
                        ) : (
                          t.fuente
                        )}
                      </span>
                    )}
                  </footer>
                </blockquote>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        {personaje.tags.length > 0 && (
          <section className="mt-14 border-t border-borde-sutil pt-7 sm:mt-16 sm:pt-8">
            <div className="flex flex-wrap gap-2">
              {personaje.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full border border-stone-700 bg-stone-900 px-3 py-1 text-xs text-stone-400"
                >
                  {tag.nombre}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Cross-sell: Conoce a los otros seres */}
      {otrosPersonajes.length > 0 && (
        <section className="border-t border-borde-sutil px-5 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-center text-xs uppercase tracking-[0.2em] text-acento-dorado">
              Más seres del pase
            </p>
            <h2 className="mt-2 text-center font-serif text-2xl font-bold text-texto-claro sm:text-3xl">
              Conoce a los otros seres
            </h2>
            <div className="mt-8 grid gap-5 grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {otrosPersonajes.map((otro) => (
                <PersonajeCard key={otro.id} personaje={otro} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/personajes"
                className="text-sm font-medium text-acento-dorado underline-offset-4 hover:underline"
              >
                Ver todos los personajes →
              </Link>
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
