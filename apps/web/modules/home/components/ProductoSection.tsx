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
    titulo: "Elige tu imán",
    texto: "Cada imán está hecho y pintado a mano: un personaje de las fiestas del Ecuador para tu refrigeradora. No hay dos iguales.",
    Visual: ImanVisual,
  },
  {
    num: "02",
    titulo: "Escanea el QR",
    texto: "El código está en la parte de atrás de la tarjeta. Apunta la cámara de tu teléfono — no necesitas instalar nada.",
    Visual: QrVisual,
  },
  {
    num: "03",
    titulo: "Descubre su historia",
    texto: "Se abre la ficha del personaje: su leyenda, su significado y su origen kichwa — en español, kichwa e inglés.",
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
              vivo de los seres que dan vida a las fiestas populares del Ecuador. Cada uno se vuelve un
              imán artesanal: una pieza única que lleva, en su reverso, un código QR.
            </p>
            <p className="mx-auto mt-4 text-base leading-relaxed text-stone-400 md:text-lg">
              Al escanearlo aterrizas en la ficha del personaje —su historia y su cosmovisión
              kichwa— para que cada imán sea también una puerta a la memoria del Ecuador.
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
  compact = false,
}: {
  active: number;
  onSelect: (i: number) => void;
  reduce: boolean | null;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col ${compact ? "gap-3" : "gap-5"}`}>
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
              opacity: isActive ? 1 : 0.35,
              scale: isActive ? 1 : 0.86,
              filter: isActive ? "blur(0px)" : "blur(2px)",
            }}
            transition={{ duration: reduce ? 0 : 0.45, ease: "easeOut" }}
          >
            <span
              className={`font-serif font-bold leading-none transition-colors ${
                isActive
                  ? `text-acento-dorado/30 ${compact ? "text-3xl" : "text-5xl md:text-6xl"}`
                  : `text-acento-dorado/20 ${compact ? "text-xl" : "text-3xl"}`
              }`}
            >
              {p.num}
            </span>
            <h3
              className={`mt-1 font-serif font-bold text-texto-claro ${
                isActive
                  ? compact ? "text-lg" : "text-2xl md:text-4xl"
                  : compact ? "text-base" : "text-xl md:text-2xl"
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
                  className={`overflow-hidden leading-relaxed text-stone-400 ${
                    compact ? "max-w-full text-sm" : "max-w-md text-base md:text-lg"
                  }`}
                >
                  <span className={`block ${compact ? "pt-2" : "pt-3"}`}>{p.texto}</span>
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
  const trackDesktopRef = useRef<HTMLDivElement | null>(null);
  const trackMobileRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  // El progreso del scroll dentro del track visible (desktop o móvil) elige el
  // punto activo — el scroll de la página sigue siendo la fuente de verdad.
  useEffect(() => {
    const onScroll = () => {
      const track = trackDesktopRef.current?.offsetParent !== null
        ? trackDesktopRef.current
        : trackMobileRef.current;
      if (!track || track.offsetParent === null) return;
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

  // Clic/swipe en un punto → desplaza al centro de su tramo; el scroll fija el
  // estado, así los botones y el swipe quedan sincronizados con el scroll real.
  const goTo = (i: number) => {
    const clamped = Math.min(PASOS.length - 1, Math.max(0, i));
    const track = trackDesktopRef.current?.offsetParent !== null
      ? trackDesktopRef.current
      : trackMobileRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const total = Math.max(rect.height - window.innerHeight, 1);
    const targetScrolled = ((clamped + 0.5) / PASOS.length) * total;
    const delta = rect.top + targetScrolled;
    window.scrollTo({ top: window.scrollY + delta, behavior: reduce ? "auto" : "smooth" });
  };

  const paso = PASOS[active] ?? PASOS[0]!;
  const ActiveVisual = paso.Visual;
  const fade = {
    initial: reduce ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: reduce ? { opacity: 0 } : { opacity: 0, y: -12 },
    transition: { duration: reduce ? 0 : 0.4, ease: "easeOut" as const },
  };

  // Swipe horizontal (móvil) — un gesto de más de 40px mueve un paso, vía goTo
  // (mismo mecanismo que los botones y el scroll: scrollTo al tramo del paso).
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    goTo(active + (dx < 0 ? 1 : -1));
  };

  return (
    <>
      {/* Desktop — escena anclada; un solo punto (imagen + texto) visible a la vez */}
      <div className="hidden md:block">
        <div ref={trackDesktopRef} style={{ height: `${PASOS.length * 100}vh` }}>
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center">
            <div className="grid w-full grid-cols-2 items-center gap-16">
              <div className="flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.div key={`v-${active}`} className="w-full" {...fade}>
                    <ActiveVisual />
                  </motion.div>
                </AnimatePresence>
              </div>
              <StepperList active={active} onSelect={goTo} reduce={reduce} />
            </div>
          </div>
        </div>
      </div>

      {/* Móvil — sticky scroll igual al desktop (el scroll de la página sigue
          cambiando el paso) + swipe horizontal + flechas + tap directo en cada
          paso, todo sincronizado por goTo(). Los pasos inactivos quedan visibles
          y difuminados arriba/abajo para no perder la orientación. */}
      <div
        className="md:hidden"
        ref={trackMobileRef}
        style={{ height: `${PASOS.length * 100}vh` }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 px-5">
          {/* Visual */}
          <div className="flex w-full max-w-[220px] justify-center">
            <AnimatePresence mode="wait">
              <motion.div key={`mv-${active}`} className="w-full" {...fade}>
                <ActiveVisual />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Flechas + los 3 pasos como botones. items-start + mt fija las flechas
              a la altura del número, sin saltar verticalmente cuando el paso
              activo crece por la descripción. */}
          <div className="flex w-full max-w-xs items-start gap-2">
            <button
              type="button"
              aria-label="Paso anterior"
              disabled={active === 0}
              onClick={() => goTo(active - 1)}
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-borde-sutil text-lg text-texto-claro transition-opacity disabled:opacity-20"
            >
              ‹
            </button>
            <div className="flex-1">
              <StepperList active={active} onSelect={goTo} reduce={reduce} compact />
            </div>
            <button
              type="button"
              aria-label="Paso siguiente"
              disabled={active === PASOS.length - 1}
              onClick={() => goTo(active + 1)}
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-borde-sutil text-lg text-texto-claro transition-opacity disabled:opacity-20"
            >
              ›
            </button>
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-600">
            Desliza, toca un paso o sigue bajando
          </p>
        </div>
      </div>
    </>
  );
}
