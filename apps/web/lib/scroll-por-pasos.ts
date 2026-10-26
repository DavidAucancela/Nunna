"use client";

import { useEffect, useRef, type RefObject } from "react";
import { getLenis } from "@/components/ui/LenisProvider";

/**
 * "Un gesto = un paso" para las escenas ancladas (pista alta + escena `sticky` que
 * cambia según el progreso del scroll): Historia de la ficha, "Cómo funciona" del
 * inicio y el recorrido de /pases.
 *
 * Problema: el paso visible es solo "cuánto de la pista recorriste", así que una
 * pasada rápida (fling en el teléfono, trackpad, rueda rápida) cruzaba varios pasos
 * en un solo gesto y se saltaban puntos.
 *
 * Solución: cada paso tiene un ancla (posición de scroll). El scroll del usuario
 * nunca cruza más de un ancla por gesto — si lo intenta, se frena en la siguiente y
 * se mantiene ahí el resto del gesto (inercia del trackpad, momentum del dedo). Un
 * gesto nuevo vuelve a avanzar. Antes del primer paso y después del último la página
 * se mueve normal. Los scrolls por programa (volver arriba, clic en una foto) no se
 * frenan: solo se frena si hubo rueda / arrastre / teclas de scroll recientes.
 */

/** Tolerancia (px) para considerar que el scroll está sobre un ancla. */
const TOL = 2;
/** Cuánto se mantiene el freno tras frenar (ms), mientras no llegue un gesto nuevo. */
const FRENO_MS = 450;
/** Pausa entre eventos de rueda que marca un gesto nuevo (ms). */
const GESTO_NUEVO_MS = 200;
/** Ventana tras el último input del usuario en la que su scroll puede frenarse (ms). */
const VENTANA_USUARIO_MS = 2500;
const SIN_INPUT = Number.NEGATIVE_INFINITY;

/**
 * Siguiente estado dado el último paso asentado (`prev`: -1 = antes de la sección,
 * n = después) y la posición actual. `frenarEn` = posición a la que hay que volver
 * porque el scroll cruzó más de un ancla.
 */
export function resolverPaso(
  prev: number,
  y: number,
  anclas: number[],
  tol = TOL,
): { idx: number; frenarEn: number | null } {
  const n = anclas.length;
  if (n === 0) return { idx: prev, frenarEn: null };
  const siguiente = anclas[prev + 1];
  if (prev < n - 1 && siguiente !== undefined && y > siguiente + tol) {
    return { idx: prev + 1, frenarEn: siguiente };
  }
  const anterior = anclas[prev - 1];
  if (prev > 0 && anterior !== undefined && y < anterior - tol) {
    return { idx: prev - 1, frenarEn: anterior };
  }
  return { idx: pasoActualizado(prev, y, anclas, tol), frenarEn: null };
}

/** Sin frenar: el paso cambia solo al llegar a un ancla vecina o al salir de la zona. */
function pasoActualizado(prev: number, y: number, anclas: number[], tol: number): number {
  const n = anclas.length;
  if (y < anclas[0]! - tol) return -1;
  if (y > anclas[n - 1]! + tol) return n;
  for (const k of [prev - 1, prev, prev + 1]) {
    const a = anclas[k];
    if (a !== undefined && Math.abs(y - a) <= tol) return k;
  }
  // Entró a la zona sin pasar por un ancla (p. ej. justo en el borde): el último ancla alcanzado.
  if (prev < 0 || prev >= n) return pasoPorPosicion(y, anclas, tol);
  return prev;
}

/** Paso según la posición, sin historia (montaje, scroll por programa). */
export function pasoPorPosicion(y: number, anclas: number[], tol = TOL): number {
  const n = anclas.length;
  if (n === 0 || y < anclas[0]! - tol) return -1;
  if (y > anclas[n - 1]! + tol) return n;
  let k = 0;
  for (let i = 0; i < n; i++) if (anclas[i]! <= y + tol) k = i;
  return k;
}

function moverA(y: number) {
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
}

const TECLAS_SCROLL = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Spacebar"]);

/**
 * @param trackRef la pista alta (la que contiene la escena `sticky`).
 * @param anclas   progreso (0–1, mismo cálculo que la escena: −top / (alto − ventana))
 *                 de cada paso, en orden creciente.
 */
