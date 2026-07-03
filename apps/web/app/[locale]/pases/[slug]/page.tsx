import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getPases } from "@/lib/data";
import { localeAlternates } from "@/lib/seo";
import { Link } from "@/i18n/navigation";

interface PaseDetallePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const pases = await getPases({});
  return pases.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PaseDetallePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const pases = await getPases({});
  const pase = pases.find((p) => p.slug === slug);
  if (!pase) return {};

  return {
    title: pase.nombre,
    description: pase.fechaDescripcion,
    alternates: localeAlternates({ pathname: "/pases/[slug]", params: { slug } }, locale),
    openGraph: pase.imagenPortada
      ? { title: pase.nombre, images: [{ url: pase.imagenPortada, alt: pase.nombre }] }
      : { title: pase.nombre },
  };
}

// Página mínima: solo los datos logísticos que ya existen en pases.json (horario,
// ruta, tipo, personaje destacado). Sin historia/testimonios editoriales — esos
// campos del tipo Pase completo aún no tienen contenido autorizado (ver
// docs/PLAN-V3.md Fase 5). Ampliar cuando haya texto e imágenes propias del pase.
export default async function PaseDetallePage({ params }: PaseDetallePageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [pases, t] = await Promise.all([
    getPases({}),
    getTranslations({ locale, namespace: "pases" }),
  ]);
  const pase = pases.find((p) => p.slug === slug);
  if (!pase) notFound();

  const ruta = pase.inicio && pase.fin ? `${pase.inicio} → ${pase.fin}` : pase.ruta;
  const acento = pase.color ?? "#C89B3C";

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-6 sm:py-24">
      <Link
        href="/pases"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-stone-400 transition-colors hover:text-acento-dorado"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        {t("volver")}
      </Link>

      {pase.imagenPortada && (
        <div className="relative mb-8 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-stone-950">
          <Image
            src={pase.imagenPortada}
            alt={pase.nombre}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      <header>
        {pase.tipo && (
          <span
            className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white"
            style={{ backgroundColor: acento }}
          >
            {pase.tipo}
          </span>
        )}
        <h1 className="font-serif text-3xl font-bold text-texto-claro sm:text-4xl">{pase.nombre}</h1>
        <p className="mt-3 text-stone-400">{pase.fechaDescripcion}</p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-borde-sutil bg-borde-sutil sm:grid-cols-2">
        {pase.horario && (
          <div className="bg-stone-900/40 px-6 py-5">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-stone-600">
              {t("horario_label")}
            </p>
            <p className="text-sm text-stone-300">{pase.horario}</p>
          </div>
        )}
        {pase.tipo && (
          <div className="bg-stone-900/40 px-6 py-5">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-stone-600">
              {t("tipo_label")}
            </p>
            <p className="text-sm text-stone-300">{pase.tipo}</p>
          </div>
        )}
        {ruta && (
          <div className="bg-stone-900/40 px-6 py-5 sm:col-span-2">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-stone-600">
              {t("ruta_label")}
            </p>
            <p className="text-sm leading-relaxed text-stone-300">{ruta}</p>
          </div>
        )}
        {pase.personaje && (
          <div className="bg-stone-900/40 px-6 py-5 sm:col-span-2">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-stone-600">
              {t("personaje_label")}
            </p>
            {pase.personajeSlug ? (
              <Link
                href={{ pathname: "/personajes/[slug]", params: { slug: pase.personajeSlug } }}
                className="inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: acento }}
              >
                {t("ver_ficha_personaje", { nombre: pase.personaje })}
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            ) : (
              <p className="text-sm text-stone-300">{pase.personaje}</p>
            )}
          </div>
        )}
      </div>

      <p className="mt-10 text-sm italic text-stone-600">{t("contenido_pendiente")}</p>
    </article>
  );
}
