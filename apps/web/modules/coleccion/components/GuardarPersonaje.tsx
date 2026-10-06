"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useColeccion, useEnColeccion } from "@/components/auth/ColeccionProvider";
import { conMarcaQr, llegadaQrVigente, useLlegadaPorQr } from "@/lib/qr-origen";
import type { Origen } from "@/lib/origen-styles";
import { AuthOpciones } from "@/modules/auth/components/AuthOpciones";
import { CertificadoColeccion, type CertificadoLogro } from "./CertificadoColeccion";
import { DespertarAnimation } from "./DespertarAnimation";
import type { PersonajeLite } from "../types";

/** Evento que emite el centinela al final de la ficha (la ficha es server; esto evita un contexto). */
const EVENTO_FIN_FICHA = "nunna:fin-ficha";

/**
 * Marca invisible justo antes del cross-sell: cuando entra en pantalla, la persona
 * ya recorrió la ficha → `GuardarPersonaje` decide si ofrece el modal. Avisa cada vez
 * que entra (no solo la primera): si la sesión aún no había resuelto, el siguiente
 * paso por el final vuelve a intentarlo; el descarte evita que se repita.
 */
export function CentinelaGuardar({ slug }: { slug: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          window.dispatchEvent(new CustomEvent(EVENTO_FIN_FICHA, { detail: slug }));
        }
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [slug]);
  return <div ref={ref} aria-hidden="true" className="h-px" />;
}

interface GuardarPersonajeProps {
  slug: string;
  nombre: string;
  origen: string | null;
  imagenPortada: string | null;
  accentColor: string;
  /** Catálogo mínimo para la animación de guardado (grid de la colección). */
  personajes: Pick<PersonajeLite, "slug" | "nombre" | "imagenPortada">[];
}

/**
 * Guardado opcional del personaje en la colección (docs/PLAN-QR-UNICO.md):
 *  - Sello "ya es parte de tu colección" + certificado, si está guardado.
 *  - Modal "Guarda a {nombre}" al terminar la ficha — solo si llegó por QR, sin sesión.
 *  - Auto-guardado si hay sesión + llegada por QR (escaneo con sesión, o vuelta del
 *    login: el redirect es la ficha con `?origen=qr`).
 */
export function GuardarPersonaje({
  slug,
  nombre,
  origen,
  imagenPortada,
  accentColor,
  personajes,
}: GuardarPersonajeProps) {
  const t = useTranslations("guardar");
  const { authActiva, ready, session, coleccion, guardarPersonaje } = useColeccion();
  const enColeccion = useEnColeccion(slug);
  const { porQr, descartada, descartar } = useLlegadaPorQr(slug);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [celebrando, setCelebrando] = useState(false);
  const [exito, setExito] = useState(false);
  const [certificado, setCertificado] = useState<CertificadoLogro | null>(null);
  const autoGuardadoRef = useRef(false);

  const puedeGuardar = authActiva && porQr && !enColeccion;

  // Auto-guardado: sesión + llegada por QR vigente + aún no está en la colección.
  useEffect(() => {
    if (autoGuardadoRef.current || !ready || !session || !porQr || coleccion.has(slug)) return;
    if (!llegadaQrVigente(slug)) return;
    autoGuardadoRef.current = true;
    void guardarPersonaje(slug).then((status) => {
      if (status === "ok") {
        setModalAbierto(false);
        setCelebrando(true);
      }
    });
  }, [ready, session, porQr, coleccion, slug, guardarPersonaje]);

  // Al llegar al final de la ficha: ofrecer el modal (solo sin sesión; con sesión se auto-guarda).
  useEffect(() => {
    const onFin = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== slug) return;
      if (puedeGuardar && ready && !session && !descartada) setModalAbierto(true);
    };
    window.addEventListener(EVENTO_FIN_FICHA, onFin);
    return () => window.removeEventListener(EVENTO_FIN_FICHA, onFin);
  }, [slug, puedeGuardar, ready, session, descartada]);

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    descartar();
  }, [descartar]);

  const abrirCertificado = () =>
    setCertificado({
      tipo: "personaje",
      ...(origen ? { origen: origen as Origen } : {}),
      titulo: nombre,
      descripcion: t("certificado_descripcion", { nombre }),
      personajes: [{ nombre, imagenPortada }],
    });

  return (
    <>
      {/* ── Sello / acceso discreto, junto a compartir y el contador ── */}
      {enColeccion ? (
        <div
          className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: `${accentColor}40`, backgroundColor: `${accentColor}10` }}
        >
          <span className="font-medium text-texto-claro">
            <span className="mr-1.5" style={{ color: accentColor }} aria-hidden="true">
              ✦
            </span>
            {t("sello", { nombre })}
          </span>
          <span className="flex gap-3">
            <button
              type="button"
              onClick={abrirCertificado}
              className="underline underline-offset-2 transition-colors hover:text-acento-dorado"
              style={{ color: accentColor }}
            >
              {t("ver_certificado")}
            </button>
            <Link
              href="/mis-personajes"
              className="text-stone-400 underline underline-offset-2 transition-colors hover:text-acento-dorado"
            >
              {t("ver_coleccion")}
            </Link>
          </span>
        </div>
      ) : (
        puedeGuardar &&
        ready &&
        !session &&
        descartada && (
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="mt-4 text-sm underline underline-offset-2 transition-colors hover:text-acento-dorado"
            style={{ color: accentColor }}
          >
            {t("guardar_enlace", { nombre })}
          </button>
        )
      )}

      <AnimatePresence>
        {modalAbierto && (
          <InvitacionGuardarModal
            nombre={nombre}
            imagenPortada={imagenPortada}
            accentColor={accentColor}
            // Ruta real localizada (usePathname de next-intl devuelve la plantilla interna).
            redirectPath={conMarcaQr(window.location.pathname)}
            onClose={cerrarModal}
          />
        )}
      </AnimatePresence>

      {celebrando && (
        <DespertarAnimation
          personajes={personajes}
          unlockedSlugs={[...coleccion]}
          nombreNuevo={nombre}
          onDone={() => {
            setCelebrando(false);
            setExito(true);
          }}
        />
      )}

      <AnimatePresence>
        {exito && (
          <ExitoGuardado
            nombre={nombre}
            accentColor={accentColor}
            onCertificado={() => {
              setExito(false);
              abrirCertificado();
            }}
            onClose={() => setExito(false)}
          />
        )}
      </AnimatePresence>

      {certificado && <CertificadoColeccion logro={certificado} onClose={() => setCertificado(null)} />}
    </>
  );
}

