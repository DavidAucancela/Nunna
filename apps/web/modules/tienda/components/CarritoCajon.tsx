"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { motion, useDragControls, useReducedMotion, type PanInfo } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useCarrito } from "@/components/tienda/CarritoProvider";
import { formatoPrecio } from "@/lib/tienda/carrito";
import { WHATSAPP_PEDIDOS } from "@/lib/tienda/config";
import { armarMensajePedido, nombreDeLinea, urlPedidoWhatsApp, type EntregaElegida } from "@/lib/tienda/pedido-whatsapp";
import { MiniaturaProducto } from "./MiniaturaProducto";

/** Bajo `sm` el carrito es una hoja que sube desde abajo; desde `sm`, un cajón a la derecha. */
const MQ_MOVIL = "(max-width: 639px)";

/**
 * Carrito de la tienda (fase 1: el pedido se envía por WhatsApp).
 * Mismo patrón que `LoginModal`: portal a <body> (el header usa `backdrop-filter`),
 * cierre al tocar fuera / Escape / ✕ y, en móvil, deslizando el asa.
 */
export function CarritoCajon({ onClose }: { onClose: () => void }) {
  const t = useTranslations("tienda.carrito");
  const tNav = useTranslations("nav");
  const tEntrega = useTranslations("tienda.entrega");
  const locale = useLocale();
  const reduced = useReducedMotion();
  const { lineas, subtotal, entrega, fijarCantidad, quitar, vaciar } = useCarrito();
  const ref = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [movil] = useState(() => window.matchMedia(MQ_MOVIL).matches);
  const toqueEnFondo = useRef(false);

  // "envio" o el id de un punto de retiro.
  const [modo, setModo] = useState<string>("envio");
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [enviado, setEnviado] = useState(false);

  const precio = (n: number) => formatoPrecio(n, locale);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !ref.current) return;
      const focusables = ref.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [onClose]);

  const entregaElegida: EntregaElegida = useMemo(() => {
    const punto = entrega.retiro.find((r) => r.id === modo);
    return punto ? { tipo: "retiro", punto } : { tipo: "envio" };
  }, [entrega.retiro, modo]);

  const urlPedido =
    WHATSAPP_PEDIDOS && lineas.length
      ? urlPedidoWhatsApp(WHATSAPP_PEDIDOS, armarMensajePedido(lineas, entregaElegida, { nombre, ciudad }, locale))
      : null;

  const alSoltar = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  const desde = reduced ? { opacity: 0 } : movil ? { y: "100%" } : { x: "100%" };

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-fondo-oscuro/80 pt-16 backdrop-blur-sm sm:items-stretch sm:justify-end sm:pt-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={(e) => {
        toqueEnFondo.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (toqueEnFondo.current && e.target === e.currentTarget) onClose();
      }}
      data-lenis-prevent
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="carrito-titulo"
        tabIndex={-1}
        className="relative flex max-h-full w-full flex-col rounded-t-3xl border border-b-0 border-borde-sutil bg-fondo-oscuro outline-none sm:h-full sm:max-w-md sm:rounded-none sm:border-y-0 sm:border-r-0"
        initial={desde}
        animate={{ y: 0, x: 0, opacity: 1 }}
        exit={desde}
        transition={reduced ? { duration: 0 } : { type: "spring", damping: 34, stiffness: 320 }}
        drag={movil ? "y" : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={alSoltar}
      >
        {/* Asa — solo móvil */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="absolute inset-x-0 top-0 z-10 flex h-7 cursor-grab touch-none items-center justify-center active:cursor-grabbing sm:hidden"
          aria-hidden="true"
        >
          <span className="h-1.5 w-10 rounded-full bg-stone-700" />
        </div>

        <header className="flex items-center justify-between border-b border-borde-sutil px-5 pb-4 pt-7 sm:pt-6">
          <h2 id="carrito-titulo" className="font-serif text-xl font-bold text-texto-claro">
            {t("titulo")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={tNav("cerrar")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-900 hover:text-texto-claro"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {lineas.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-14 text-center">
            <p className="text-stone-400">{t("vacio")}</p>
            <Link
              href="/tienda"
              onClick={onClose}
              className="rounded-full bg-acento-rojo px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#a02a28]"
            >
              {t("ver_tienda")}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              <ul className="space-y-3">
                {lineas.map((l) => {
                  const nombreLinea = nombreDeLinea(l, locale);
                  return (
                    <li key={l.producto.id} className="flex gap-3 rounded-2xl border border-borde-sutil bg-stone-950/60 p-2.5">
                      <MiniaturaProducto producto={l.producto} sizes="64px" className="h-16 w-16 shrink-0 rounded-xl" />
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug text-texto-claro">{nombreLinea}</p>
                          <button
                            type="button"
                            onClick={() => quitar(l.producto.id)}
                            aria-label={t("quitar", { nombre: nombreLinea })}
                            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-900 hover:text-texto-claro"
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center rounded-full border border-borde-sutil" role="group" aria-label={t("cantidad")}>
                            <button
                              type="button"
                              onClick={() => fijarCantidad(l.producto.id, l.cantidad - 1)}
                              aria-label={t("menos")}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-300 hover:bg-stone-900"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm tabular-nums text-texto-claro" aria-live="polite">
                              {l.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => fijarCantidad(l.producto.id, l.cantidad + 1)}
                              aria-label={t("mas")}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-300 hover:bg-stone-900"
                            >
                              +
                            </button>
                          </div>
                          <p className="text-sm font-semibold tabular-nums text-texto-claro">{precio(l.total)}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <fieldset className="mt-6">
                <legend className="mb-2 text-xs uppercase tracking-[0.18em] text-acento-dorado" aria-hidden="true">{t("entrega")}</legend>
                <div className="space-y-2" role="radiogroup" aria-label={t("entrega")}>
                  <OpcionEntrega
                    activa={modo === "envio"}
                    onElegir={() => setModo("envio")}
                    titulo={t("opcion_envio")}
                    detalle={t("opcion_envio_detalle")}
                  />
                  {entrega.retiro.map((r) => (
                    <OpcionEntrega
                      key={r.id}
                      activa={modo === r.id}
                      onElegir={() => setModo(r.id)}
                      titulo={t("opcion_retiro", { lugar: r.lugar })}
                      detalle={[
                        r.direccion,
                        r.locales && tEntrega("locales", { locales: r.locales }),
                        r.ciudad,
                        r.horario,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-5">
                <legend className="mb-2 text-xs uppercase tracking-[0.18em] text-stone-500">{t("tus_datos")}</legend>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder={t("nombre")}
                    aria-label={t("nombre")}
                    autoComplete="given-name"
                    maxLength={60}
                    className="rounded-xl border border-borde-sutil bg-stone-950 px-3 py-2.5 text-base text-texto-claro placeholder:text-stone-600 focus:border-acento-dorado focus:outline-none sm:text-sm"
                  />
                  {modo === "envio" && (
                    <input
                      type="text"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder={t("ciudad")}
                      aria-label={t("ciudad")}
                      autoComplete="address-level2"
                      maxLength={60}
                      className="rounded-xl border border-borde-sutil bg-stone-950 px-3 py-2.5 text-base text-texto-claro placeholder:text-stone-600 focus:border-acento-dorado focus:outline-none sm:text-sm"
                    />
                  )}
                </div>
              </fieldset>
            </div>

            <footer className="border-t border-borde-sutil px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-stone-400">{t("subtotal")}</span>
                <span className="font-serif text-2xl font-bold tabular-nums text-texto-claro">{precio(subtotal)}</span>
              </div>
              {modo === "envio" && <p className="mt-1 text-xs text-stone-500">{t("nota_envio")}</p>}

              {enviado ? (
                <div className="mt-4 rounded-2xl border border-borde-sutil bg-stone-950 p-4 text-center">
                  <p className="text-sm text-texto-claro">{t("enviado_pregunta")}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        vaciar();
                        onClose();
                      }}
                      className="flex-1 rounded-full bg-acento-jade px-3 py-2.5 text-sm font-semibold text-white hover:brightness-110"
                    >
                      {t("vaciar")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnviado(false)}
                      className="flex-1 rounded-full border border-borde-sutil px-3 py-2.5 text-sm text-stone-300 hover:bg-stone-900"
                    >
                      {t("mantener")}
                    </button>
                  </div>
                </div>
              ) : urlPedido ? (
                <a
                  href={urlPedido}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setEnviado(true)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#1f8f4e] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/30 transition-colors hover:bg-[#1a7a42]"
                >
                  <LogoWhatsApp className="h-5 w-5" />
                  {t("enviar")}
                </a>
              ) : (
                <p className="mt-4 rounded-2xl border border-borde-sutil bg-stone-950 px-4 py-3 text-center text-sm text-stone-400">
                  {t("pronto")}
                </p>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full py-2 text-sm text-stone-400 transition-colors hover:text-texto-claro"
              >
                {t("seguir")}
              </button>
            </footer>
          </>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function OpcionEntrega({
  activa,
  onElegir,
  titulo,
  detalle,
}: {
  activa: boolean;
  onElegir: () => void;
  titulo: string;
  detalle: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activa}
      onClick={onElegir}
      className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
        activa ? "border-acento-dorado bg-acento-dorado/10" : "border-borde-sutil hover:border-stone-600"
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          activa ? "border-acento-dorado" : "border-stone-600"
        }`}
      >
        {activa && <span className="h-2 w-2 rounded-full bg-acento-dorado" />}
      </span>
      <span>
        <span className="block text-sm font-medium text-texto-claro">{titulo}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-stone-400">{detalle}</span>
      </span>
    </button>
  );
}

/** Logo de WhatsApp (mismo trazo que `components/ui/WhatsAppShare.tsx`). */
function LogoWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className ?? ""}`} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
