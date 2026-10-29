"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useColeccion } from "@/components/auth/ColeccionProvider";
import { getLenis } from "@/components/ui/LenisProvider";
import { PRECIOS, TAMANO_COLECCION, TAMANO_TRIO, cotizar } from "@/lib/contacto/precios";
import {
  WHATSAPP_CONTACTO,
  armarMensajeEnvio,
  armarMensajeRetiro,
  urlWhatsApp,
} from "@/lib/contacto/whatsapp";
import { EntregaContacto, type AccesoEntrega } from "@/modules/contacto/components/EntregaContacto";
import { ResumenPedido } from "@/modules/contacto/components/ResumenPedido";
import { TARJETA } from "./TarjetaNunna";

export interface PersonajeColeccion {
  slug: string;
  /** Nombre impreso en la tarjeta ("Diablo Huma"). */
  nombre: string;
  /** Origen ya traducido ("Prehispánico"). */
  origen?: string | undefined;
  /** Ícono de línea del reverso de la tarjeta; la foto del imán solo si faltara. */
  icono?: string | undefined;
  imagen?: string | undefined;
}

type Modo = "explorar" | "comprar";

function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

function Candado({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  );
}

function Check({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

const SELLO =
  "absolute -right-1 -top-1 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-fondo-oscuro shadow-lg shadow-black/40";

/** Desplazamiento suave que respeta Lenis (si está activo) y `prefers-reduced-motion`. */
function irA(el: HTMLElement | null, reducir: boolean | null) {
  if (!el) return;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(el, { offset: -80, immediate: !!reducir });
  else el.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "start" });
}

/**
 * /personajes en una sola ventana con dos modos sobre los mismos círculos del reverso de la tarjeta:
 * - **Colección** (por defecto): cada círculo abre la ficha; los guardados brillan en dorado con ✓.
 * - **Compra** (botón de abajo): aparecen los candados en los que no tienes, tocar elige, y debajo
 *   siguen los pasos: tu pedido (precio y promos) → entrega por WhatsApp (con sesión).
 * `?comprar=1`, `?personaje=<slug>` o `?personajes=a,b` abren directo en compra (los usan
 * "Escríbenos" de la ficha/Mis personajes y la vuelta del login).
 */
