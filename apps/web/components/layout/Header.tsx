"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { key: "personajes", href: "/personajes" },
  { key: "pases", href: "/pases" },
  { key: "mapa", href: "/mapa" },
  { key: "calendario", href: "/calendario" },
  { key: "glosario", href: "/glosario" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-borde-sutil bg-fondo-oscuro/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="font-serif text-lg font-bold text-texto-claro hover:text-acento-dorado">
          Seres del Pase
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="text-sm text-stone-400 transition-colors hover:text-texto-claro"
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <Link
            href="/buscar"
            aria-label={t("buscar")}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-texto-claro"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.5}>
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
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.5}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {menuOpen && (
        <nav className="border-t border-borde-sutil px-6 pb-4 md:hidden">
          {NAV_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="block py-3 text-stone-400 transition-colors hover:text-texto-claro"
              onClick={() => setMenuOpen(false)}
            >
              {t(key)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
