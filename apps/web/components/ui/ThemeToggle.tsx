"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const t = useTranslations("nav");
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Sincroniza el estado inicial con la clase que ya aplicó el script anti-parpadeo.
  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const d = document.documentElement;
    if (next === "dark") d.classList.add("dark");
    else d.classList.remove("dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* almacenamiento no disponible — el cambio sigue aplicando en esta sesión */
    }
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("tema")}
      aria-pressed={!isDark}
      title={t("tema")}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-borde-sutil text-stone-400 transition-colors hover:text-texto-claro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-dorado/70"
    >
      {/* Antes de montar mostramos el icono coherente con el SSR (oscuro → luna) */}
      {mounted && !isDark ? (
        // Sol — tema claro activo
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Luna — tema oscuro activo
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
