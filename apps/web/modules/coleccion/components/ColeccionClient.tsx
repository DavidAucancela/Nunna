"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import type { Origen } from "@/lib/origen-styles";
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
  const tc = useTranslations("comun");
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

  // Datos de cada personaje para los certificados: el imán recortado, el color de su placa y su nombre impreso.
  const paraCertificado = (p: PersonajeLite) => ({
    nombre: p.tarjeta?.nombre ?? p.nombre,
    imagenPortada: p.imagenPortada,
    imagenIman: p.imagenIman ?? null,
    color: p.tarjeta?.color ?? null,
  });
  // La fecha de un logro es la del último personaje que lo completó.
  const ultimaFecha = (lista: PersonajeLite[]) => {
    const ts = lista.map((p) => fechas.get(p.slug)?.getTime()).filter((x): x is number => x !== undefined);
    return ts.length === lista.length && ts.length > 0 ? new Date(Math.max(...ts)) : null;
  };

  function abrirCertificadoOrigen(slug: string) {
    const grupo = personajes.filter((p) => p.origen === slug && has(p.slug));
    setCertificado({
      tipo: "origen",
      origen: slug as Origen,
      titulo: tl("origen_completo", { origen: tc(`origen.${slug}` as "origen.prehispanico") }),
      descripcion: tl("origen_completo_desc", { origen: tc(`origen.${slug}` as "origen.prehispanico").toLowerCase() }),
      personajes: grupo.map(paraCertificado),
      fecha: ultimaFecha(grupo),
    });
  }

  function abrirCertificadoPersonaje(p: PersonajeLite) {
    setCertificado({
      tipo: "personaje",
      ...(p.origen ? { origen: p.origen as Origen } : {}),
      titulo: p.tarjeta?.nombre ?? p.nombre,
      descripcion: tg("certificado_descripcion", { nombre: p.nombre }),
      personajes: [paraCertificado(p)],
      fecha: fechas.get(p.slug) ?? null,
      numero: p.tarjeta?.orden ? t("cert_numero", { n: p.tarjeta.orden, total }) : null,
      leyenda: p.leyenda ?? null,
    });
  }

  function abrirCertificadoColeccion() {
    setCertificado({
      tipo: "coleccion",
      titulo: tl("coleccion_completa"),
      descripcion: tl("coleccion_completa_desc", { total }),
      personajes: [...personajes].sort((a, b) => (a.tarjeta?.orden ?? 99) - (b.tarjeta?.orden ?? 99)).map(paraCertificado),
      fecha: ultimaFecha(personajes),
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
