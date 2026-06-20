import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

// Red de seguridad del QR: si un imán impreso apunta a un slug que ya no existe
// (y no hay alias en slug-aliases.ts que lo redirija), en vez del 404 genérico
// el comprador aterriza aquí con una salida clara hacia el catálogo.
export default async function PersonajeNotFound() {
  const t = await getTranslations("error");

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 py-24 text-center sm:px-6">
      <p className="mb-3 text-xs uppercase tracking-[0.25em] text-acento-dorado">404</p>

      <h1 className="mb-4 font-serif text-3xl font-bold text-texto-claro sm:text-4xl">
        {t("personaje_titulo")}
      </h1>

      <p className="mb-10 max-w-md leading-relaxed text-stone-400">
        {t("personaje_desc")}
      </p>

      <Link
        href="/personajes"
        className="inline-flex items-center gap-2 rounded-full border border-borde-sutil bg-stone-900/40 px-5 py-2.5 text-sm font-medium text-texto-claro transition-colors hover:bg-stone-800/60"
      >
        {t("ver_catalogo")}
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    </section>
  );
}
