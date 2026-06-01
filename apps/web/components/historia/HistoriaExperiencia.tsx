"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { TipoOrigen, Narrativa } from "@seres-del-pase/types";
import { getOrigenStyle } from "@/lib/origen-styles";
import { FaseInvocacion } from "@/components/historia/fases/FaseInvocacion";
import { FaseNombre } from "@/components/historia/fases/FaseNombre";
import { FaseLeyenda } from "@/components/historia/fases/FaseLeyenda";
import { CapituloScroll } from "@/components/historia/CapituloScroll";
import { SecretoFinal } from "@/components/historia/SecretoFinal";

type Fase = "invocacion" | "nombre" | "leyenda" | "scroll";

interface HistoriaExperienciaProps {
  nombre: string;
  nombreKichwa?: string | undefined;
  origen?: TipoOrigen | undefined;
  imagenPortada?: string | undefined;
  imagenBanner?: string | undefined;
  narrativa: Narrativa;
  slugPersonaje: string;
  locale: string;
  // traducciones
  t: {
    saltar: string;
    capitulo: string;
    secreto_titulo: string;
    secreto_subtitulo: string;
    cta: string;
    volver: string;
  };
}

export function HistoriaExperiencia({
  nombre,
  nombreKichwa,
  origen,
  imagenPortada,
  imagenBanner,
  narrativa,
  slugPersonaje,
  locale,
  t,
}: HistoriaExperienciaProps) {
  const [fase, setFase] = useState<Fase>("invocacion");
  const [mounted, setMounted] = useState(false);
  const style = getOrigenStyle(origen);

  useEffect(() => { setMounted(true); }, []);

  const avanzar = useCallback((siguiente: Fase) => {
    setFase(siguiente);
  }, []);

  const saltarAlScrollo = useCallback(() => {
    setFase("scroll");
  }, []);

  if (!mounted) {
    // SSR: mostrar negro para evitar flash
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
            onComplete={() => avanzar("nombre")}
          />
        )}
        {fase === "nombre" && (
          <FaseNombre
            key="nombre"
            nombre={nombre}
            nombreKichwa={nombreKichwa}
            origen={origen}
            onComplete={() => avanzar("leyenda")}
          />
        )}
        {fase === "leyenda" && (
          <FaseLeyenda
            key="leyenda"
            leyenda={narrativa.leyenda}
            nombre={nombre}
            nombreKichwa={nombreKichwa}
            origen={origen}
            imagenPortada={imagenPortada}
            imagenBanner={imagenBanner}
            onComplete={() => avanzar("scroll")}
          />
        )}
      </AnimatePresence>

      {/* ── Botón skip — visible durante las 3 fases ── */}
      <AnimatePresence>
        {fase !== "scroll" && (
          <motion.div
            className="fixed top-4 right-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1 } }}
            exit={{ opacity: 0, transition: { duration: 0.25, delay: 0 } }}
          >
            <button
              onClick={saltarAlScrollo}
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
            {/* Header mínimo */}
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
              <p
                className="font-serif font-bold text-sm tracking-wide text-texto-claro"
              >
                {nombre}
              </p>
              <div className="w-16" aria-hidden="true" />
            </div>

            {/* Capítulos */}
            {narrativa.capitulos.map((cap, i) => (
              <CapituloScroll
                key={i}
                numero={i + 1}
                titulo={cap.titulo}
                texto={cap.texto}
                origen={origen}
              />
            ))}

            {/* Secreto + CTA */}
            <SecretoFinal
              secreto={narrativa.secreto}
              nombre={nombre}
              slugPersonaje={slugPersonaje}
              locale={locale}
              textoTitulo={t.secreto_titulo}
              textoSubtitulo={t.secreto_subtitulo}
              textoCta={t.cta}
              textoVolver={t.volver}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
