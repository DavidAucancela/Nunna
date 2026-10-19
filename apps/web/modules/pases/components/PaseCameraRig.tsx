"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type CatmullRomCurve3 } from "three";
import { getTarget, writeProgress } from "@/lib/pase-camera/scroll-progress";

interface Props {
  curve: CatmullRomCurve3;
}

const LOOKAHEAD = 0.015;
// Qué tan rápido persigue la cámara al scroll (1/s): más alto = más pegada.
const FOLLOW = 7;

/**
 * En cada frame persigue el objetivo de scroll de la página (scroll-progress.ts)
 * con un suavizado exponencial y posiciona la cámara sobre la curva del riel.
 * Escribe el progreso suavizado al store para que las capas HTML (fuera del
 * canvas) se mantengan sincronizadas con lo que se ve.
 */
export function PaseCameraRig({ curve }: Props) {
  const smooth = useRef(getTarget());
  const lookAt = useRef(new Vector3());

  useFrame(({ camera }, delta) => {
    smooth.current += (getTarget() - smooth.current) * (1 - Math.exp(-FOLLOW * delta));
    const t = Math.min(1, Math.max(0, smooth.current));
    const point = curve.getPointAt(t);
    const aheadT = Math.min(t + LOOKAHEAD, 1);
    lookAt.current.copy(curve.getPointAt(aheadT));
    camera.position.copy(point);
    camera.lookAt(lookAt.current);
    writeProgress(t);
  });

  return null;
}
