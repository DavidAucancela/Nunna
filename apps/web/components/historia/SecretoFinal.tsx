"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import type { TipoOrigen } from "@seres-del-pase/types";
import { getOrigenStyle } from "@/lib/origen-styles";

interface SecretoFinalProps {
  secreto: string;
  nombre: string;
  slugPersonaje: string;
  locale: string;
  origen?: TipoOrigen | undefined;
  textoTitulo: string;
  textoSubtitulo: string;
  textoCta: string;
  textoVolver: string;
  textoCopiar: string;
  textoCopiado: string;
  textoWhatsApp: string;
  mensajeWhatsApp: string;
}

function SelloSvg({ color, patternId }: { color: string; patternId: string }) {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
      <circle cx="26" cy="26" r="24" stroke="#0F0E0C" strokeOpacity="0.6" strokeWidth="2" fill="#0F0E0C" fillOpacity="0.5" />
      <circle cx="26" cy="26" r="20" stroke="#0F0E0C" strokeOpacity="0.4" strokeWidth="1" fill="none" />
      {patternId === "chakana" && (
        <path
          d="M18,14 L26,14 L26,18 L34,18 L34,26 L26,26 L26,34 L18,34 L18,26 L14,26 L14,18 L18,18 Z"
          stroke="#0F0E0C" strokeWidth="1.5" fill="none" strokeOpacity="0.7"
        />
      )}
      {patternId === "espiral" && (
        <>
          <circle cx="26" cy="26" r="8" stroke="#0F0E0C" strokeOpacity="0.7" strokeWidth="1.5" fill="none" />
          <circle cx="26" cy="26" r="4" stroke="#0F0E0C" strokeOpacity="0.7" strokeWidth="1.5" fill="none" />
          <circle cx="26" cy="26" r="1.5" fill="#0F0E0C" fillOpacity="0.7" />
        </>
      )}
      {patternId === "rombo" && (
        <polygon points="26,16 36,26 26,36 16,26" stroke="#0F0E0C" strokeOpacity="0.7" strokeWidth="1.5" fill="none" />
      )}
      {/* Por defecto — rombo */}
      {!["chakana","espiral","rombo"].includes(patternId) && (
        <polygon points="26,16 36,26 26,36 16,26" stroke="#0F0E0C" strokeOpacity="0.7" strokeWidth="1.5" fill="none" />
      )}
    </svg>
  );
}

export function SecretoFinal({
  secreto,
  nombre,
  slugPersonaje,
  locale,
  origen,
  textoTitulo,
  textoSubtitulo,
  textoCta,
  textoVolver,
  textoCopiar,
  textoCopiado,
  textoWhatsApp,
  mensajeWhatsApp,
}: SecretoFinalProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [displayedWords, setDisplayedWords] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const words = secreto.split(" ");
  const terminado = displayedWords >= words.length;
  const style = getOrigenStyle(origen);

  // Typewriter del secreto — se inicia cuando entra en view
  useEffect(() => {
    if (!inView) return;
    navigator.vibrate?.([300, 100, 300]);
    const interval = setInterval(() => {
      setDisplayedWords((prev) => {
        if (prev >= words.length) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 100);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const hrefPersonaje = `/${locale}/personajes/${slugPersonaje}`;
  const mensajeWA = mensajeWhatsApp
    .replace("{nombre}", nombre)
    .replace("{secreto}", secreto);
  const hrefWA = `https://wa.me/?text=${encodeURIComponent(mensajeWA)}`;

  async function copiarSecreto() {
    try {
      await navigator.clipboard.writeText(secreto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard no disponible — silencioso
    }
  }

  return (
    <section
      ref={ref}
      className="relative min-h-svh flex flex-col justify-center px-6 py-20 sm:px-10 sm:py-28"
      style={{ backgroundColor: "#C89B3C" }}
    >
      {/* Grain */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <filter id="grain-secreto">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-secreto)" opacity="0.08" />
      </svg>

      {/* Patrón rombo de fondo */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.08 }}
        aria-hidden="true"
      >
        <defs>
          <pattern id="rombo-secreto" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke="#0F0E0C" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#rombo-secreto)" />
      </svg>

      <div className="relative z-10 max-w-lg">
        {/* Sello de cera */}
        <motion.div
          initial={{ opacity: 0, scale: 0, rotate: -15 }}
          animate={inView ? { opacity: 1, scale: [0, 1.1, 1], rotate: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
          className="mb-8"
        >
          <SelloSvg color={style.accentColor} patternId={style.patternId} />
        </motion.div>

        {/* Titular */}
        <motion.h2
          className="font-serif font-bold text-fondo-oscuro leading-tight mb-2"
          style={{ fontSize: "clamp(1.8rem, 6.5vw, 3.2rem)" }}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.215, 0.61, 0.355, 1] }}
        >
          {textoTitulo}
        </motion.h2>

        <motion.p
          className="text-sm text-fondo-oscuro/70 mb-8 uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          {textoSubtitulo}
        </motion.p>

        {/* El secreto — typewriter */}
        <motion.div
          className="font-serif text-fondo-oscuro leading-relaxed border-l-4 border-fondo-oscuro/30 pl-5"
          style={{ fontSize: "clamp(1.05rem, 3.8vw, 1.35rem)", minHeight: "3em" }}
          initial={{ opacity: 0, x: -16 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
        >
          <span aria-live="polite">
            {words.slice(0, displayedWords).join(" ")}
          </span>
          {!terminado && inView && (
            <motion.span
              className="inline-block w-[2px] h-[1em] ml-1 align-middle rounded-sm bg-fondo-oscuro"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              aria-hidden="true"
            />
          )}
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="mt-12 flex flex-col gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          {/* CTA principal → ficha */}
          <Link
            href={hrefPersonaje}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-fondo-oscuro px-7 py-3.5 text-sm font-semibold text-acento-dorado transition-all hover:bg-fondo-oscuro/90 active:scale-95"
          >
            {textoCta.replace("{nombre}", nombre)}
            <span aria-hidden="true">→</span>
          </Link>

          {/* WhatsApp */}
          <a
            href={hrefWA}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-all active:scale-95"
            style={{ backgroundColor: "#25D366", color: "#fff" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.113.548 4.1 1.507 5.83L0 24l6.338-1.48A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.37l-.359-.213-3.762.879.92-3.667-.233-.376A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
            </svg>
            {textoWhatsApp}
          </a>

          {/* Fila inferior: volver + copiar */}
          <div className="flex gap-2">
            <Link
              href={`/${locale}/personajes`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border-2 border-fondo-oscuro/40 px-5 py-3 text-sm font-medium text-fondo-oscuro/70 transition-all hover:border-fondo-oscuro/60 hover:text-fondo-oscuro active:scale-95"
            >
              {textoVolver}
            </Link>
            <button
              onClick={copiarSecreto}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-fondo-oscuro/40 px-4 py-3 text-xs font-medium text-fondo-oscuro/70 transition-all hover:border-fondo-oscuro/60 hover:text-fondo-oscuro active:scale-95"
              aria-label={textoCopiar}
            >
              {copiado ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {textoCopiado}
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  {textoCopiar}
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Firma de cierre */}
        <motion.div
          className="mt-14 flex flex-col items-start gap-3"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <div className="h-px w-full" style={{ backgroundColor: "#0F0E0C", opacity: 0.2 }} aria-hidden="true" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-fondo-oscuro/50 italic">
            Nunna — Personajes de los pases riobambeños
          </p>
        </motion.div>
      </div>
    </section>
  );
}
