import { useEffect, useState } from "react";

type ProgressListener = (progress: number) => void;

let current = 0;
const listeners = new Set<ProgressListener>();

/**
 * Store mutable fuera de React para el progreso (0..1) del riel de cámara.
 * PaseCameraRig (dentro del <Canvas>) es el único escritor, en cada useFrame, con el progreso ya suavizado;
 * las capas HTML (fuera del canvas) se suscriben vía useRielProgress().
 * Un módulo aparte (no React state) evita que cada frame dispare un render
 * en el árbol de Three.js.
 */
export function writeProgress(progress: number) {
  if (progress === current) return;
  current = progress;
  for (const listener of listeners) listener(current);
}

/**
 * Objetivo 0..1: dónde está el scroll de la página dentro de la sección.
 * Lo escribe PaseCameraGated (framer-motion useScroll); la cámara lo persigue.
 */
let target = 0;
export function writeTarget(value: number) {
  target = Math.min(1, Math.max(0, value));
}
export function getTarget() {
  return target;
}

export function getProgress() {
  return current;
}

export function subscribeProgress(listener: ProgressListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Progreso reactivo (0..1) del riel, para las capas HTML fuera del <Canvas>. */
export function useRielProgress(): number {
  const [progress, setProgress] = useState(getProgress);
  useEffect(() => subscribeProgress(setProgress), []);
  return progress;
}
