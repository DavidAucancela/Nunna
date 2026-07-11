"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const READER_ID = "nunna-qr-reader";

/** Extrae la ruta interna (/[locale]/personajes/[slug]) de lo que decodifique el QR. */
function resolverDestino(texto: string): string | null {
  const limpio = texto.trim();
  try {
    const url = new URL(limpio);
    if (/\/(personajes|characters)\//.test(url.pathname)) {
      return url.pathname + url.search;
    }
    return null;
  } catch {
    // No es una URL con esquema (ej. QR generado a mano sin "https://",
    // como "nunna-ecu.com/es/personajes/aya-uma"): reintenta anteponiendo
    // "https://" antes de rendirse.
    if (!limpio.startsWith("/")) {
      try {
        const url = new URL(`https://${limpio}`);
        if (/\/(personajes|characters)\//.test(url.pathname)) {
          return url.pathname + url.search;
        }
      } catch {
        // sigue sin ser una URL válida
      }
      return null;
    }
    // ¿Es una ruta directa?
    if (/\/(personajes|characters)\//.test(limpio)) {
      return limpio;
    }
    return null;
  }
}

export function QrScanner({ open, onClose }: { open: boolean; onClose: () => void }) {
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  // Error duro de cámara (permiso/no hay cámara): bloquea y cubre el visor.
  const [cameraError, setCameraError] = useState<string | null>(null);
  // Aviso transitorio (QR no reconocido): franja no bloqueante, el escaneo sigue.
  const [hint, setHint] = useState<string | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setCameraError(null);
    setHint(null);

    // Si llegan varias lecturas inválidas seguidas, solo importa la última —
    // no acumulamos historial de intentos fallidos, cada llamada reinicia el timer.
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
            const destino = resolverDestino(decoded);
            if (destino) {
              // Detenemos antes de navegar para liberar la cámara.
              scanner.stop().catch(() => {});
              window.location.assign(destino);
            } else {
              // No cortamos el escaneo: seguimos leyendo por si aparece un QR válido.
              flashHint("Este QR no corresponde a un imán Nunna.");
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
            ? "Necesitamos permiso para usar la cámara. Habilítalo en tu navegador."
            : name === "NotFoundError"
              ? "No encontramos una cámara en este dispositivo."
              : "No pudimos abrir la cámara. Intenta de nuevo.",
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
  }, [open]);

  return (
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
          aria-label="Escanear código QR"
        >
          <motion.div
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-borde-sutil bg-fondo-oscuro p-5 shadow-2xl"
            initial={{ scale: 0.95, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-texto-claro">
                Apunta al QR del imán
              </h3>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="rounded-full p-1.5 text-stone-400 transition hover:bg-white/10 hover:text-texto-claro"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-950">
              <div id={READER_ID} className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />

              {/* Error duro de cámara — cubre el visor (no hay nada que escanear). */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-stone-950/90 px-6 text-center">
                  <p className="text-sm leading-relaxed text-stone-300">{cameraError}</p>
                </div>
              )}

              {/* Aviso transitorio — franja inferior, la cámara sigue visible y escaneando. */}
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

            <p className="mt-4 text-center text-xs leading-relaxed text-stone-500">
              Mantén el código dentro del recuadro. Te llevaremos a la ficha del ser.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
