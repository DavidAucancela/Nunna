"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";

const READER_ID = "nunna-qr-reader";

const RUTA_PERSONAJE = /\/(?:personajes|characters)\/([a-z0-9-]+)\/?$/;

export interface QrPersonaje {
  slug: string;
  /** Ruta interna de la ficha (sin query), p. ej. `/es/personajes/aya-uma`. */
  pathname: string;
}

/**
 * Lee lo que decodifica la cámara y devuelve el personaje de la tarjeta, o null si no
 * es un QR de Nunna. Acepta URL completa, sin esquema ("nunna-ecu.com/es/…") o ruta.
 */
export function leerQrPersonaje(texto: string): QrPersonaje | null {
  const limpio = texto.trim();
  const candidatos = limpio.startsWith("/")
    ? [`https://nunna-ecu.com${limpio}`]
    : [limpio, `https://${limpio}`];
  for (const candidato of candidatos) {
    try {
      const url = new URL(candidato);
      const m = url.pathname.match(RUTA_PERSONAJE);
      if (m?.[1]) return { slug: m[1], pathname: url.pathname.replace(/\/$/, "") };
    } catch {
      // no es una URL válida con este candidato, se prueba el siguiente
    }
  }
  return null;
}

/**
 * Lector del QR de la tarjeta con la cámara trasera (html5-qrcode, carga diferida).
 * Un QR que no es de Nunna muestra un aviso sin cortar el escaneo.
 */
export function EscanerQr({
  open,
  onClose,
  onDetectado,
}: {
  open: boolean;
  onClose: () => void;
  onDetectado: (qr: QrPersonaje) => void;
}) {
  const t = useTranslations("escaner");
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // El callback cambia en cada render del padre; el efecto de la cámara no debe reiniciarse.
  const onDetectadoRef = useRef(onDetectado);
  onDetectadoRef.current = onDetectado;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let detectado = false;
    setCameraError(null);
    setHint(null);

    const flashHint = (msg: string) => {
      setHint(msg);
      if (hintTimer.current) clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setHint(null), 2800);
    };

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode(READER_ID, { verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (detectado) return;
            const qr = leerQrPersonaje(decoded);
            if (qr) {
              detectado = true;
              onDetectadoRef.current(qr);
            } else {
              flashHint(t("no_reconocido"));
            }
          },
          () => {
            /* fallo por frame — silencioso */
          },
        );
      } catch (err) {
        if (cancelled) return;
        const name = (err as { name?: string })?.name;
        setCameraError(
          name === "NotAllowedError"
            ? t("error_permiso")
            : name === "NotFoundError"
              ? t("error_sin_camara")
              : t("error_generico"),
        );
      }
    })();

    return () => {
      cancelled = true;
      if (hintTimer.current) clearTimeout(hintTimer.current);
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
      }
    };
  }, [open, t]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="escaner-titulo"
          data-lenis-prevent
        >
          <motion.div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-borde-sutil bg-fondo-oscuro p-5 shadow-2xl"
            initial={{ scale: 0.95, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 id="escaner-titulo" className="font-serif text-lg font-bold text-texto-claro">
                {t("titulo")}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("cerrar")}
                className="rounded-full p-2 text-stone-400 transition hover:bg-white/10 hover:text-texto-claro"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-950">
              <div id={READER_ID} className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />

              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-stone-950/90 px-6 text-center">
                  <p className="text-sm leading-relaxed text-stone-300">{cameraError}</p>
                </div>
              )}

              <AnimatePresence>
                {!cameraError && hint && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute inset-x-3 bottom-3 rounded-xl bg-stone-950/85 px-4 py-2.5 text-center backdrop-blur-sm"
                  >
                    <p className="text-xs leading-relaxed text-stone-200">{hint}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-stone-500">{t("ayuda")}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
