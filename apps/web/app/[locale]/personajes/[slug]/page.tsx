import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { getPersonaje, getPersonajes, getPases } from "@/lib/data";
import { getOrigenStyle } from "@/lib/origen-styles";
import { localeAlternates } from "@/lib/seo";
import { GatedPageRedirect } from "@/modules/personajes/components/GatedPageRedirect";
import { HeroGated } from "@/modules/personajes/components/HeroGated";
import { AnatomiaGated } from "@/modules/personajes/components/AnatomiaGated";
import { GaleriaSection } from "@/modules/personajes/components/GaleriaSection";
import { NarrativaSection } from "@/modules/personajes/components/NarrativaSection";
import { CuandoVerloSection } from "@/modules/personajes/components/CuandoVerloSection";
import { ArtesanoSection } from "@/modules/personajes/components/ArtesanoSection";
import { ColeccionCounter } from "@/modules/personajes/components/ColeccionCounter";
import { PersonajesEscenario } from "@/modules/personajes/components/PersonajesEscenario";
import { QuoteRevelacion } from "@/modules/personajes/components/QuoteRevelacion";
import { StatsAnimados } from "@/modules/personajes/components/StatsAnimados";
import { WhatsAppShare } from "@/components/ui/WhatsAppShare";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

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
    alternates: localeAlternates({ pathname: "/personajes/[slug]", params: { slug } }, locale),
    openGraph: {
      title: `${personaje.nombre} | Nunna`,
      description: personaje.resumen,
      images: imagenPortada ? [{ url: imagenPortada.url, alt: imagenPortada.altText }] : [],
    },
  };
}

export default async function PersonajePage({ params }: PersonajePageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  const [personaje, todosPersonajes, pases, t] = await Promise.all([
    getPersonaje(slug, locale),
    getPersonajes({}),
    getPases({}),
    getTranslations({ locale, namespace: "historia" }),
  ]);

  if (!personaje) notFound();

  const imagenPortada = personaje.multimedia.find((m) => m.tipo === "imagen");
  const imagenBanner = personaje.imagenBanner
    ? { url: personaje.imagenBanner, altText: `${personaje.nombre} — Nunna` }
    : undefined;
  const style = getOrigenStyle(personaje.origen);

  const pasesDelPersonaje = pases.filter((p) => p.personajeSlug === personaje.slug);
  const festividad =
    pasesDelPersonaje.length > 0
      ? `${pasesDelPersonaje.length} ${pasesDelPersonaje.length === 1 ? "fiesta" : "fiestas"} popular${pasesDelPersonaje.length === 1 ? "" : "es"} del Ecuador`
      : "Fiestas populares del Ecuador";

  const otrosPersonajes = todosPersonajes.filter((p) => p.slug !== slug);

  return (
    <article>
      <GatedPageRedirect slug={personaje.slug} />
      <ScrollToTop />

      {/* ── 1. Hero (gated: experiencia inmersiva = premio del desbloqueo) ── */}
      <HeroGated
        slug={personaje.slug}
        experiencia={personaje.experiencia}
        nombre={personaje.nombre}
        nombreKichwa={personaje.nombreKichwa}
        nombresAlt={personaje.nombresAlt}
        origen={personaje.origen}
        imagen={imagenPortada}
        imagenBanner={imagenBanner}
        origenLabel={style.label}
        accentColor={style.accentColor}
        audioAmbiente={personaje.audioAmbiente}
      />

      {/* ── 2. La Voz del Espíritu — resumen pintado por scroll + compartir ── */}
      <QuoteRevelacion
        texto={personaje.resumen}
        accentColor={style.accentColor}
        origen={personaje.origen}
      >
        <WhatsAppShare nombre={personaje.nombre} />
        <ColeccionCounter slug={personaje.slug} nombre={personaje.nombre} />
      </QuoteRevelacion>

      {/* ── 3. Los Números Sagrados — ficha de datos ── */}
      <StatsAnimados
        origenLabel={style.label}
        accentColor={style.accentColor}
        festividadCount={pasesDelPersonaje.length}
        festividadTexto={festividad}
        nombresAlt={personaje.nombresAlt}
      />

      {/* ── 4. Cuándo y dónde verlo ── */}
      <CuandoVerloSection
        pases={pasesDelPersonaje}
        accentColor={style.accentColor}
        eyebrow={t("cuando_eyebrow")}
        titulo={t("cuando_titulo")}
      />

      {/* ── 5. Historia (scrollytelling con sticky desktop + secreto interactivo) ── */}
      {personaje.narrativa && (
        <NarrativaSection
          leyenda={personaje.narrativa.leyenda}
          secreto={personaje.narrativa.secreto}
          capitulos={personaje.narrativa.capitulos}
          accentColor={style.accentColor}
          {...(personaje.artesanoFirma ? { artesanoFirma: personaje.artesanoFirma } : {})}
          {...(personaje.narrativa.palabrasClave?.length
            ? { palabrasClave: personaje.narrativa.palabrasClave }
            : {})}
        />
      )}

      {/* ── 5b. Anatomía (experiencia v2 — solo con hotspots, gated por desbloqueo) ── */}
      {personaje.experiencia && personaje.hotspots?.length && imagenPortada ? (
        <AnatomiaGated
          slug={personaje.slug}
          imagen={imagenPortada}
          hotspots={personaje.hotspots}
          accentColor={style.accentColor}
          nombre={personaje.nombre}
        />
      ) : null}

      {/* ── 5c. Artesano (si el campo existe en el JSON) ── */}
      {personaje.artesano && (
        <ArtesanoSection
          artesano={personaje.artesano}
          nombre={personaje.nombre}
          {...(personaje.origen ? { origen: personaje.origen } : {})}
          accentColor={style.accentColor}
        />
      )}

      {/* ── 6. Galería (3 grupos + lightbox + video) ── */}
      <GaleriaSection
        multimedia={personaje.multimedia}
        accentColor={style.accentColor}
        nombre={personaje.nombre}
      />

      {/* ── 7. Cross-sell ── */}
      {otrosPersonajes.length > 0 && (
        <section className="border-t border-borde-sutil py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="mb-10 text-center">
              <p
                className="mb-3 text-[10px] uppercase tracking-[0.3em]"
                style={{ color: `${style.accentColor}80` }}
              >
                {t("coleccion_eyebrow")}
              </p>
              <h2 className="font-serif text-4xl font-bold text-texto-claro sm:text-5xl">
                {t("coleccion_titulo")}
              </h2>
            </div>
            <PersonajesEscenario personajes={otrosPersonajes} />
          </div>
        </section>
      )}
    </article>
  );
}