export function PersonajesColeccion({ personajes }: { personajes: PersonajeColeccion[] }) {
  const t = useTranslations("personajes");
  const locale = useLocale();
  const reducir = useReducedMotion();
  const { authActiva, ready, user, coleccion } = useColeccion();
  const [modo, setModo] = useState<Modo>("explorar");
  const [elegidos, setElegidos] = useState<string[]>([]);
  const inicioRef = useRef<HTMLDivElement>(null);
  const pedidoRef = useRef<HTMLDivElement>(null);

  // Se lee con window.location para que la página siga siendo estática.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const pedidos = [q.get("personaje"), ...(q.get("personajes") ?? "").split(",")];
    const validos = personajes.map((p) => p.slug).filter((s) => pedidos.includes(s));
    if (validos.length > 0 || q.has("comprar")) {
      setModo("comprar");
      setElegidos(validos);
      // Vuelta del login: la entrega aparece tras este render, el #hash no alcanzó a desplazar.
      if (window.location.hash === "#contacto-entrega" && validos.length > 0) {
        window.setTimeout(() => irA(document.getElementById("contacto-entrega"), true), 120);
      }
    }
  }, [personajes]);

  const cambiarModo = (nuevo: Modo) => {
    setModo(nuevo);
    if (nuevo === "explorar") setElegidos([]);
    const url = new URL(window.location.href);
    url.search = nuevo === "comprar" ? "?comprar=1" : "";
    url.hash = "";
    window.history.replaceState(window.history.state, "", url);
    irA(inicioRef.current, reducir);
  };

  const comprando = modo === "comprar";
  const tiene = (slug: string) => ready && coleccion.has(slug);
  const guardados = personajes.filter((p) => tiene(p.slug)).length;

  // Pedido (mismo flujo que tenía /contacto).
  const nombres = personajes.filter((p) => elegidos.includes(p.slug)).map((p) => p.nombre);
  const seleccion = personajes.filter((p) => elegidos.includes(p.slug)).map((p) => p.slug);
  const todos = elegidos.length === personajes.length;
  const elegirTodos = () => setElegidos(personajes.map((p) => p.slug));
  const total = cotizar(elegidos.length).total;

  // Sin Supabase (dev) no hay cuentas: los botones quedan libres, igual que el resto del sitio.
  const acceso: AccesoEntrega = !authActiva ? "listo" : !ready ? "cargando" : user ? "listo" : "login";
  const correo = user?.email ?? null;
  // Google trae el nombre en los metadatos; con enlace mágico solo hay correo.
  const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  const nombre = meta?.full_name ?? meta?.name ?? null;
  const href = (mensaje: string) => (WHATSAPP_CONTACTO ? urlWhatsApp(WHATSAPP_CONTACTO, mensaje) : null);
  const envioHref = href(armarMensajeEnvio({ personajes: nombres, locale, nombre, correo }));
  const retiroHref = href(armarMensajeRetiro({ personajes: nombres, locale, nombre, correo }));
  // Al volver del login (Google o enlace mágico) la selección sigue marcada.
  const redirectPath =
    typeof window === "undefined"
      ? undefined
      : `${window.location.pathname}?personajes=${seleccion.join(",")}#contacto-entrega`;

  const pasos = [
    { n: 1, label: t("paso_elige"), hecho: elegidos.length > 0 },
    { n: 2, label: t("paso_pedido"), hecho: elegidos.length > 0 },
    { n: 3, label: t("paso_entrega"), hecho: false },
  ];

  const fade = {
    initial: reducir ? false : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: 0.22, ease: "easeOut" },
  } as const;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-10">
      <div ref={inicioRef} className="scroll-mt-24">
        {/* Cabecera: cambia con el modo, el resto de la ventana se queda. */}
        <header className="mx-auto mb-6 flex max-w-xl flex-col items-center text-center sm:mb-8">
          <AnimatePresence mode="wait" initial={false}>
            {comprando ? (
              <motion.div key="comprar" {...fade} className="flex flex-col items-center gap-2">
                <p className="text-xs uppercase tracking-[0.22em] text-acento-dorado">{t("compra_eyebrow")}</p>
                <h1 className="font-serif text-3xl font-bold text-texto-claro sm:text-4xl">{t("compra_titulo")}</h1>
                <p className="text-sm text-stone-400">
                  {t("compra_precios", {
                    unidad: PRECIOS.unidad,
                    trio: TAMANO_TRIO,
                    precioTrio: PRECIOS.trio,
                    coleccion: TAMANO_COLECCION,
                    precioColeccion: PRECIOS.coleccion,
                  })}
                </p>
              </motion.div>
            ) : (
              <motion.div key="explorar" {...fade} className="flex flex-col items-center gap-2">
                <p className="text-xs uppercase tracking-[0.22em] text-acento-dorado">{t("eyebrow")}</p>
                <h1 className="font-serif text-3xl font-bold text-texto-claro sm:text-4xl">{t("titulo")}</h1>
                <p className="font-serif text-base italic text-stone-300">
                  {ready && guardados > 0
                    ? t("progreso", { n: guardados, total: personajes.length })
                    : t("lema")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Pasos de compra */}
        <AnimatePresence initial={false}>
          {comprando && (
            <motion.ol
              key="pasos"
              initial={reducir ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              aria-label={t("pasos_aria")}
              className="mx-auto mb-7 flex max-w-md items-center justify-center gap-2 overflow-hidden text-[11px] sm:text-xs"
            >
              {pasos.map((p, i) => (
                <li key={p.n} className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 ${
                      p.hecho || p.n === 1
                        ? "border-acento-dorado/60 text-acento-dorado"
                        : "border-borde-sutil text-stone-500"
                    }`}
                  >
                    <span className="font-semibold">{p.n}</span>
                    {p.label}
                  </span>
                  {i < pasos.length - 1 && <span aria-hidden="true" className="h-px w-3 bg-borde-sutil sm:w-5" />}
                </li>
              ))}
            </motion.ol>
          )}
        </AnimatePresence>

        {comprando && (
          <div className="mb-5 flex justify-center">
            <button
              type="button"
              onClick={() => (todos ? setElegidos([]) : elegirTodos())}
              className="rounded-full border border-borde-sutil px-4 py-2 text-sm font-medium text-stone-300 transition-colors hover:border-acento-dorado hover:text-acento-dorado"
            >
              {todos ? t("quitar_todos") : t("elegir_todos", { n: personajes.length, precio: PRECIOS.coleccion })}
            </button>
          </div>
        )}

        {/* Los mismos círculos en los dos modos. */}
        <ul className="mx-auto grid max-w-md grid-cols-2 gap-x-5 gap-y-8 sm:max-w-2xl sm:grid-cols-3 lg:max-w-none lg:grid-cols-6 lg:gap-x-6">
          {personajes.map((p) => {
            const guardado = tiene(p.slug);
            const elegido = comprando && elegidos.includes(p.slug);
            const brilla = comprando ? elegido : guardado;
            const apagado = comprando && !elegido;

            const circulo = (
              <span
                className={`relative block aspect-square w-full overflow-hidden rounded-full transition-all duration-300 ${
                  brilla
                    ? "scale-[1.03] border-4 border-acento-dorado shadow-[0_0_0_6px_rgba(200,155,60,0.18),0_14px_30px_-10px_rgba(200,155,60,0.55)]"
                    : "border-[3px] border-[#3A3633]"
                }`}
                style={{ background: TARJETA.placa }}
              >
                {(p.icono ?? p.imagen) && (
                  <Image
                    src={(p.icono ?? p.imagen)!}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 42vw, (max-width: 1024px) 200px, 150px"
                    className={`transition-opacity duration-300 ${
                      p.icono ? "object-cover mix-blend-multiply" : "object-cover object-top"
                    } ${apagado ? "opacity-45" : "opacity-100"}`}
                  />
                )}
              </span>
            );

            const texto = (
              <span className={`${comprando ? "mt-5" : "mt-3"} flex flex-col items-center gap-0.5 text-center`}>
                <span
                  className={`font-serif text-lg font-bold leading-tight transition-colors ${
                    elegido ? "text-acento-dorado" : "text-texto-claro"
                  }`}
                >
                  {p.nombre}
                </span>
                {p.origen && (
                  <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">{p.origen}</span>
                )}
              </span>
            );

            return (
              <li key={p.slug} className="relative mx-auto w-full max-w-[160px]">
                {comprando ? (
                  <button
                    type="button"
                    aria-pressed={elegido}
                    aria-label={
                      guardado
                        ? t("elegir_aria_guardado", { nombre: p.nombre })
                        : t("elegir_aria", { nombre: p.nombre })
                    }
                    onClick={() => setElegidos((l) => alternar(l, p.slug))}
                    className="group block w-full rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acento-dorado"
                  >
                    <span className="relative block">
                      {circulo}
                      {/* Seleccionar: píldora sobre el borde inferior del círculo. */}
                      <span
                        aria-hidden="true"
                        className={`absolute -bottom-3 left-1/2 flex h-7 -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border px-3 text-[11px] font-semibold shadow-lg shadow-black/40 transition-colors ${
                          elegido
                            ? "border-acento-dorado bg-acento-dorado text-fondo-oscuro"
                            : "border-white/20 bg-fondo-oscuro text-stone-300 group-hover:border-acento-dorado group-hover:text-acento-dorado"
                        }`}
                      >
                        {elegido ? <Check className="h-3 w-3" /> : <span className="text-sm leading-none">+</span>}
                        {elegido ? t("elegido") : t("elegir")}
                      </span>
                    </span>
                    {texto}
                  </button>
                ) : (
                  <Link
                    href={{ pathname: "/personajes/[slug]", params: { slug: p.slug } }}
                    aria-label={`${p.nombre} — ${t("ver_detalle")}`}
                    className="group block rounded-2xl transition-transform duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acento-dorado motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    {circulo}
                    {texto}
                  </Link>
                )}

                {/* Esquina: ✓ si está en tu colección; en compra, candado en los que no tienes. */}
                <AnimatePresence initial={false}>
                  {guardado ? (
                    <motion.span
                      key="guardado"
                      role="img"
                      aria-label={t("en_coleccion")}
                      title={t("en_coleccion")}
                      initial={reducir ? false : { scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      className={`${SELLO} pointer-events-none bg-acento-dorado text-fondo-oscuro`}
                    >
                      <Check />
                    </motion.span>
                  ) : comprando ? (
                    <motion.span
                      key="candado"
                      role="img"
                      aria-label={t("no_coleccion")}
                      title={t("no_coleccion")}
                      initial={reducir ? false : { scale: 0.6, opacity: 0, rotate: -20 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 420, damping: 22 }}
                      className={`${SELLO} pointer-events-none bg-[#1C1917] text-stone-200 ring-1 ring-white/20`}
                    >
                      <Candado />
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        {!comprando && (
          <p className="mt-10 text-center text-xs uppercase tracking-[0.25em] text-stone-500 sm:text-sm">
            <span className="mr-2 text-acento-dorado" aria-hidden="true">✦</span>
            {t("proximamente")}
            <span className="ml-2 text-acento-dorado" aria-hidden="true">✦</span>
          </p>
        )}

        {/* Botón de abajo: cambia de modo. Fijo mientras se ven los círculos. */}
        <div className="pointer-events-none sticky bottom-0 z-20 -mx-4 mt-8 bg-gradient-to-t from-fondo-oscuro via-fondo-oscuro/90 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 sm:-mx-6 sm:px-6">
          <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-2">
            {comprando ? (
              <>
                <button
                  type="button"
                  onClick={() => cambiarModo("explorar")}
                  className="flex h-12 flex-none items-center gap-1 rounded-full border border-borde-sutil bg-fondo-oscuro px-4 text-sm font-medium text-stone-300 transition-colors hover:border-acento-dorado hover:text-acento-dorado"
                >
                  <span aria-hidden="true">‹</span>
                  {t("volver_coleccion")}
                </button>
                <button
                  type="button"
                  disabled={elegidos.length === 0}
                  onClick={() => irA(pedidoRef.current, reducir)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-acento-dorado px-4 text-sm font-semibold text-fondo-oscuro shadow-lg shadow-black/40 transition-opacity disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500"
                >
                  {elegidos.length === 0
                    ? t("elige_uno")
                    : t("continuar", { n: elegidos.length, total })}
                  {elegidos.length > 0 && <span aria-hidden="true">↓</span>}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => cambiarModo("comprar")}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-acento-dorado px-5 text-sm font-semibold text-fondo-oscuro shadow-lg shadow-black/40 transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
              >
                <Candado />
                {t("conseguir")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pasos 2 y 3: aparecen al elegir el primer personaje. */}
      {comprando && (
        <div ref={pedidoRef} className="mx-auto mt-8 max-w-3xl scroll-mt-24 space-y-10">
          <AnimatePresence initial={false}>
            {elegidos.length > 0 && (
              <ResumenPedido key="resumen" cantidad={elegidos.length} onCompletar={elegirTodos} />
            )}
            {elegidos.length > 0 && (
              <motion.div
                key="entrega"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <EntregaContacto
                  envioHref={envioHref}
                  retiroHref={retiroHref}
                  acceso={acceso}
                  cuenta={nombre ?? correo}
                  redirectPath={redirectPath}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
