"use client";

import { useTranslations } from "next-intl";
import { useParams, usePathname as useRawPathname, useRouter as useNextRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useColeccion } from "@/components/auth/ColeccionProvider";
import { NunnaLogoAnimado } from "@/components/ui/NunnaLogoAnimado";
import { LoginModal } from "@/modules/auth/components/LoginModal";

const NAV_LINKS = [
  { key: "personajes", href: "/personajes" },
  { key: "pases",      href: "/pases" },
] as const;

const MOBILE_NAV_LINKS = [
  { key: "inicio", href: "/" },
  ...NAV_LINKS,
] as const;

const LOCALES = [
  { code: "es", label: "ES", nombre: "Español" },
  { code: "en", label: "EN", nombre: "English" },
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

function LockIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.9} viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function GlobeIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18"
      />
    </svg>
  );
}

/**
 * Idioma en escritorio: solo el globo. Al pasar el mouse (o con clic / teclado)
 * se despliega la lista de idiomas debajo.
 */
function SelectorIdioma({
  locale,
  label,
  onSelect,
}: {
  locale: string;
  label: string;
  onSelect: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cierre = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const abrir = () => {
    clearTimeout(cierre.current);
    setOpen(true);
  };
  // Pequeña espera: cruzar del botón a la lista no debe cerrarla.
  const cerrarLuego = () => {
    clearTimeout(cierre.current);
    cierre.current = setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => () => clearTimeout(cierre.current), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && abrir()}
      onPointerLeave={(e) => e.pointerType === "mouse" && cerrarLuego()}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        title={label}
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          open
            ? "border-acento-dorado/60 text-texto-claro"
            : "border-borde-sutil text-stone-400 hover:border-acento-dorado/60 hover:text-texto-claro"
        }`}
      >
        <GlobeIcon size={17} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            // pt-2 = puente invisible entre el botón y la lista para el hover
            className="absolute right-0 top-full origin-top-right pt-2"
          >
            <div
              role="group"
              aria-label={label}
              className="w-40 overflow-hidden rounded-xl border border-borde-sutil bg-fondo-oscuro/95 p-1 shadow-2xl shadow-black/50 backdrop-blur-xl"
            >
              {LOCALES.map(({ code, label: corto, nombre }) => {
                const actual = locale === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (!actual) onSelect(code);
                    }}
                    aria-pressed={actual}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      actual ? "bg-acento-dorado/10 text-acento-dorado" : "text-stone-300 hover:bg-stone-800/60 hover:text-texto-claro"
                    }`}
                  >
                    <span className="w-6 text-[11px] font-semibold tracking-wider text-stone-500">{corto}</span>
                    <span className="flex-1">{nombre}</span>
                    {actual && (
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  const [loginOpen, setLoginOpen] = useState(false);
  const { authActiva, ready, session } = useColeccion();
  const sinCuenta = authActiva && ready && !session;

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
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => {
            closeMenu();
            goTop();
          }}
          className="group flex shrink-0 items-center gap-2"
        >
          <NunnaLogoAnimado
            className="h-7 w-7 shrink-0 overflow-visible md:h-8 md:w-8"
            nombreClassName="text-shimmer inline-block font-serif text-lg font-bold md:text-xl"
          />
        </Link>

        {/* Nav — escritorio */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex">
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
          {/* Escritorio — solo íconos: sesión + idioma */}
          <div className="hidden items-center gap-2 md:flex">
            {authActiva && session && (
              <Link
                href="/mis-personajes"
                onClick={goTop}
                title={session.user?.email ?? undefined}
                className="flex h-9 items-center gap-1.5 rounded-full border border-borde-sutil px-3 text-xs font-medium text-stone-300 transition-colors hover:border-acento-dorado hover:text-texto-claro"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                <span>{t("mis_personajes")}</span>
              </Link>
            )}

            {sinCuenta && (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="group flex h-9 items-center rounded-full border border-acento-dorado/40 bg-acento-dorado/10 px-[9px] text-sm font-medium text-acento-dorado transition-colors hover:bg-acento-dorado/20 focus-visible:bg-acento-dorado/20"
              >
                <LockIcon size={16} />
                {/* La palabra se despliega al pasar el mouse (o con foco de teclado) */}
                <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-out group-hover:ml-1.5 group-hover:max-w-[7rem] group-hover:opacity-100 group-focus-visible:ml-1.5 group-focus-visible:max-w-[7rem] group-focus-visible:opacity-100">
                  {t("ingresar")}
                </span>
              </button>
            )}

            <SelectorIdioma locale={locale} label={t("idioma")} onSelect={switchLocale} />
          </div>

          {/* Móvil — candado de ingreso, visible sin abrir el menú */}
          {sinCuenta && (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              aria-label={t("ingresar")}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-acento-dorado/40 bg-acento-dorado/10 text-acento-dorado transition-colors hover:bg-acento-dorado/20 md:hidden"
            >
              <LockIcon size={18} />
            </button>
          )}

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

                  {authActiva && session && (
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
                              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                            />
                          </svg>
                          <span>{t("mis_personajes")}</span>
                        </Link>
                      </div>
                    </>
                  )}

                  <div className="mx-3 border-t border-borde-sutil" />
                  <div className="flex items-center gap-2 p-3" role="group" aria-label={t("idioma")}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 text-stone-600">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18"
                      />
                    </svg>
                    {LOCALES.map(({ code, label }) => (
                      <button
                        key={code}
                        onClick={() => {
                          switchLocale(code);
                          closeMenu();
                        }}
                        aria-pressed={locale === code}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                          locale === code ? "bg-stone-800 text-texto-claro" : "text-stone-500 hover:text-stone-300"
                        }`}
                      >
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
      <AnimatePresence>{loginOpen && sinCuenta && <LoginModal onClose={() => setLoginOpen(false)} />}</AnimatePresence>
    </header>
  );
}
