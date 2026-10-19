"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useRouter } from "@/i18n/navigation";
import { getOrigenStyle, type Origen } from "@/lib/origen-styles";
import { useColeccion } from "@/components/auth/ColeccionProvider";
import { ColeccionVitrina } from "./ColeccionVitrina";
import { CertificadoColeccion, type CertificadoLogro } from "./CertificadoColeccion";
import type { PersonajeLite } from "../types";

const ORIGEN_ORDER = ["prehispanico", "colonial", "mestizo", "mixto"] as const;

export function ColeccionClient({ personajes }: { personajes: PersonajeLite[] }) {
  const t = useTranslations("coleccion");
  const tl = useTranslations("logros");
    const tg = useTranslations("guardar");
  const { ready, coleccion, has, session, signOut } = useColeccion();
  const router = useRouter();
  const [certificado, setCertificado] = useState<CertificadoLogro | null>(null);

  const total = personajes.length;
  const guardados = new Set(personajes.filter((p) => has(p.slug)).map((p) => p.slug));
  const unlockedCount = personajes.filter((p) => has(p.slug)).length;

  // Logros derivados: completar cada origen presente + colección completa.
  const origenes = ORIGEN_ORDER.filter((o) => personajes.some((p) => p.origen === o)).map((o) => {
    const grupo = personajes.filter((p) => p.origen === o);
    const got = grupo.filter((p) => has(p.slug)).length;
    return { origen: o, total: grupo.length, got, earned: got === grupo.length };
  });
  const fullCollection = unlockedCount === total && total > 0;

  const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

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
    <section className="mx-auto max-w-5xl px-5 py-20 sm:px-6 sm:py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold text-texto-claro sm:text-5xl">{t("titulo")}</h1>
          <p className="mt-2 text-stone-400">{t("subtitulo")}</p>
        </div>
        {session?.user?.email && (
          <div className="text-right">
            <p className="text-xs text-stone-600">{t("sesion_iniciada", { email: session.user.email })}</p>
            <button
              onClick={async () => {
                await signOut();
                router.replace("/");
              }}
              className="mt-1 text-xs font-medium text-stone-400 underline-offset-2 hover:text-texto-claro hover:underline"
            >
              {t("cerrar_sesion")}
            </button>
          </div>
        )}
      </div>

      {/* Progreso global */}
      <div className="mb-12">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-sm text-stone-300">
            {fullCollection ? t("progreso_completo") : t("progreso", { n: unlockedCount, total })}
          </p>
          <span
            className={`font-serif text-2xl font-bold ${fullCollection ? "" : "text-acento-dorado"}`}
            style={fullCollection ? { color: "#F0D98A" } : undefined}
          >
            {pct}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-800">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: fullCollection
                ? "linear-gradient(90deg,#C89B3C,#F0D98A,#C89B3C)"
                : "#C89B3C",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Estado vacío */}
      {empty && (
        <div className="mb-12 rounded-2xl border border-borde-sutil bg-stone-900/40 px-6 py-10 text-center">
          <h2 className="font-serif text-2xl font-bold text-texto-claro">{t("vacio_titulo")}</h2>
          <p className="mx-auto mt-2 max-w-sm text-stone-400">{t("vacio_texto")}</p>
          <Link
            href="/personajes"
            className="mt-6 inline-block rounded-full bg-acento-dorado px-6 py-3 text-sm font-semibold text-fondo-oscuro transition-transform hover:scale-[1.02]"
          >
            {t("explorar_cta")}
          </Link>
        </div>
      )}

      {/* Única presentación: vitrina 3D (progreso por origen, logros y certificados dentro) */}
      {personajes.length > 0 && (
        <ColeccionVitrina
          key={ready ? "listo" : "cargando"}
          personajes={personajes}
          guardados={guardados}
          origenes={origenes}
          fullCollection={fullCollection}
          inicial={Math.max(0, personajes.findIndex((p) => guardados.has(p.slug)))}
          onCertificadoPersonaje={abrirCertificadoPersonaje}
          onCertificadoOrigen={abrirCertificadoOrigen}
          onCertificadoColeccion={abrirCertificadoColeccion}
        />
      )}

      <AnimatePresence>
        {certificado && (
          <CertificadoColeccion logro={certificado} onClose={() => setCertificado(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}
