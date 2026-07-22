"use client";

import { useTranslations } from "next-intl";
import { useParams, usePathname as useRawPathname, useRouter as useNextRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useColeccion } from "@/components/auth/ColeccionProvider";

const NAV_LINKS = [
  { key: "personajes", href: "/personajes" },
  { key: "pases",      href: "/pases" },
  { key: "calendario", href: "/calendario" },
] as const;

const MOBILE_NAV_LINKS = [
  { key: "inicio", href: "/" },
  ...NAV_LINKS,
] as const;

const LOCALES = [
  { code: "es", label: "ES", flag: "🇪🇨" },
  { code: "en", label: "EN", flag: "🇺🇸" },
] as const;

type NavKey = (typeof MOBILE_NAV_LINKS)[number]["key"];

function NavIcon({ name, className }: { name: NavKey; className?: string }) {
  const paths: Record<NavKey, string> = {
    inicio:
      "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75",
    personajes:
      "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
    pases:
      "M3 4.5l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.711l3.114-.733a48.524 48.524 0 01-.005 10.499l-3.109.732a9 9 0 01-6.086-.711l-.108-.054a9 9 0 00-6.208-.682L3 15m0-10.5v18",
    calendario:
      "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
  };

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[name]} />
    </svg>
  );
}

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const rawPathname = useRawPathname();
  const nextRouter = useNextRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { gatingActive, session } = useColeccion();

  const switchLocale = (code: string) => {
    const segments = rawPathname.split("/");
    segments[1] = code;
    nextRouter.push(segments.join("/"));
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.includes(href));

  const closeMenu = () => setMenuOpen(false);
  const goTop = () => window.scrollTo({ top: 0, behavior: "instant" });

  // Cerrar al hacer clic/touch afuera del botón + panel
  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-borde-sutil bg-fondo-oscuro/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => {
            closeMenu();
            goTop();
          }}
          className="group flex shrink-0 items-center gap-2"
        >
          <motion.span
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="relative font-serif text-lg font-bold text-gradient-dorado md:text-xl"
          >
            Nunna
            <motion.span
              aria-hidden="true"
              className="absolute -right-2.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-acento-dorado"
              animate={{ opacity: [0.35, 1, 0.35], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.span>
        </Link>

        {/* Nav — escritorio */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ key, href }) => {
            const active = isActive(href);
            return (
              <Link
                key={key}
                href={href}
                onClick={goTop}
                className={`relative text-sm transition-colors ${
                  active ? "text-texto-claro" : "text-stone-400 hover:text-texto-claro"
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

        {/* Selector de idioma + sesión + menú móvil */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Escritorio — sesión + pills de idioma siempre visibles */}
          <div className="hidden items-center gap-2 md:flex">
            {gatingActive && session && (
              <Link
                href="/mis-personajes"
                onClick={goTop}
                title={session.user?.email ?? undefined}
                className="flex items-center gap-1.5 rounded-full border border-borde-sutil px-2.5 py-1 text-xs font-medium text-stone-300 transition-colors hover:border-acento-dorado hover:text-texto-claro"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
                <span>{t("mis_personajes")}</span>
              </Link>
            )}

            <div className="flex items-center gap-0.5 rounded-lg border border-borde-sutil p-0.5">
              {LOCALES.map(({ code, label, flag }) => (
                <button
                  key={code}
                  onClick={() => switchLocale(code)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    locale === code ? "bg-stone-800 text-texto-claro" : "text-stone-500 hover:text-stone-300"
                  }`}
                >
                  <span aria-hidden="true">{flag}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Móvil — botón único que unifica navegación + idioma + sesión */}
          <div ref={menuRef} className="relative md:hidden">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? t("cerrar_menu") : t("abrir_menu")}
              aria-expanded={menuOpen}
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                menuOpen
                  ? "border-acento-dorado text-acento-dorado"
                  : "border-borde-sutil text-texto-claro hover:border-acento-dorado/60"
              }`}
            >
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -5 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute h-[1.5px] w-4 rounded-full bg-current"
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, x: 6 } : { opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="absolute h-[1.5px] w-4 rounded-full bg-current"
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 5 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute h-[1.5px] w-4 rounded-full bg-current"
              />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  key="mobile-menu"
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -6 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-full mt-3 w-72 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-borde-sutil bg-fondo-oscuro/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
                >
                  <motion.nav
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } } }}
                    initial="hidden"
                    animate="show"
                    className="flex flex-col gap-0.5 p-2"
                  >
                    {MOBILE_NAV_LINKS.map(({ key, href }) => {
                      const active = isActive(href);
                      return (
                        <motion.div
                          key={key}
                          variants={{ hidden: { opacity: 0, x: 14 }, show: { opacity: 1, x: 0 } }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                        >
                          <Link
                            href={href}
                            onClick={() => {
                              closeMenu();
                              goTop();
                            }}
                            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                              active
                                ? "bg-acento-dorado/10 text-acento-dorado"
                                : "text-stone-300 hover:bg-stone-800/60 hover:text-texto-claro"
                            }`}
                          >
                            <NavIcon name={key} className={active ? "text-acento-dorado" : "text-stone-500"} />
                            <span>{t(key)}</span>
                            {active && (
                              <motion.span
                                layoutId="mobile-nav-dot"
                                className="ml-auto h-1.5 w-1.5 rounded-full bg-acento-dorado"
                              />
                            )}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.nav>

                  {gatingActive && session && (
                    <>
                      <div className="mx-3 border-t border-borde-sutil" />
                      <div className="p-2">
                        <Link
                          href="/mis-personajes"
                          onClick={() => {
                            closeMenu();
                            goTop();
                          }}
                          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-stone-300 transition-colors hover:bg-stone-800/60 hover:text-texto-claro"
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true" className="text-stone-500">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                            />
                          </svg>
                          <span>{t("mis_personajes")}</span>
                        </Link>
                      </div>
                    </>
                  )}

                  <div className="mx-3 border-t border-borde-sutil" />
                  <div className="flex items-center gap-1.5 p-3">
                    {LOCALES.map(({ code, label, flag }) => (
                      <button
                        key={code}
                        onClick={() => {
                          switchLocale(code);
                          closeMenu();
                        }}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                          locale === code ? "bg-stone-800 text-texto-claro" : "text-stone-500 hover:text-stone-300"
                        }`}
                      >
                        <span aria-hidden="true">{flag}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
