import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { setRequestLocale } from "next-intl/server";
import { getPersonaje, getPersonajes } from "@/lib/directus";

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

export default async function PersonajePage({ params }: PersonajePageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const personaje = await getPersonaje(slug, locale);

  if (!personaje) notFound();

  const imagenPortada = personaje.multimedia.find((m) => m.tipo === "imagen");

  return (
    <article>
      {/* Hero a pantalla completa */}
      <section className="relative flex min-h-screen items-end overflow-hidden">
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
          <div className="absolute inset-0 bg-stone-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-fondo-oscuro via-fondo-oscuro/40 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-16">
          {personaje.nombreKichwa && (
            <p className="font-serif text-lg italic text-acento-dorado">
              {personaje.nombreKichwa}
            </p>
          )}
          <h1 className="mt-1 font-serif text-5xl font-bold text-texto-claro md:text-7xl">
            {personaje.nombre}
          </h1>
          {personaje.origen && (
            <span className="mt-4 inline-block rounded-full border border-stone-700 bg-stone-900/80 px-3 py-1 text-xs text-stone-400">
              {personaje.origen}
            </span>
          )}
        </div>
      </section>

      {/* Contenido principal */}
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Resumen */}
        <p className="text-xl leading-relaxed text-stone-300">{personaje.resumen}</p>

        {/* Descripción */}
        <section className="mt-12">
          <h2 className="font-serif text-2xl font-bold text-texto-claro">Historia y significado</h2>
          <div className="prose prose-invert mt-6 max-w-none text-stone-400">
            <p>{personaje.descripcion}</p>
          </div>
        </section>

        {/* Simbolismo */}
        {personaje.simbolismo && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-bold text-texto-claro">Simbolismo</h2>
            <p className="mt-4 leading-relaxed text-stone-400">{personaje.simbolismo}</p>
          </section>
        )}

        {/* Testimonios */}
        {personaje.testimonios.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl font-bold text-texto-claro">Testimonios</h2>
            <div className="mt-6 space-y-8">
              {personaje.testimonios.map((t) => (
                <blockquote key={t.id} className="border-l-2 border-acento-dorado pl-6">
                  <p className="text-lg italic leading-relaxed text-stone-300">"{t.texto}"</p>
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
          <section className="mt-16 border-t border-borde-sutil pt-8">
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
    </article>
  );
}
