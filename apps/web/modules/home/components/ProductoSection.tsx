"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, useSpring } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  CirculoColeccion,
  ordenTarjeta,
  TarjetaFrente,
  TarjetaReverso,
  type TarjetaPersonaje,
} from "@/modules/personajes/components/TarjetaNunna";

/** Personaje cuya tarjeta protagoniza los pasos (el mismo de la ficha del paso 02). */
const DESTACADO = "diablos-de-lata";

interface VisualProps {
  tarjetas: TarjetaPersonaje[];
}

const ANDEAN_PATTERN = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'>` +
  `<path d='M24 0L48 24L24 48L0 24Z' fill='none' stroke='rgba(200,155,60,0.08)' stroke-width='0.8'/>` +
  `<path d='M24 11L37 24L24 37L11 24Z' fill='none' stroke='rgba(200,155,60,0.05)' stroke-width='0.5'/>` +
  `</svg>`
);

/* — Marco de teléfono reutilizable — */
function PhoneMock({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[260px] max-md:[zoom:0.6]">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-acento-dorado/8 blur-2xl" />
      <div className="relative rounded-[2.4rem] border border-stone-700/80 bg-stone-900 p-2.5 shadow-2xl shadow-black/50">
        {/* Notch */}
        <div className="absolute left-1/2 top-3 z-20 h-1.5 w-16 -translate-x-1/2 rounded-full bg-stone-700" />
        <div className="relative aspect-[9/16] overflow-hidden rounded-[1.8rem] bg-stone-950">
          {children}
        </div>
      </div>
    </div>
  );
}

/* — Paso 01: la tarjeta del imán en 3D — se inclina con el cursor y gira al tocarla;
   en táctil se mece sola, sutil (no hay hover que la mueva) — */
function QrVisual({ tarjetas }: VisualProps) {
  const reduce = useReducedMotion();
  const t = useTranslations("home.producto");
  const [girada, setGirada] = useState(false);
  const [conMouse, setConMouse] = useState(false);
  const rx = useSpring(0, { stiffness: 150, damping: 18 });
  const ry = useSpring(0, { stiffness: 150, damping: 18 });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setConMouse(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const p = tarjetas.find((x) => x.slug === DESTACADO) ?? tarjetas[0];
  if (!p) return null;

  const mecer = !conMouse && !reduce;

  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-acento-dorado/10 blur-3xl" />
      <div className="relative mx-auto w-[56%] [perspective:1100px]">
        <button
          type="button"
          aria-label={t("visual_girar")}
          aria-pressed={girada}
          onClick={() => setGirada((g) => !g)}
          onPointerMove={(e) => {
            if (e.pointerType !== "mouse" || reduce) return;
            const r = e.currentTarget.getBoundingClientRect();
            ry.set(((e.clientX - r.left) / r.width - 0.5) * 24);
            rx.set(-((e.clientY - r.top) / r.height - 0.5) * 20);
          }}
          onPointerLeave={() => {
            rx.set(0);
            ry.set(0);
          }}
          className="block w-full cursor-pointer rounded-[3%] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-acento-dorado"
        >
          <motion.div
            className="[transform-style:preserve-3d]"
            {...(mecer
              ? {
                  animate: { rotateX: [3, -3, 3], rotateY: [-9, 9, -9] },
                  transition: { duration: 7, repeat: Infinity, ease: "easeInOut" },
                }
              : { style: { rotateX: rx, rotateY: ry } })}
          >
            <motion.div
              className="relative aspect-[52/90] [transform-style:preserve-3d]"
              animate={{ rotateY: girada ? 180 : 0 }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 70, damping: 14 }}
            >
              <div className="absolute inset-0 [backface-visibility:hidden]">
                <TarjetaFrente personaje={p} sizes="(max-width: 768px) 160px, 220px" />
              </div>
              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <TarjetaReverso
                  actual={p.slug}
                  personajes={tarjetas}
                  qr={
                    !reduce && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-x-[4%] h-[2px] rounded-full bg-acento-dorado shadow-[0_0_10px_2px_rgba(200,155,60,0.7)]"
                        initial={{ top: "6%" }}
                        animate={{ top: ["6%", "94%", "6%"] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )
                  }
                />
              </div>
            </motion.div>
          </motion.div>
        </button>
      </div>
      <p className="mt-4 text-center text-[10px] uppercase leading-relaxed tracking-[0.25em] text-stone-500">
        {t("visual_girar")}
      </p>
    </div>
  );
}

