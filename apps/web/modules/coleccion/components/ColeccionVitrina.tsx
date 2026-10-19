"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { getOrigenStyle } from "@/lib/origen-styles";
import type { PersonajeLite } from "../types";

export interface VitrinaOrigen {
  origen: string;
  total: number;
  got: number;
  earned: boolean;
}

interface Props {
  personajes: PersonajeLite[];
  guardados: Set<string>;
  origenes: VitrinaOrigen[];
  fullCollection: boolean;
  /** Primer personaje que se muestra (el primero guardado, si hay). */
  inicial: number;
  onCertificadoPersonaje: (p: PersonajeLite) => void;
  onCertificadoOrigen: (origen: string) => void;
  onCertificadoColeccion: () => void;
}

/**
 * Única presentación de /mis-personajes: una vitrina 3D con el personaje activo.
 * Reúne lo que antes eran bloques sueltos — progreso por origen, logros y
 * certificados — y es la puerta a la ficha: al pedirla, la tarjeta gira hacia
 * la cámara (misma perspectiva que el recorrido 3D) y recién entonces navega.
 */
export function ColeccionVitrina({
  personajes,
  guardados,
  origenes,
  fullCollection,
  inicial,
  onCertificadoPersonaje,
  onCertificadoOrigen,
  onCertificadoColeccion,
}: Props) {
  const t = useTranslations("coleccion");
  const tl = useTranslations("logros");
  const tc = useTranslations("comun");
  const router = useRouter();
  const reduced = useReducedMotion();

  const [idx, setIdx] = useState(inicial);
  const [dir, setDir] = useState(1);
  const [entrando, setEntrando] = useState(false);

  // Inclinación con el puntero (solo ratón; en táctil queda plana).
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotY = useSpring(useTransform(px, [-1, 1], [-9, 9]), { stiffness: 120, damping: 18 });
  const rotX = useSpring(useTransform(py, [-1, 1], [7, -7]), { stiffness: 120, damping: 18 });

  const p = personajes[idx];
  if (!p) return null;

  const slug = p.slug;
  const guardado = guardados.has(slug);
  const style = getOrigenStyle(p.origen ?? undefined);
  const origen = origenes.find((o) => o.origen === p.origen);

  function elegir(i: number) {
    if (i === idx || entrando) return;
    setDir(i > idx ? 1 : -1);
    setIdx(i);
  }

  function abrirFicha() {
    if (entrando) return;
    const ir = () => router.push({ pathname: "/personajes/[slug]", params: { slug } });
    if (reduced) return ir();
    setEntrando(true);
    window.setTimeout(ir, 650);
  }

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }
  function onLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <div>
      {/* Escenario 3D */}
      <div
        className="relative mx-auto aspect-[3/4] w-full max-w-xs sm:max-w-sm"
        style={{ perspective: 1400 }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
      >
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={p.slug}
            custom={dir}
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
            initial={
              reduced ? { opacity: 0 } : { opacity: 0, rotateY: dir * 38, z: -200, x: dir * 40 }
            }
            animate={
              entrando
                ? { opacity: 0, rotateY: -80, z: 420, scale: 1.25 }
                : { opacity: 1, rotateY: 0, z: 0, x: 0, scale: 1 }
            }
            exit={reduced ? { opacity: 0 } : { opacity: 0, rotateY: dir * -38, z: -200, x: dir * -40 }}
            transition={{ duration: entrando ? 0.65 : reduced ? 0.2 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ transformStyle: "preserve-3d", rotateX: reduced ? 0 : rotX, rotateY: reduced ? 0 : rotY }}
            >
              {/* Capa de profundidad desenfocada */}
              {p.imagenPortada && !reduced && (
                <div
                  aria-hidden
                  className="absolute inset-0 overflow-hidden rounded-2xl opacity-60 blur-xl"
                  style={{ transform: "translateZ(-90px) scale(1.15)" }}
                >
                  <Image src={p.imagenPortada} alt="" fill sizes="(min-width:640px) 384px, 320px" className="object-cover" />
                </div>
              )}

              {/* Tarjeta */}
              <div
                className={`absolute inset-0 overflow-hidden rounded-2xl border bg-fondo-oscuro shadow-2xl ${
                  guardado ? "" : "grayscale"
                }`}
                style={{
                  borderColor: guardado ? `${style.accentColor}88` : "var(--borde-sutil, #2A2724)",
                  boxShadow: guardado ? `0 24px 60px -24px ${style.accentColor}66` : undefined,
                  transform: "translateZ(0)",
                }}
              >
                {p.imagenPortada && (
                  <Image
                    src={p.imagenPortada}
                    alt={p.nombre}
                    fill
                    priority
                    sizes="(min-width:640px) 384px, 320px"
                    className={`object-cover object-top ${guardado ? "" : "opacity-50"}`}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-fondo-oscuro via-fondo-oscuro/20 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-5" style={{ transform: "translateZ(40px)" }}>
                  <p className="text-[11px] uppercase tracking-[0.25em]" style={{ color: style.accentColor }}>
                    {p.origen ? tc(`origen.${p.origen}`) : ""}
                  </p>
                  <h2 className="mt-1 font-serif text-3xl font-bold text-texto-claro">{p.nombre}</h2>
                  {p.nombreKichwa && <p className="text-sm italic text-stone-400">{p.nombreKichwa}</p>}
                </div>

                {!guardado && (
                  <span className="absolute right-3 top-3 rounded-full border border-borde-sutil bg-fondo-oscuro/80 px-3 py-1 text-[11px] text-stone-400">
                    {t("sin_guardar")}
                  </span>
                )}
                {guardado && (
                  <span
                    className="absolute right-3 top-3 rounded-full border px-3 py-1 text-[11px] font-medium"
                    style={{ borderColor: `${style.accentColor}88`, color: style.accentColor, background: "#0F0E0Ccc" }}
                  >
                    ✓ {t("en_coleccion")}
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Ficha de lo que representa: leyenda, progreso del origen, logros, certificados */}
      <div className="mx-auto mt-8 max-w-sm text-center">
        {p.leyenda && <p className="font-serif text-lg italic text-stone-300">“{p.leyenda}”</p>}

        {origen && (
          <div className="mt-5 text-left">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span style={{ color: origen.earned ? style.accentColor : undefined }} className="font-semibold">
                {origen.earned ? tl("origen_completo", { origen: tc(`origen.${origen.origen}`) }) : tc(`origen.${origen.origen}`)}
              </span>
              <span className="text-stone-500">{origen.earned ? "✓" : `${origen.got}/${origen.total}`}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-stone-800">
              <motion.div
                key={origen.origen}
                className="h-full rounded-full"
                style={{ backgroundColor: style.accentColor }}
                initial={{ width: 0 }}
                animate={{ width: `${origen.total > 0 ? (origen.got / origen.total) * 100 : 0}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={abrirFicha}
          disabled={entrando}
          className="mt-6 inline-block rounded-full bg-acento-dorado px-7 py-3 text-sm font-semibold text-fondo-oscuro transition-transform hover:scale-[1.02] disabled:opacity-70"
        >
          {t("ver_personaje")}
        </button>

        {(guardado || (origen?.earned ?? false) || fullCollection) && (
          <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium">
            {guardado && (
              <button type="button" onClick={() => onCertificadoPersonaje(p)} className="text-stone-300 underline underline-offset-2 hover:text-acento-dorado">
                ✦ {t("ver_certificado")}
              </button>
            )}
            {origen?.earned && (
              <button
                type="button"
                onClick={() => onCertificadoOrigen(origen.origen)}
                className="underline underline-offset-2"
                style={{ color: style.accentColor }}
              >
                {tl("origen_completo", { origen: tc(`origen.${origen.origen}`) })}
              </button>
            )}
            {fullCollection && (
              <button type="button" onClick={onCertificadoColeccion} className="text-acento-dorado underline underline-offset-2">
                {tl("coleccion_completa")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Selector: todos los personajes, los no guardados en penumbra */}
      <ul className="mx-auto mt-10 flex max-w-md flex-wrap justify-center gap-3">
        {personajes.map((q, i) => {
          const tiene = guardados.has(q.slug);
          const activo = i === idx;
          return (
            <li key={q.slug}>
              <button
                type="button"
                onClick={() => elegir(i)}
                aria-label={tiene ? t("tarjeta_guardado", { nombre: q.nombre }) : t("tarjeta_falta", { nombre: q.nombre })}
                aria-current={activo}
                className={`relative h-16 w-12 overflow-hidden rounded-lg border-2 transition-all ${
                  activo ? "scale-110 border-acento-dorado" : "border-borde-sutil hover:border-stone-500"
                }`}
              >
                {q.imagenPortada && (
                  <Image
                    src={q.imagenPortada}
                    alt=""
                    fill
                    sizes="48px"
                    className={`object-cover object-top ${tiene ? "" : "opacity-40 grayscale"}`}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
