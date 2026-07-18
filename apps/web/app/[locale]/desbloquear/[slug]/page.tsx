import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { getPersonaje, getPersonajes } from "@/lib/data";
import { getOrigenStyle } from "@/lib/origen-styles";
import { FadeUp } from "@/components/ui/FadeUp";
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
  }));

  const personajeActivo: PersonajeLite = lookup.find((p) => p.slug === slug) ?? {
    slug: personaje.slug,
    nombre: personaje.nombre,
    origen: personaje.origen ?? null,
    imagenPortada: null,
    imagenBanner: null,
  };

  const origenStyle = getOrigenStyle(personajeActivo.origen ?? undefined);
  // El banner (landscape) encaja de lleno en este hero ancho/bajo; el retrato
  // (portrait, pensado para PersonajeCard) es solo fallback si aún no hay banner.
  const heroImagen = personajeActivo.imagenBanner ?? personajeActivo.imagenPortada;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero del personaje */}
      <div className="relative flex min-h-[55vw] max-h-[420px] w-full items-end overflow-hidden bg-fondo-oscuro sm:min-h-[320px]">
        {heroImagen ? (
          <>
            <Image
              src={heroImagen}
              alt={personajeActivo.nombre}
              fill
              className={personajeActivo.imagenBanner ? "object-cover" : "object-cover object-top"}
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-fondo-oscuro via-fondo-oscuro/40 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: `${origenStyle.accentColor}18` }} />
        )}

        <div className="relative z-10 w-full px-5 pb-6 sm:px-8">
          <span
            className="mb-2 inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
            style={{ backgroundColor: `${origenStyle.accentColor}22`, color: origenStyle.accentColor }}
          >
            {personajeActivo.origen}
          </span>
          <h1 className="font-serif text-4xl font-bold text-texto-claro sm:text-5xl">
            {personajeActivo.nombre}
          </h1>
        </div>
      </div>

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

          {/* Enlace a la ficha pública — siempre visible */}
          <p className="mt-10 text-center text-xs text-stone-600">
            {t("explorar_sin_desbloquear")}{" "}
            <Link
              href={{ pathname: "/personajes/[slug]", params: { slug: personaje.slug } }}
              className="text-stone-500 underline underline-offset-2 hover:text-stone-400"
            >
              {t("ver_ficha", { nombre: personaje.nombre })}
            </Link>
          </p>
        </FadeUp>
      </section>
    </div>
  );
}
