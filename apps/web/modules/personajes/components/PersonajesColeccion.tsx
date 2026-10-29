"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useColeccion } from "@/components/auth/ColeccionProvider";
import { getLenis } from "@/components/ui/LenisProvider";
import { IconoWhatsApp } from "@/components/ui/IconoWhatsApp";
import { PRECIOS, TAMANO_COLECCION, TAMANO_TRIO, cotizar } from "@/lib/contacto/precios";
import {
  WHATSAPP_CONTACTO,
  armarMensajeEnvio,
  armarMensajeRetiro,
  urlWhatsApp,
} from "@/lib/contacto/whatsapp";
import { LoginModal } from "@/modules/auth/components/LoginModal";
import { PasoEntrega, type Entrega } from "@/modules/contacto/components/PasoEntrega";
import { PasoEnviar, type AccesoEnvio } from "@/modules/contacto/components/PasoEnviar";
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
/** Pasos de la compra: 1 Elige · 2 Pedido · 3 Entrega · 4 Enviar. */
type Paso = 1 | 2 | 3 | 4;

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
const BOTON_SECUNDARIO =
  "flex h-12 flex-none items-center gap-1 rounded-full border border-borde-sutil bg-fondo-oscuro px-4 text-sm font-medium text-stone-300 transition-colors hover:border-acento-dorado hover:text-acento-dorado";
const BOTON_PRINCIPAL =
  "flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold shadow-lg shadow-black/40 transition-opacity disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500";

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
 * - **Compra** (botón de abajo): pasos de verdad, uno por pantalla — 1 Elige (candados en los que no
 *   tienes) · 2 Pedido (precio y promos) · 3 Entrega (envío o retiro) · 4 Enviar (resumen + WhatsApp;
 *   aquí, y solo aquí, se pide iniciar sesión). La barra de abajo lleva siempre Atrás + la acción.
 * `?comprar=1`, `?personaje=<slug>` o `?personajes=a,b` abren en compra; la vuelta del login trae
 * además `&entrega=…&paso=4` para caer de nuevo en el último paso con todo elegido.
 */