// ── Modal de invitación ───────────────────────────────────────────────────────

function useModalA11y(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
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
  return ref;
}

function InvitacionGuardarModal({
  nombre,
  imagenPortada,
  accentColor,
  redirectPath,
  onClose,
}: {
  nombre: string;
  imagenPortada: string | null;
  accentColor: string;
  redirectPath: string;
  onClose: () => void;
}) {
  const t = useTranslations("guardar");
  const reduced = useReducedMotion();
  const ref = useModalA11y(onClose);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-fondo-oscuro/85 backdrop-blur-sm sm:items-center sm:px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guardar-titulo"
        tabIndex={-1}
        initial={{ y: reduced ? 0 : 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: reduced ? 0 : 40, opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.35, ease: "easeOut" }}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-borde-sutil bg-stone-950 px-6 pb-8 pt-6 shadow-2xl outline-none sm:max-w-md sm:rounded-3xl"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-stone-700 sm:hidden" aria-hidden="true" />

        <div className="flex items-center gap-4">
          {imagenPortada && (
            <div
              className="relative h-16 w-16 flex-none overflow-hidden rounded-full border-2"
              style={{ borderColor: accentColor }}
            >
              <Image src={imagenPortada} alt="" fill sizes="64px" className="object-cover object-top" />
            </div>
          )}
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: accentColor }}>
              {t("eyebrow")}
            </p>
            <h2 id="guardar-titulo" className="mt-1 font-serif text-2xl font-bold leading-tight text-texto-claro">
              {t("titulo", { nombre })}
            </h2>
          </div>
        </div>

        <ul className="mt-5 space-y-2.5 text-sm text-stone-300">
          {(["beneficio_coleccion", "beneficio_certificado", "beneficio_sello"] as const).map((k) => (
            <li key={k} className="flex gap-2.5">
              <span style={{ color: accentColor }} aria-hidden="true">
                ✦
              </span>
              {t(k, { nombre })}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <AuthOpciones redirectPath={redirectPath} idPrefix="guardar" />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 text-sm text-stone-500 transition-colors hover:text-stone-300"
        >
          {t("ahora_no")}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Tarjeta de éxito tras guardar ─────────────────────────────────────────────

function ExitoGuardado({
  nombre,
  accentColor,
  onCertificado,
  onClose,
}: {
  nombre: string;
  accentColor: string;
  onCertificado: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("guardar");
  const ref = useModalA11y(onClose);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-fondo-oscuro/85 px-5 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guardado-titulo"
        tabIndex={-1}
        className="w-full max-w-sm rounded-2xl border border-borde-sutil bg-stone-950 p-6 text-center shadow-2xl outline-none"
      >
        <h2 id="guardado-titulo" className="font-serif text-2xl font-bold text-texto-claro">
          {t("exito_titulo", { nombre })}
        </h2>
        <p className="mt-2 text-sm text-stone-400">{t("exito_texto")}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onCertificado}
            className="w-full rounded-full px-6 py-3 text-sm font-semibold text-fondo-oscuro transition-transform hover:scale-[1.01]"
            style={{ backgroundColor: accentColor }}
          >
            {t("ver_certificado")}
          </button>
          <Link
            href="/mis-personajes"
            className="w-full rounded-full border border-borde-sutil px-6 py-3 text-sm font-medium text-stone-300 transition-colors hover:border-acento-dorado hover:text-acento-dorado"
          >
            {t("ver_coleccion")}
          </Link>
          <button type="button" onClick={onClose} className="py-1 text-sm text-stone-500 hover:text-stone-300">
            {t("seguir_leyendo")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
