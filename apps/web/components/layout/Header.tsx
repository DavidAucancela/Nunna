"use client";

import { useTranslations } from "next-intl";
import { useParams, usePathname as useRawPathname, useRouter as useNextRouter } from "next/navigation";
import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { key: "personajes", href: "/personajes" },
  { key: "pases",      href: "/pases" },
  { key: "calendario", href: "/calendario" },
] as const;

const LOCALES = [
  { code: "es", label: "ES", flag: "🇪🇨" },
  { code: "en", label: "EN", flag: "🇺🇸" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const rawPathname = useRawPathname();
  const nextRouter = useNextRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const [langOpen, setLangOpen] = useState(false);

  const switchLocale = (code: string) => {
    const segments = rawPathname.split("/");
    segments[1] = code;
    nextRouter.push(segments.join("/"));
  };

  const isActive = (href: string) => pathname.includes(href);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-borde-sutil bg-fondo-oscuro/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 md:px-6">
        {/* Logo */}
        <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: "instant" })} className="group flex shrink-0 items-center gap-2">
          <span className="font-serif text-lg font-bold text-texto-claro transition-colors group-hover:text-acento-dorado">
            Nunna
          </span>
        </Link>

        {/* Nav — las 3 secciones, visibles en móvil y escritorio */}
        <nav className="flex items-center gap-2.5 md:gap-6">
          {NAV_LINKS.map(({ key, href }) => {
            const active = isActive(href);
            return (
              <Link
                key={key}
                href={href}
                onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
                className={`relative text-[11px] transition-colors md:text-sm ${
                  active
                    ? "text-texto-claro"
                    : "text-stone-400 hover:text-texto-claro"
                }`}
              >
                {t(key)}
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute -bottom-[18px] left-0 right-0 h-[2px] bg-acento-dorado"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Selector de idioma + tema */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Escritorio — pills siempre visibles */}
          <div className="hidden items-center gap-0.5 rounded-lg border border-borde-sutil p-0.5 md:flex">
            {LOCALES.map(({ code, label, flag }) => (
              <button
                key={code}
                onClick={() => switchLocale(code)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  locale === code
                    ? "bg-stone-800 text-texto-claro"
                    : "text-stone-500 hover:text-stone-300"
                }`}
              >
                <span aria-hidden="true">{flag}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Móvil — botón compacto + popover */}
          <div className="relative md:hidden">
            <button
              onClick={() => setLangOpen((o) => !o)}
              aria-label={t("idioma")}
              aria-expanded={langOpen}
              className="flex items-center gap-1 rounded-lg border border-borde-sutil px-2 py-1 text-xs font-medium text-stone-300 transition-colors hover:text-texto-claro"
            >
              <span aria-hidden="true">{LOCALES.find((l) => l.code === locale)?.flag}</span>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  key="lang-popover"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 mt-2 flex flex-col gap-0.5 rounded-lg border border-borde-sutil bg-fondo-oscuro p-1 shadow-lg shadow-black/40"
                >
                  {LOCALES.map(({ code, label, flag }) => (
                    <button
                      key={code}
                      onClick={() => {
                        switchLocale(code);
                        setLangOpen(false);
                      }}
                      className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                        locale === code
                          ? "bg-stone-800 text-texto-claro"
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      <span aria-hidden="true">{flag}</span>
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </header>
  );
}
