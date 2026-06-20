"use client";

import { useTranslations } from "next-intl";
import { useParams, usePathname as useRawPathname, useRouter as useNextRouter } from "next/navigation";
import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { key: "pases",      href: "/pases" },
  { key: "calendario", href: "/calendario" },
  { key: "glosario",   href: "/glosario" },
] as const;

const LOCALES = [
  { code: "es", label: "ES" },
  { code: "qu", label: "QU" },
  { code: "en", label: "EN" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const rawPathname = useRawPathname();
  const nextRouter = useNextRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const [menuOpen, setMenuOpen] = useState(false);

  const switchLocale = (code: string) => {
    const segments = rawPathname.split("/");
    segments[1] = code;
    nextRouter.push(segments.join("/"));
  };

  const isActive = (href: string) => pathname.includes(href);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-borde-sutil bg-fondo-oscuro/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <span className="font-serif text-lg font-bold text-texto-claro transition-colors group-hover:text-acento-dorado">
            Nunna
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ key, href }) => {
            const active = isActive(href);
            return (
              <Link
                key={key}
                href={href}
                className={`relative text-sm transition-colors ${
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

        {/* Acciones desktop */}
        <div className="flex items-center gap-1">
          {/* Selector de idioma */}
          <div className="hidden items-center gap-0.5 rounded-lg border border-borde-sutil p-0.5 md:flex">
            {LOCALES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => switchLocale(code)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  locale === code
                    ? "bg-stone-800 text-texto-claro"
                    : "text-stone-500 hover:text-stone-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Buscar */}
          <Link
            href="/buscar"
            aria-label={t("buscar")}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-texto-claro"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </Link>

          {/* Botón menú móvil */}
          <button
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-texto-claro md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
            aria-expanded={menuOpen}
          >
            <motion.svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              animate={menuOpen ? "open" : "closed"}
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </motion.svg>
          </button>
        </div>
      </div>

      {/* Menú móvil con animación */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden border-t border-borde-sutil md:hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {NAV_LINKS.map(({ key, href }) => (
                <Link
                  key={key}
                  href={href}
                  className={`flex items-center justify-between py-2.5 text-sm transition-colors ${
                    isActive(href)
                      ? "text-texto-claro"
                      : "text-stone-400 hover:text-texto-claro"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {t(key)}
                  {isActive(href) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-acento-dorado" />
                  )}
                </Link>
              ))}

              {/* Selector de idioma en móvil */}
              <div className="flex items-center gap-1 pt-3 border-t border-borde-sutil mt-3">
                <span className="text-xs text-stone-600 mr-1">Idioma:</span>
                {LOCALES.map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => { switchLocale(code); setMenuOpen(false); }}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      locale === code
                        ? "bg-stone-800 text-texto-claro"
                        : "text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