export function usePasosAnclados(trackRef: RefObject<HTMLElement | null>, anclas: number[]) {
  const anclasRef = useRef(anclas);
  anclasRef.current = anclas;
  const clave = anclas.join(",");

  useEffect(() => {
    let paso = -1;
    let freno: { y: number; hasta: number } | null = null;
    // "Sin input" = -Infinity, no 0: performance.now() empieza en 0 al cargar, y con 0 el scroll
    // restaurado por el navegador en los primeros 2,5 s se tomaría como gesto del usuario.
    let ultimoInput = SIN_INPUT;
    let ultimaRueda = 0;
    let ultimoDelta = 0;
    let tocando = false;

    const posiciones = (): number[] | null => {
      const el = trackRef.current;
      if (!el || el.offsetParent === null) return null; // pista oculta (p. ej. móvil en "Cómo funciona")
      const rect = el.getBoundingClientRect();
      const recorrido = rect.height - window.innerHeight;
      if (recorrido <= 0) return null;
      const top = rect.top + window.scrollY;
      return anclasRef.current.map((a) => Math.round(top + a * recorrido));
    };

    const iniciales = posiciones();
    if (iniciales) paso = pasoPorPosicion(window.scrollY, iniciales);

    const frenar = (y: number, ahora: number) => {
      freno = { y, hasta: ahora + FRENO_MS };
      moverA(y);
    };

    const onScroll = () => {
      const anclasY = posiciones();
      if (!anclasY) return;
      const y = window.scrollY;
      const ahora = performance.now();

      if (freno) {
        if (ahora < freno.hasta || tocando) {
          if (Math.abs(y - freno.y) > 1) {
            // Sigue empujando (momentum del dedo): se mantiene el freno hasta que pare.
            freno.hasta = Math.max(freno.hasta, ahora + 150);
            moverA(freno.y);
          }
          return;
        }
        freno = null;
      }

      if (ahora - ultimoInput > VENTANA_USUARIO_MS) {
        paso = pasoPorPosicion(y, anclasY);
        return;
      }
      const r = resolverPaso(paso, y, anclasY);
      paso = r.idx;
      if (r.frenarEn !== null) frenar(r.frenarEn, ahora);
    };

    // Captura en window: corre antes que Lenis y, durante el freno, se lo oculta.
    const onWheel = (e: WheelEvent) => {
      const ahora = performance.now();
      const gestoNuevo =
        ahora - ultimaRueda > GESTO_NUEVO_MS ||
        (Math.abs(e.deltaY) > Math.abs(ultimoDelta) * 1.6 && Math.abs(e.deltaY) > 15);
      ultimaRueda = ahora;
      ultimoDelta = e.deltaY;
      ultimoInput = ahora;
      if (!freno) return;
      if (gestoNuevo) {
        freno = null;
        return;
      }
      // Inercia del mismo gesto: se traga y alarga el freno.
      freno.hasta = ahora + GESTO_NUEVO_MS;
      e.preventDefault();
      e.stopPropagation();
    };

    const onTouchStart = () => {
      tocando = true;
      freno = null; // dedo en la pantalla = gesto nuevo (y el momentum ya se cortó)
    };
    const onTouchMove = (e: TouchEvent) => {
      ultimoInput = performance.now();
      // Frenado con el dedo aún arrastrando: el mismo gesto no mueve más la página.
      if (freno && e.cancelable) e.preventDefault();
    };
    const onTouchEnd = () => {
      tocando = false;
      if (freno) freno.hasta = performance.now() + FRENO_MS; // cubre el momentum
    };
    const onKey = (e: KeyboardEvent) => {
      if (TECLAS_SCROLL.has(e.key)) {
        ultimoInput = performance.now();
        freno = null;
      } else if (e.key === "Home" || e.key === "End") {
        ultimoInput = SIN_INPUT;
      }
    };
    // Clic / arrastre de la barra: lo que siga es scroll por programa o deliberado.
    const onPointerDown = () => {
      if (!tocando) ultimoInput = SIN_INPUT;
    };
    const onClick = () => {
      ultimoInput = SIN_INPUT;
    };

    const opts = { capture: true, passive: false } as const;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, opts);
    window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    window.addEventListener("touchmove", onTouchMove, opts);
    window.addEventListener("touchend", onTouchEnd, { capture: true, passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { capture: true, passive: true });
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("mousedown", onPointerDown, true);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel, opts);
      window.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchmove", onTouchMove, opts);
      window.removeEventListener("touchend", onTouchEnd, true);
      window.removeEventListener("touchcancel", onTouchEnd, true);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("mousedown", onPointerDown, true);
      window.removeEventListener("click", onClick, true);
    };
    // `clave` cambia cuando cambian las anclas; el arreglo se lee por ref.
  }, [trackRef, clave]);
}

/** Anclas para N escenas que cambian con `floor(progreso · N)`: inicio y el centro de cada escena. */
export function anclasDeEscenas(n: number): number[] {
  return Array.from({ length: n }, (_, i) => (i === 0 ? 0 : (i + 0.5) / n));
}