export function PersonajesColeccion({ personajes }: { personajes: PersonajeColeccion[] }) {
  const t = useTranslations("personajes");
  const tc = useTranslations("contacto");
  const locale = useLocale();
  const reducir = useReducedMotion();
  const { authActiva, ready, user, coleccion } = useColeccion();
  const [modo, setModo] = useState<Modo>("explorar");
  const [paso, setPaso] = useState<Paso>(1);
  const [sentido, setSentido] = useState(1);
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [loginAbierto, setLoginAbierto] = useState(false);
  const inicioRef = useRef<HTMLDivElement>(null);

  // Se lee con window.location para que la página siga siendo estática.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const pedidos = [q.get("personaje"), ...(q.get("personajes") ?? "").split(",")];
    const validos = personajes.map((p) => p.slug).filter((s) => pedidos.includes(s));
    if (validos.length === 0 && !q.has("comprar")) return;
    setModo("comprar");
    setElegidos(validos);
    const e = q.get("entrega");
    const entregaUrl = e === "envio" || e === "retiro" ? e : null;
    setEntrega(entregaUrl);
    const p = Number(q.get("paso"));
    // Solo se salta a un paso si lo anterior ya está completo.
    if (validos.length > 0 && p >= 2) setPaso(p >= 4 && entregaUrl ? 4 : p >= 3 ? 3 : 2);
  }, [personajes]);

  const comprando = modo === "comprar";

  const cambiarModo = (nuevo: Modo) => {
    setModo(nuevo);
    setPaso(1);
    if (nuevo === "explorar") {
      setElegidos([]);
      setEntrega(null);
    }
    const url = new URL(window.location.href);
    url.search = nuevo === "comprar" ? "?comprar=1" : "";
    url.hash = "";
    window.history.replaceState(window.history.state, "", url);
    irA(inicioRef.current, reducir);
  };

  const irAPaso = (nuevo: Paso) => {
    setSentido(nuevo > paso ? 1 : -1);
    setPaso(nuevo);
    irA(inicioRef.current, reducir);
  };

  const tiene = (slug: string) => ready && coleccion.has(slug);
  const guardados = personajes.filter((p) => tiene(p.slug)).length;

  // El pedido, en el orden de la tarjeta (no en el que se tocaron).
  const elegidosDatos = personajes.filter((p) => elegidos.includes(p.slug));
  const nombres = elegidosDatos.map((p) => p.nombre);
  const todos = elegidos.length === personajes.length;
  const elegirTodos = () => setElegidos(personajes.map((p) => p.slug));
  const total = cotizar(elegidos.length).total;

  // Sin Supabase (dev) no hay cuentas: se envía sin pedir sesión, igual que el resto del sitio.
  const acceso: AccesoEnvio = !authActiva ? "listo" : !ready ? "cargando" : user ? "listo" : "login";
  const correo = user?.email ?? null;
  // Google trae el nombre en los metadatos; con enlace mágico solo hay correo.
  const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  const nombre = meta?.full_name ?? meta?.name ?? null;
  const mensaje =
    entrega === "retiro"
      ? armarMensajeRetiro({ personajes: nombres, locale, nombre, correo })
      : armarMensajeEnvio({ personajes: nombres, locale, nombre, correo });
  const whatsappHref = WHATSAPP_CONTACTO ? urlWhatsApp(WHATSAPP_CONTACTO, mensaje) : null;
  // Al volver del login (Google o enlace mágico) se cae otra vez en "Enviar", con todo elegido.
  const redirectPath =
    typeof window === "undefined"
      ? undefined
      : `${window.location.pathname}?comprar=1&personajes=${elegidosDatos.map((p) => p.slug).join(",")}&entrega=${entrega ?? ""}&paso=4`;

  const pasos: { n: Paso; label: string }[] = [
    { n: 1, label: t("paso_elige") },
    { n: 2, label: t("paso_pedido") },
    { n: 3, label: t("paso_entrega") },
    { n: 4, label: t("paso_enviar") },
  ];
  // Un paso se puede abrir si los anteriores están completos.
  const alcanzable = (n: Paso) => n === 1 || (elegidos.length > 0 && (n <= 3 || entrega !== null));

  const encabezado = !comprando
    ? { eyebrow: t("eyebrow"), titulo: t("titulo"), texto: ready && guardados > 0 ? t("progreso", { n: guardados, total: personajes.length }) : t("lema") }
    : paso === 1
      ? {
          eyebrow: t("paso_de", { n: 1, total: 4 }),
          titulo: t("compra_titulo"),
          texto: t("compra_precios", {
            unidad: PRECIOS.unidad,
            trio: TAMANO_TRIO,
            precioTrio: PRECIOS.trio,
            coleccion: TAMANO_COLECCION,
            precioColeccion: PRECIOS.coleccion,
          }),
        }
      : paso === 2
        ? { eyebrow: t("paso_de", { n: 2, total: 4 }), titulo: t("pedido_titulo"), texto: t("pedido_ayuda") }
        : paso === 3
          ? { eyebrow: t("paso_de", { n: 3, total: 4 }), titulo: t("entrega_titulo"), texto: t("entrega_ayuda") }
          : { eyebrow: t("paso_de", { n: 4, total: 4 }), titulo: t("enviar_titulo"), texto: t("enviar_ayuda") };

  const fade = {
    initial: reducir ? false : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: 0.22, ease: "easeOut" },
  } as const;

  // ── Círculos (colección y paso 1) ─────────────────────────────────────────────
  const circulos = (
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
            {p.origen && <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">{p.origen}</span>}
          </span>
        );

        return (
          <li key={p.slug} className="relative mx-auto w-full max-w-[160px]">
            {comprando ? (
              <button
                type="button"
                aria-pressed={elegido}
                aria-label={guardado ? t("elegir_aria_guardado", { nombre: p.nombre }) : t("elegir_aria", { nombre: p.nombre })}
                onClick={() => setElegidos((l) => alternar(l, p.slug))}
                className="group block w-full rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acento-dorado"
              >
                <span className="relative block">
                  {circulo}
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
  );

  // ── Contenido de cada paso ────────────────────────────────────────────────────
  const contenidoPaso =
    paso === 1 ? (
      <>
        <div className="mb-5 flex justify-center">
          <button
            type="button"
            onClick={() => (todos ? setElegidos([]) : elegirTodos())}
            className="rounded-full border border-borde-sutil px-4 py-2 text-sm font-medium text-stone-300 transition-colors hover:border-acento-dorado hover:text-acento-dorado"
          >
            {todos ? t("quitar_todos") : t("elegir_todos", { n: personajes.length, precio: PRECIOS.coleccion })}
          </button>
        </div>
        {circulos}
      </>
    ) : paso === 2 ? (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <ul className="flex flex-wrap justify-center gap-2" aria-label={t("tus_personajes")}>
          {elegidosDatos.map((p) => (
            <li key={p.slug} className="flex items-center gap-2 rounded-full border border-borde-sutil py-1 pl-1 pr-1.5">
              <span className="relative h-8 w-8 overflow-hidden rounded-full" style={{ background: TARJETA.placa }}>
                {p.icono && <Image src={p.icono} alt="" fill sizes="32px" className="object-cover mix-blend-multiply" />}
              </span>
              <span className="text-sm text-stone-200">{p.nombre}</span>
              <button
                type="button"
                onClick={() => {
                  const quedan = elegidos.filter((s) => s !== p.slug);
                  setElegidos(quedan);
                  if (quedan.length === 0) irAPaso(1);
                }}
                aria-label={t("quitar_aria", { nombre: p.nombre })}
                className="flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-800 hover:text-texto-claro"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          ))}
          {!todos && (
            <li>
              <button
                type="button"
                onClick={() => irAPaso(1)}
                className="flex h-10 items-center rounded-full border border-dashed border-acento-dorado/60 px-4 text-sm font-medium text-acento-dorado transition-colors hover:bg-acento-dorado/10"
              >
                + {t("agregar_mas")}
              </button>
            </li>
          )}
        </ul>
        <ResumenPedido cantidad={elegidos.length} onCompletar={elegirTodos} />
      </div>
    ) : paso === 3 ? (
      <PasoEntrega valor={entrega} onCambio={setEntrega} />
    ) : (
      <PasoEnviar
        personajes={elegidosDatos}
        entrega={entrega ?? "envio"}
        acceso={acceso}
        cuenta={nombre ?? correo}
        onCambiarPersonajes={() => irAPaso(1)}
        onCambiarEntrega={() => irAPaso(3)}
      />
    );

  // ── Barra de abajo: Atrás + la acción del paso ───────────────────────────────
  let accion: React.ReactNode;
  if (!comprando) {
    accion = (
      <button
        type="button"
        onClick={() => cambiarModo("comprar")}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-acento-dorado px-5 text-sm font-semibold text-fondo-oscuro shadow-lg shadow-black/40 transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
      >
        <Candado />
        {t("conseguir")}
      </button>
    );
  } else {
    const atras =
      paso === 1 ? (
        <button type="button" onClick={() => cambiarModo("explorar")} className={BOTON_SECUNDARIO}>
          <span aria-hidden="true">‹</span>
          {t("volver_coleccion")}
        </button>
      ) : (
        <button type="button" onClick={() => irAPaso((paso - 1) as Paso)} className={BOTON_SECUNDARIO}>
          <span aria-hidden="true">‹</span>
          {t("atras")}
        </button>
      );

    let principal: React.ReactNode;
    if (paso === 1) {
      principal = (
        <button
          type="button"
          disabled={elegidos.length === 0}
          onClick={() => irAPaso(2)}
          className={`${BOTON_PRINCIPAL} bg-acento-dorado text-fondo-oscuro`}
        >
          {elegidos.length === 0 ? t("elige_uno") : t("continuar", { n: elegidos.length, total })}
          {elegidos.length > 0 && <span aria-hidden="true">›</span>}
        </button>
      );
    } else if (paso === 2 || paso === 3) {
      principal = (
        <button
          type="button"
          disabled={paso === 3 && !entrega}
          onClick={() => irAPaso((paso + 1) as Paso)}
          className={`${BOTON_PRINCIPAL} bg-acento-dorado text-fondo-oscuro`}
        >
          {paso === 3 && !entrega ? t("elige_entrega") : t("siguiente")}
          {!(paso === 3 && !entrega) && <span aria-hidden="true">›</span>}
        </button>
      );
    } else if (!whatsappHref) {
      principal = <p className="flex-1 text-center text-sm text-stone-500">{tc("pronto")}</p>;
    } else if (acceso === "login") {
      principal = (
        <button
          type="button"
          onClick={() => setLoginAbierto(true)}
          aria-haspopup="dialog"
          className={`${BOTON_PRINCIPAL} bg-acento-dorado text-fondo-oscuro`}
        >
          <Candado />
          {t("login_enviar")}
        </button>
      );
    } else {
      principal = (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={acceso === "cargando"}
          onClick={(e) => acceso === "cargando" && e.preventDefault()}
          className={`${BOTON_PRINCIPAL} bg-[#1FA855] text-white hover:bg-[#1B964C]`}
        >
          <IconoWhatsApp className="h-4 w-4" />
          {t("enviar_whatsapp")}
        </a>
      );
    }
    accion = (
      <>
        {atras}
        {principal}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-10">
      <div ref={inicioRef} className="scroll-mt-24">
        {/* Cabecera: cambia con el modo y el paso; el resto de la ventana se queda. */}
        <header className="mx-auto mb-6 flex max-w-xl flex-col items-center text-center sm:mb-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={comprando ? `paso-${paso}` : "explorar"} {...fade} className="flex flex-col items-center gap-2">
              <p className="text-xs uppercase tracking-[0.22em] text-acento-dorado">{encabezado.eyebrow}</p>
              <h1 className="font-serif text-3xl font-bold text-texto-claro sm:text-4xl">{encabezado.titulo}</h1>
              <p className={comprando ? "text-sm text-stone-400" : "font-serif text-base italic text-stone-300"}>
                {encabezado.texto}
              </p>
            </motion.div>
          </AnimatePresence>
        </header>

        {/* Indicador de pasos: el actual resaltado; los alcanzables se pueden tocar. */}
        {comprando && (
          <ol aria-label={t("pasos_aria")} className="mx-auto mb-8 flex max-w-lg items-center justify-center gap-1.5 text-[11px] sm:gap-2 sm:text-xs">
            {pasos.map((s, i) => {
              const actual = s.n === paso;
              const hecho = s.n < paso;
              return (
                <li key={s.n} className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    disabled={actual || !alcanzable(s.n)}
                    onClick={() => irAPaso(s.n)}
                    aria-current={actual ? "step" : undefined}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 transition-colors ${
                      actual
                        ? "border-acento-dorado bg-acento-dorado text-fondo-oscuro"
                        : hecho
                          ? "border-acento-dorado/60 text-acento-dorado hover:bg-acento-dorado/10"
                          : "border-borde-sutil text-stone-500"
                    } disabled:cursor-default`}
                  >
                    <span className="font-semibold">{hecho ? <Check className="h-3 w-3" /> : s.n}</span>
                    {s.label}
                  </button>
                  {i < pasos.length - 1 && <span aria-hidden="true" className="h-px w-2 bg-borde-sutil sm:w-4" />}
                </li>
              );
            })}
          </ol>
        )}

        <AnimatePresence mode="wait" initial={false} custom={sentido}>
          <motion.div
            key={comprando ? `contenido-${paso}` : "coleccion"}
            custom={sentido}
            initial={reducir ? false : { opacity: 0, x: 24 * sentido }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducir ? { opacity: 0 } : { opacity: 0, x: -24 * sentido }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {comprando ? contenidoPaso : circulos}
          </motion.div>
        </AnimatePresence>

        {!comprando && (
          <p className="mt-10 text-center text-xs uppercase tracking-[0.25em] text-stone-500 sm:text-sm">
            <span className="mr-2 text-acento-dorado" aria-hidden="true">✦</span>
            {t("proximamente")}
            <span className="ml-2 text-acento-dorado" aria-hidden="true">✦</span>
          </p>
        )}

        {/* Barra de abajo: siempre a mano mientras se recorre la página. */}
        <div className="pointer-events-none sticky bottom-0 z-20 -mx-4 mt-8 bg-gradient-to-t from-fondo-oscuro via-fondo-oscuro/90 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 sm:-mx-6 sm:px-6">
          <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-2">{accion}</div>
        </div>
      </div>

      <AnimatePresence>
        {loginAbierto && acceso === "login" && (
          <LoginModal onClose={() => setLoginAbierto(false)} redirectPath={redirectPath} subtitulo={tc("acceso_texto")} />
        )}
      </AnimatePresence>
    </div>
  );
}
