"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { TipoOrigen, Narrativa } from "@seres-del-pase/types";
import { getOrigenStyle } from "@/lib/origen-styles";
import { FaseInvocacion } from "@/components/historia/fases/FaseInvocacion";
import { FaseNombre } from "@/components/historia/fases/FaseNombre";
import { FaseLeyenda } from "@/components/historia/fases/FaseLeyenda";
import { FaseTransicion } from "@/components/historia/FaseTransicion";
import { CapituloScroll } from "@/components/historia/CapituloScroll";
import { SecretoFinal } from "@/components/historia/SecretoFinal";

type Fase = "invocacion" | "nombre" | "leyenda" | "transicion" | "scroll";

interface HistoriaExperienciaProps {
  nombre: string;
  nombreKichwa?: string | undefined;
  nombresAlt?: string[];
  origen?: TipoOrigen | undefined;
  imagenPortada?: string | undefined;
  imagenBanner?: string | undefined;
  narrativa: Narrativa;
  slugPersonaje: string;
  locale: string;
  t: {
    saltar: string;
    capitulo: string;
    secreto_titulo: string;
    secreto_subtitulo: string;
    cta: string;
    volver: string;
    espiritu_despierta: string;
    scroll_hint: string;
    copiar_secreto: string;
    copiado: string;
    compartir_whatsapp: string;
    compartir_mensaje: string;
  };
}

export function HistoriaExperiencia({
  nombre,
  nombreKichwa,
  nombresAlt,
  origen,
  imagenPortada,
  imagenBanner,
  narrativa,
  slugPersonaje,
  locale,
  t,
}: HistoriaExperienciaProps) {
  const [fase, setFase] = useState<Fase>("invocacion");
  const [capituloActivo, setCapituloActivo] = useState(0);
  const [mounted, setMounted] = useState(false);
  const style = getOrigenStyle(origen);
  const totalCapitulos = narrativa.capitulos.length;

  useEffect(() => { setMounted(true); }, []);

  const avanzar = useCallback((siguiente: Fase) => { setFase(siguiente); }, []);
  const saltarAlScroll = useCallback(() => { setFase("scroll"); }, []);

  const handleCapituloInView = useCallback((numero: number) => {
    setCapituloActivo(numero - 1);
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0 z-40 bg-black" aria-hidden="true" />;
  }

  return (
    <>
      {/* ── Fases de apertura ── */}
      <AnimatePresence mode="wait">
        {fase === "invocacion" && (
          <FaseInvocacion
            key="invocacion"
            origen={origen}
            textoRitual={t.espiritu_despierta}
            onComplete={() => avanzar("nombre")}
          />
        )}
        {fase === "nombre" && (
          <FaseNombre
            key="nombre"
            nombre={nombre}
            nombreKichwa={nombreKichwa}
            nombresAlt={nombresAlt}
            origen={origen}
            onComplete={() => avanzar("leyenda")}
          />
        )}
        {fase === "leyenda" && (
          <FaseLeyenda
            key="leyenda"
            leyenda={narrativa.leyenda}
            palabrasClave={narrativa.palabrasClave}
            nombre={nombre}
            nombreKichwa={nombreKichwa}
            origen={origen}
            imagenPortada={imagenPortada}
            imagenBanner={imagenBanner}
            textoScrollHint={t.scroll_hint}
            onComplete={() => avanzar("transicion")}
          />
        )}
        {fase === "transicion" && (
          <FaseTransicion
            key="transicion"
            origen={origen}
            onComplete={() => avanzar("scroll")}
          />
        )}
      </AnimatePresence>

      {/* ── Botón skip — visible durante las fases ── */}
      <AnimatePresence>
        {fase !== "scroll" && fase !== "transicion" && (
          <motion.div
            className="fixed top-4 right-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1 } }}
            exit={{ opacity: 0, transition: { duration: 0.25, delay: 0 } }}
          >
            <button
              onClick={saltarAlScroll}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors"
              style={{
                borderColor: `${style.accentColor}55`,
                color: `${style.accentColor}cc`,
                backgroundColor: "rgba(5,4,3,0.5)",
              }}
              aria-label={t.saltar}
            >
              {t.saltar}
              <span className="text-[10px]" aria-hidden="true">✕</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Contenido scroll ── */}
      <AnimatePresence>
        {fase === "scroll" && (
          <motion.div
            key="scroll-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen"
            style={{ backgroundColor: "#050403" }}
          >
            {/* Header mínimo con dots de progreso */}
            <div
              className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 backdrop-blur-md"
              style={{ backgroundColor: "rgba(5,4,3,0.85)", borderBottom: `1px solid ${style.accentColor}22` }}
            >
              <Link
                href={`/${locale}/personajes`}
                className="text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: `${style.accentColor}bb` }}
              >
                ← {t.volver}
              </Link>

              <p className="font-serif font-bold text-sm tracking-wide text-texto-claro">
                {nombre}
              </p>

              {/* Dots de progreso — capítulo activo */}
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {Array.from({ length: totalCapitulos }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="rounded-full"
                    animate={{
                      width: capituloActivo === i ? 16 : 6,
                      backgroundColor: capituloActivo === i ? style.accentColor : `${style.accentColor}40`,
                    }}
                    transition={{ duration: 0.3 }}
                    style={{ height: 6 }}
                  />
                ))}
              </div>
            </div>

            {/* Capítulos */}
            {narrativa.capitulos.map((cap, i) => (
              <CapituloScroll
                key={i}
                numero={i + 1}
                titulo={cap.titulo}
                texto={cap.texto}
                origen={origen}
                onInView={handleCapituloInView}
              />
            ))}

            {/* Secreto + CTA */}
            <SecretoFinal
              secreto={narrativa.secreto}
              nombre={nombre}
              slugPersonaje={slugPersonaje}
              locale={locale}
              origen={origen}
              textoTitulo={t.secreto_titulo}
              textoSubtitulo={t.secreto_subtitulo}
              textoCta={t.cta}
              textoVolver={t.volver}
              textoCopiar={t.copiar_secreto}
              textoCopiado={t.copiado}
              textoWhatsApp={t.compartir_whatsapp}
              mensajeWhatsApp={t.compartir_mensaje}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
