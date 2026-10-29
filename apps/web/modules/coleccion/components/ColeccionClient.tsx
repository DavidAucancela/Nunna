"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import { getOrigenStyle, type Origen } from "@/lib/origen-styles";
import { useColeccion } from "@/components/auth/ColeccionProvider";
import { ColeccionSerpentina } from "./ColeccionSerpentina";
import { CertificadoColeccion, type CertificadoLogro } from "./CertificadoColeccion";
import { useFechasColeccion } from "../useFechasColeccion";
import type { PersonajeLite } from "../types";

const ORIGEN_ORDER = ["prehispanico", "colonial", "mestizo", "mixto"] as const;

export function ColeccionClient({
  personajes,
  recorrido,
}: {
  personajes: PersonajeLite[];
  /** Recorrido en primera persona (server component): se muestra al completar la colección. */
  recorrido?: React.ReactNode;
}) {
  const t = useTranslations("coleccion");
  const tl = useTranslations("logros");
  const tg = useTranslations("guardar");
  const { ready, has } = useColeccion();
  const fechas = useFechasColeccion();
  const [certificado, setCertificado] = useState<CertificadoLogro | null>(null);

  const total = personajes.length;
  const guardados = new Set(personajes.filter((p) => has(p.slug)).map((p) => p.slug));
  const unlockedCount = guardados.size;

  // Logros derivados: completar cada origen presente + colección completa.
  const origenes = ORIGEN_ORDER.filter((o) => personajes.some((p) => p.origen === o)).map((o) => {
    const grupo = personajes.filter((p) => p.origen === o);
    const got = grupo.filter((p) => has(p.slug)).length;
    return { origen: o, total: grupo.length, got, earned: got === grupo.length };
  });
  const fullCollection = unlockedCount === total && total > 0;

  // Evita parpadeo: hasta resolver, no afirmamos "vacío".
  const empty = ready && unlockedCount === 0;

  function abrirCertificadoOrigen(slug: string) {
    const style = getOrigenStyle(slug);
    const grupo = personajes.filter((p) => p.origen === slug && has(p.slug));
    setCertificado({
      tipo: "origen",
      origen: slug as Origen,
      titulo: tl("origen_completo", { origen: style.label }),
      descripcion: tl("origen_completo_desc", { origen: style.label }),
      personajes: grupo.map((p) => ({ nombre: p.nombre, imagenPortada: p.imagenPortada })),
    });
  }

  function abrirCertificadoPersonaje(p: PersonajeLite) {
    setCertificado({
      tipo: "personaje",
      ...(p.origen ? { origen: p.origen as Origen } : {}),
      titulo: p.nombre,
      descripcion: tg("certificado_descripcion", { nombre: p.nombre }),
      personajes: [{ nombre: p.nombre, imagenPortada: p.imagenPortada }],
    });
  }

  function abrirCertificadoColeccion() {
    setCertificado({
      tipo: "coleccion",
      titulo: tl("coleccion_completa"),
      descripcion: tl("coleccion_completa_desc", { total }),
      personajes: personajes.map((p) => ({ nombre: p.nombre, imagenPortada: p.imagenPortada })),
    });
  }

  return (
    <>
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-14">
        <header className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-acento-dorado">{t("eyebrow")}</p>
          <h1 className="mt-1.5 font-serif text-4xl font-bold text-texto-claro sm:text-5xl">{t("titulo")}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-stone-400 sm:text-base">
            {empty ? t("vacio_texto") : fullCollection ? t("progreso_completo") : t("progreso", { n: unlockedCount, total })}
          </p>
        </header>

        {personajes.length > 0 && (
          <ColeccionSerpentina
            personajes={personajes}
            guardados={guardados}
            fechas={fechas}
            origenes={origenes}
            fullCollection={fullCollection}
            onCertificadoPersonaje={abrirCertificadoPersonaje}
            onCertificadoOrigen={abrirCertificadoOrigen}
            onCertificadoColeccion={abrirCertificadoColeccion}
          />
        )}

        <AnimatePresence>
          {certificado && <CertificadoColeccion logro={certificado} onClose={() => setCertificado(null)} />}
        </AnimatePresence>
      </section>

      {/* Premio de la colección completa: el pase en primera persona (la plaza de la serpentina lleva aquí). */}
      {fullCollection && (
        <div id="recorrido-premio" className="scroll-mt-20">
          {recorrido}
        </div>
      )}
    </>
  );
}
