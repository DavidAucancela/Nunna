import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { getPersonaje, getPersonajes } from "@/lib/data";
import { getOrigenStyle } from "@/lib/origen-styles";
import { FadeUp } from "@/components/ui/FadeUp";
import { DesbloqueoHero } from "@/modules/desbloqueo/components/DesbloqueoHero";
import {
  DesbloquearForm,
  type PersonajeLite,
} from "@/modules/desbloqueo/components/DesbloquearForm";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const personajes = await getPersonajes({});
  return personajes.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const personaje = await getPersonaje(slug);
  if (!personaje) return {};
  const t = await getTranslations({ locale, namespace: "desbloquear" });
  return {
    title: `${t("desbloquear_personaje", { nombre: personaje.nombre })} — Nunna`,
    description: t("subtitulo"),
  };
}

export default async function DesbloquearSlugPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [personaje, todosPersonajes, t] = await Promise.all([
    getPersonaje(slug),
    getPersonajes({}),
    getTranslations({ locale, namespace: "desbloquear" }),
  ]);

  if (!personaje) notFound();

  const lookup: PersonajeLite[] = todosPersonajes.map((p) => ({
    slug: p.slug,
    nombre: p.nombre,
    origen: p.origen ?? null,
    imagenPortada: p.imagenPortada ?? null,
    imagenBanner: p.imagenBanner ?? null,
    imagenIngreso: p.imagenIngreso ?? null,
  }));

  const personajeActivo: PersonajeLite = lookup.find((p) => p.slug === slug) ?? {
    slug: personaje.slug,
    nombre: personaje.nombre,
    origen: personaje.origen ?? null,
    imagenPortada: null,
    imagenBanner: null,
    imagenIngreso: personaje.imagenIngreso ?? null,
  };

  const origenStyle = getOrigenStyle(personajeActivo.origen ?? undefined);
  // La foto de escena ("imagenIngreso") es la pensada para este hero; el banner
  // (landscape, de la ficha) y el retrato (portrait, de PersonajeCard) son
  // fallback en ese orden si aún no hay foto de escena.
  const heroImagen = personajeActivo.imagenIngreso ?? personajeActivo.imagenBanner ?? personajeActivo.imagenPortada;
  // Escena/banner son landscape (cover centrado); el retrato necesita object-top
  // para no recortar la cara.
  const heroEsEscena = !!personajeActivo.imagenIngreso || !!personajeActivo.imagenBanner;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero del personaje */}
      <DesbloqueoHero
        imagenUrl={heroImagen}
        esEscena={heroEsEscena}
        nombre={personajeActivo.nombre}
        origen={personajeActivo.origen}
        accentColor={origenStyle.accentColor}
      />

      {/* Sección de desbloqueo */}
      <section className="mx-auto max-w-lg px-5 py-10 sm:px-6 sm:py-14">
        <FadeUp>
          <div className="mb-8 text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-acento-dorado">
              {t("eyebrow")}
            </p>
            <p className="mx-auto mt-3 max-w-sm text-stone-400">
              {t("subtitulo_personaje", { nombre: personaje.nombre })}
            </p>
          </div>

          <DesbloquearForm personajes={lookup} personajeActivo={personajeActivo} />
        </FadeUp>
      </section>
    </div>
  );
}
