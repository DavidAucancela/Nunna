"use client";

import { useTranslations } from "next-intl";
import { LoginForm } from "./LoginForm";

/**
 * Tarjeta de ingreso: encabezado + Google / enlace mágico. La comparten la página
 * `/login` y el modal del navbar, para que se vean y funcionen igual.
 */
export function LoginCard({ titleId }: { titleId?: string }) {
  const t = useTranslations("login");

  return (
    <div className="w-full max-w-md rounded-3xl border border-borde-sutil bg-stone-950 px-6 pb-8 pt-8 shadow-2xl shadow-black/50 sm:px-8">
      <div className="mb-7 text-center">
        <span
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-acento-dorado/40 bg-acento-dorado/10 text-acento-dorado"
          aria-hidden="true"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </span>
        <p className="text-[11px] uppercase tracking-[0.3em] text-acento-dorado">{t("eyebrow")}</p>
        <h1 id={titleId} className="mt-2 font-serif text-2xl font-bold text-texto-claro sm:text-3xl">
          {t("titulo")}
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-stone-400">{t("subtitulo")}</p>
      </div>

      <LoginForm />
    </div>
  );
}