/* — Paso 03: la colección de la tarjeta, ahora en tu cuenta — los círculos se iluminan — */
function GuardarVisual({ tarjetas }: VisualProps) {
  const t = useTranslations("home.producto");
  // Muestra: la mitad de la colección guardada, empezando por el personaje destacado.
  const orden = ordenTarjeta(tarjetas);
  const guardados = new Set([DESTACADO, ...orden.map((p) => p.slug).filter((s) => s !== DESTACADO)].slice(0, 3));
  return (
    <PhoneMock>
      <div
        className="flex h-full flex-col items-center justify-center gap-5 bg-gradient-to-b from-stone-900 to-stone-950 p-6"
        style={{ containerType: "inline-size" }}
      >
        <p className="text-[10px] uppercase tracking-[0.25em] text-stone-500">{t("visual_fin_ficha")}</p>
        <div className="grid w-full grid-cols-3 gap-x-4 gap-y-4">
          {orden.map((p) => (
            <CirculoColeccion
              key={p.slug}
              personaje={p}
              activo={guardados.has(p.slug)}
              etiquetaClassName="text-[length:5cqw]"
            />
          ))}
        </div>
        <p className="text-center text-xs leading-relaxed text-stone-500">
          {t("visual_guardalo")}
        </p>
      </div>
    </PhoneMock>
  );
}

/* — Paso 02: la ficha del ser — */
function FichaVisual(_props: VisualProps) {
  const t = useTranslations("home.producto");
  return (
    <PhoneMock>
      <Image
        src="/personajes/diablos-de-lata/diablos-de-lata-hero-figura-mascara-roja.webp"
        alt={t("visual_ficha_alt")}
        fill
        className="object-cover object-top"
        sizes="(max-width: 768px) 80vw, 260px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/55 to-transparent" />
      <div className="absolute inset-x-5 bottom-6 space-y-3">
        <span className="inline-block rounded-full bg-acento-rojo/90 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
          {t("visual_ficha_origen")}
        </span>
        <div className="h-5 w-32 rounded bg-stone-100/90" />
        <div className="space-y-2.5 pt-1">
          <div className="h-2.5 w-full rounded-full bg-stone-400/70" />
          <div className="h-2.5 w-11/12 rounded-full bg-stone-500/70" />
          <div className="h-2.5 w-5/6 rounded-full bg-stone-600/70" />
          <div className="h-2.5 w-2/3 rounded-full bg-stone-700/70" />
        </div>
      </div>
    </PhoneMock>
  );
}

// Los tres pasos repiten el lema impreso en el reverso de la tarjeta del imán:
// "Escanea, descubre y colecciona" — la web y la tarjeta dicen lo mismo.
const PASOS = [
  { num: "01", titulo: "paso_escanea_titulo", texto: "paso_escanea_texto", Visual: QrVisual },
  { num: "02", titulo: "paso_descubre_titulo", texto: "paso_descubre_texto", Visual: FichaVisual },
  { num: "03", titulo: "paso_colecciona_titulo", texto: "paso_colecciona_texto", Visual: GuardarVisual },
] as const;

export function ProductoSection({ tarjetas }: VisualProps) {
  return (
    <section
      className="border-y border-borde-sutil bg-fondo-oscuro"
      style={{
        backgroundImage: `url("data:image/svg+xml,${ANDEAN_PATTERN}")`,
        backgroundRepeat: "repeat",
      }}
    >
      <EscenasScroll tarjetas={tarjetas} />
    </section>
  );
}

// Escenas: la introducción y luego cada paso. Una sola a la vez, en el mismo lugar.
const ESCENAS = PASOS.length + 1;

/* — Escena anclada: el scroll elige qué escena se ve (intro → 01 → 02 → 03); la
   anterior se desvanece y aparece la siguiente, sin desplazarse. — */
function EscenasScroll({ tarjetas }: VisualProps) {
  const reduce = useReducedMotion();
  const t = useTranslations("home.producto");
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
      setActive(Math.min(ESCENAS - 1, Math.floor(progress * ESCENAS)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const paso = active > 0 ? PASOS[active - 1] : null;

  return (
    <div ref={trackRef} style={{ height: `${ESCENAS * 100}vh` }}>
      <div className="sticky top-16 flex h-[calc(100dvh-4rem)] items-center px-5 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="mx-auto w-full max-w-6xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.5, ease: "easeInOut" }}
          >
            {paso ? (
              <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
                <div className="mx-auto w-full max-w-[220px] md:max-w-none">
                  <paso.Visual tarjetas={tarjetas} />
                </div>
                <div className="text-center md:text-left">
                  <span className="font-serif text-4xl font-bold leading-none text-acento-dorado/30 md:text-6xl">
                    {paso.num}
                  </span>
                  <h3 className="mt-1 font-serif text-2xl font-bold text-texto-claro md:text-4xl">
                    {t(paso.titulo)}
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-stone-400 md:mx-0 md:text-lg">
                    {t(paso.texto)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-acento-dorado">{t("eyebrow")}</p>
                <h2 className="mt-3 font-serif text-3xl font-bold text-texto-claro md:text-5xl">
                  {t("titulo")}
                </h2>
                <p className="mx-auto mt-6 text-base leading-relaxed text-stone-400 md:text-lg">
                  {t.rich("intro_1", {
                    marca: (chunks) => <span className="font-semibold text-texto-claro">{chunks}</span>,
                  })}
                </p>
                <p className="mx-auto mt-4 text-base leading-relaxed text-stone-400 md:text-lg">
                  {t("intro_2")}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progreso: un punto por escena */}
        <div aria-hidden className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {Array.from({ length: ESCENAS }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === active ? "w-6 bg-acento-dorado" : "w-1.5 bg-stone-600"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
