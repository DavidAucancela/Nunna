"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FadeUp } from "@/components/ui/FadeUp";

const ANDEAN_PATTERN = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'>` +
  `<path d='M24 0L48 24L24 48L0 24Z' fill='none' stroke='rgba(200,155,60,0.08)' stroke-width='0.8'/>` +
  `<path d='M24 11L37 24L24 37L11 24Z' fill='none' stroke='rgba(200,155,60,0.05)' stroke-width='0.5'/>` +
  `</svg>`
);

/* — Marco de teléfono reutilizable — */
function PhoneMock({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[260px]">
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

/* — Paso 01: el imán físico — */
function ImanVisual() {
  // La imagen del imán trae fondo blanco propio: la máscara radial difumina sus
  // bordes para que se asiente sobre la foto del pase (borrosa) en vez de un bloque blanco.
  const fadeMask =
    "radial-gradient(ellipse 52% 56% at 50% 47%, #000 74%, transparent 100%)";
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <div className="absolute -inset-5 rounded-[2rem] bg-acento-dorado/10 blur-3xl" />
      <div className="relative aspect-square overflow-hidden rounded-[1.6rem] border border-acento-dorado/25 shadow-2xl shadow-black/40">
        {/* Fondo: diablo de lata en pase — borroso y atenuado */}
        <Image
          src="/personajes/diablos-de-lata-en-pase-1.jpg"
          alt=""
          aria-hidden="true"
          fill
          className="scale-110 object-cover blur-md brightness-[0.55]"
          sizes="(max-width: 768px) 80vw, 420px"
        />
        <div className="absolute inset-0 bg-fondo-oscuro/45" />

        {/* Imán — grande, centrado, con bordes difuminados sobre la foto */}
        <Image
          src="/personajes/diablos-de-lata-iman-principal.webp"
          alt="Imán artesanal Diablos de lata"
          fill
          className="object-contain p-2 drop-shadow-[0_12px_30px_rgba(0,0,0,0.55)]"
          sizes="(max-width: 768px) 80vw, 420px"
          style={{ WebkitMaskImage: fadeMask, maskImage: fadeMask }}
        />

        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
      </div>
      {/* Etiqueta artesanal */}
      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-acento-dorado/30 bg-stone-950 px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-acento-dorado/90 shadow-lg">
        Pieza única · hecho a mano
      </span>
    </div>
  );
}

/* — Paso 02: escaneo del QR — */
function QrVisual() {
  const reduce = useReducedMotion();
  return (
    <PhoneMock>
      <div className="flex h-full flex-col items-center justify-center gap-5 bg-gradient-to-b from-stone-900 to-stone-950 p-6">
        <p className="text-[10px] uppercase tracking-[0.25em] text-stone-500">Reverso de la tarjeta</p>
        <div className="relative">
          <svg
            viewBox="0 0 100 100"
            fill="currentColor"
            className="h-32 w-32 text-acento-dorado"
            aria-hidden="true"
          >
            <rect x="5"  y="5"  width="30" height="30" fill="none" stroke="currentColor" strokeWidth="7" rx="2" />
            <rect x="12" y="12" width="16" height="16" rx="1" />
            <rect x="65" y="5"  width="30" height="30" fill="none" stroke="currentColor" strokeWidth="7" rx="2" />
            <rect x="72" y="12" width="16" height="16" rx="1" />
            <rect x="5"  y="65" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="7" rx="2" />
            <rect x="12" y="72" width="16" height="16" rx="1" />
            <rect x="42" y="5"  width="8" height="8"  rx="1" />
            <rect x="42" y="17" width="8" height="8"  rx="1" />
            <rect x="65" y="42" width="8" height="8"  rx="1" />
            <rect x="77" y="42" width="8" height="8"  rx="1" />
            <rect x="42" y="42" width="8" height="8"  rx="1" />
            <rect x="54" y="54" width="8" height="8"  rx="1" />
            <rect x="66" y="66" width="8" height="8"  rx="1" />
            <rect x="78" y="54" width="8" height="8"  rx="1" />
            <rect x="54" y="78" width="8" height="8"  rx="1" />
            <rect x="78" y="78" width="8" height="8"  rx="1" />
          </svg>
          {/* Línea de escaneo */}
          {!reduce && (
            <motion.div
              className="absolute inset-x-0 h-[2px] rounded-full bg-acento-dorado shadow-[0_0_10px_2px_rgba(200,155,60,0.7)]"
              initial={{ top: "4%" }}
              animate={{ top: ["4%", "96%", "4%"] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
        <p className="text-center text-xs leading-relaxed text-stone-500">
          Apunta la cámara<br />— sin apps —
        </p>
      </div>
    </PhoneMock>
  );
}

/* — Paso 03: la ficha del ser — */
function FichaVisual() {
  return (
    <PhoneMock>
      <Image
        src="/personajes/diablos-de-lata.webp"
        alt="Ficha del personaje en el teléfono"
        fill
        className="object-cover object-top"
        sizes="(max-width: 768px) 80vw, 260px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/55 to-transparent" />
      <div className="absolute inset-x-5 bottom-6 space-y-3">
        <span className="inline-block rounded-full bg-acento-rojo/90 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
          Mestizo
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

const PASOS = [
  {
    num: "01",
    kicker: "Lo físico",
    titulo: "Elige tu imán",
    texto: "Cada imán es una pieza moldeada y pintada a mano: un ser de los pases riobambeños que vive en tu refrigeradora. No hay dos exactamente iguales.",
    Visual: ImanVisual,
  },
  {
    num: "02",
    kicker: "El puente",
    titulo: "Escanea el QR",
    texto: "Apunta la cámara de tu teléfono al código del reverso. Sin apps ni descargas — en segundos cruzas del objeto físico a su historia.",
    Visual: QrVisual,
  },
  {
    num: "03",
    kicker: "Lo digital",
    titulo: "Descubre al ser",
    texto: "Aterrizas en la ficha completa: leyenda, capítulos, simbolismo y la cosmovisión kichwa que le da sentido — en español, kichwa e inglés.",
    Visual: FichaVisual,
  },
];

export function ProductoSection() {
  return (
    <section
      className="border-y border-borde-sutil bg-fondo-oscuro px-5 py-16 sm:px-6 sm:py-24"
      style={{
        backgroundImage: `url("data:image/svg+xml,${ANDEAN_PATTERN}")`,
        backgroundRepeat: "repeat",
      }}
    >
      <div className="mx-auto max-w-6xl">

        {/* Encabezado + descripción del proyecto */}
        <FadeUp>
          <div className="mx-auto mb-16 max-w-2xl text-center sm:mb-24">
            <p className="text-xs uppercase tracking-[0.3em] text-acento-dorado">El producto</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-texto-claro md:text-5xl">
              Cómo funciona
            </h2>
            <p className="mx-auto mt-6 text-base leading-relaxed text-stone-400 md:text-lg">
              <span className="font-semibold text-texto-claro">Nunna</span> es un catálogo
              vivo de los seres que dan vida a los pases riobambeños. Cada uno se vuelve un
              imán artesanal: una pieza única que lleva, en su reverso, un código QR.
            </p>
            <p className="mx-auto mt-4 text-base leading-relaxed text-stone-400 md:text-lg">
              Al escanearlo aterrizas en la ficha del personaje —su historia y su cosmovisión
              kichwa— para que cada imán sea también una puerta a la memoria de Riobamba.
            </p>
          </div>
        </FadeUp>

        {/* Pasos — visual fijo + pasos que avanzan al scroll */}
        <PasosScroll />
      </div>
    </section>
  );
}

/* — Stepper con foco: las 3 categorías siempre visibles; la activa enfocada y las
   demás reducidas/desenfocadas (arriba/abajo), para saber en qué punto se está.
   Compartido por desktop (cambia con el scroll) y móvil (cambia con swipe/tap). — */
function StepperList({
  active,
  onSelect,
  reduce,
}: {
  active: number;
  onSelect: (i: number) => void;
  reduce: boolean | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      {PASOS.map((p, i) => {
        const isActive = i === active;
        return (
          <motion.button
            key={p.num}
            type="button"
            onClick={() => onSelect(i)}
            aria-current={isActive}
            aria-label={`Paso ${p.num} — ${p.titulo}`}
            className="text-left focus-visible:outline-none"
            style={{ transformOrigin: "left center" }}
            animate={{
              opacity: isActive ? 1 : 0.3,
              scale: isActive ? 1 : 0.82,
              filter: isActive ? "blur(0px)" : "blur(2.5px)",
            }}
            transition={{ duration: reduce ? 0 : 0.45, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3">
              <span
                className={`font-serif font-bold leading-none transition-colors ${
                  isActive
                    ? "text-5xl text-acento-dorado/30 md:text-6xl"
                    : "text-3xl text-acento-dorado/20"
                }`}
              >
                {p.num}
              </span>
              <span className="text-[11px] uppercase tracking-[0.3em] text-acento-dorado">
                {p.kicker}
              </span>
            </div>
            <h3
              className={`mt-2 font-serif font-bold text-texto-claro ${
                isActive ? "text-2xl md:text-4xl" : "text-xl md:text-2xl"
              }`}
            >
              {p.titulo}
            </h3>
            <AnimatePresence initial={false}>
              {isActive && (
                <motion.p
                  key="desc"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: reduce ? 0 : 0.4, ease: "easeOut" }}
                  className="max-w-md overflow-hidden text-base leading-relaxed text-stone-400 md:text-lg"
                >
                  <span className="block pt-4">{p.texto}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

/* — Escena anclada: imagen + texto cambian juntos según el scroll (desktop) / apilado (móvil) — */
function PasosScroll() {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  // El progreso del scroll dentro del "track" elige el punto activo.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      // En móvil el track de desktop está oculto (display:none) → no debe tocar
      // el estado, que ahí lo controla el carrusel táctil.
      if (track.offsetParent === null) return;
      const rect = track.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      const progress = total > 0 ? scrolled / total : 0;
      const idx = Math.min(PASOS.length - 1, Math.floor(progress * PASOS.length));
      setActive((prev) => (prev !== idx ? idx : prev));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Clic en un punto → desplaza al centro de su tramo; el scroll fija el estado.
  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const total = Math.max(rect.height - window.innerHeight, 1);
    const targetScrolled = ((i + 0.5) / PASOS.length) * total;
    const delta = rect.top + targetScrolled;
    window.scrollTo({ top: window.scrollY + delta, behavior: reduce ? "auto" : "smooth" });
  };

  // Navegación del carrusel móvil (sin depender del scroll)
  const goNext = () => setActive((a) => Math.min(a + 1, PASOS.length - 1));
  const goPrev = () => setActive((a) => Math.max(a - 1, 0));
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  const paso = PASOS[active] ?? PASOS[0]!;
  const ActiveVisual = paso.Visual;
  const fade = {
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: reduce ? { opacity: 0 } : { opacity: 0, y: -12 },
    transition: { duration: reduce ? 0 : 0.4, ease: "easeOut" as const },
  };

  return (
    <>
      {/* Desktop — escena anclada; un solo punto (imagen + texto) visible a la vez */}
      <div className="hidden md:block">
        {/* El alto del track da la distancia de scroll: un viewport por punto */}
        <div ref={trackRef} style={{ height: `${PASOS.length * 100}vh` }}>
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center">
            <div className="grid w-full grid-cols-2 items-center gap-16">
              {/* Visual */}
              <div className="flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.div key={`v-${active}`} className="w-full" {...fade}>
                    <ActiveVisual />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Stepper con foco — la activa se enfoca, las demás reducidas/desenfocadas */}
              <StepperList active={active} onSelect={goTo} reduce={reduce} />
            </div>
          </div>
        </div>
      </div>

      {/* Móvil — pasos apilados verticalmente; cada uno entra al hacer scroll */}
      <div className="space-y-20 md:hidden">
        {PASOS.map((paso, i) => {
          const Visual = paso.Visual;
          return (
            <motion.div
              key={paso.num}
              initial={reduce ? false : { opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="flex flex-col gap-8"
            >
              {/* Visual del paso */}
              <div className="flex justify-center">
                <Visual />
              </div>

              {/* Texto del paso */}
              <div className="flex gap-4">
                <span className="mt-1 shrink-0 font-serif text-4xl font-bold leading-none text-acento-dorado/30">
                  {paso.num}
                </span>
                <div>
                  <h3 className="font-serif text-xl font-bold text-texto-claro">{paso.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-400">{paso.texto}</p>
                </div>
              </div>

              {/* Separador entre pasos */}
              {i < PASOS.length - 1 && (
                <div className="mx-auto h-px w-16 bg-gradient-to-r from-transparent via-acento-dorado/30 to-transparent" />
              )}
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
