"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useColeccion } from "@/components/auth/ColeccionProvider";
import { hrefContacto } from "@/lib/contacto/whatsapp";

function Candado() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Esquina de cada tarjeta de /personajes: "✓ En tu colección" si ya lo guardó; si no
 * (también sin sesión), candado + "Escríbenos" → /contacto con el personaje marcado.
 * Va como hermano del <Link> de la tarjeta, nunca dentro (no se anidan enlaces).
 */
export function EscribenosPersonaje({ slug, nombre }: { slug: string; nombre: string }) {
  const t = useTranslations("personajes");
  const { ready, coleccion } = useColeccion();
  if (!ready) return null;

  if (coleccion.has(slug)) {
    return (
      <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-full border border-acento-dorado/50 bg-fondo-oscuro/80 px-2.5 py-1 text-[11px] font-medium text-acento-dorado backdrop-blur-sm sm:right-3 sm:top-3 sm:text-xs">
        ✓ {t("en_coleccion")}
      </span>
    );
  }

  return (
    <Link
      href={hrefContacto(slug)}
      aria-label={t("escribenos_aria", { nombre })}
      className="absolute right-2 top-2 z-10 inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/15 bg-fondo-oscuro/80 px-3 text-[11px] font-semibold text-texto-claro backdrop-blur-sm transition-colors hover:border-acento-dorado hover:text-acento-dorado focus-visible:outline focus-visible:outline-2 focus-visible:outline-acento-dorado sm:right-3 sm:top-3 sm:text-xs"
    >
      <Candado />
      {t("escribenos")}
    </Link>
  );
}
