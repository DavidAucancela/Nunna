"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  createRielCurve,
  paradaPosition,
  puntosControlDesdeLocal,
} from "@/lib/pase-camera/curve";
import type { RielParada } from "@/lib/pase-camera/riel";
import { PaseCameraRig } from "./PaseCameraRig";
import { PaseBillboard } from "./PaseBillboard";
import { PaseCrowdLayer } from "./PaseCrowdLayer";
import { PaseInfoCards } from "./PaseInfoCards";

interface Props {
  paradas: RielParada[];
  /** Puntos de control ya proyectados a metros locales — ver PaseCameraSection.tsx. */
  controlPoints: [number, number, number][];
}

// La ruta real puede extenderse varios cientos de metros desde el centro del
// pase — el suelo tiene que cubrir eso de sobra; es un solo quad, gratis en
// draw calls sin importar su tamaño.
const GROUND_SIZE = 4000;
const GROUND_COLOR = "#241f19";

// Cielo/niebla más claros que el suelo — sin esto la escena entera se ve
// negra en los tramos vacíos entre paradas (el clear color por defecto de
// three.js es negro puro, indistinguible del fondo oscuro del sitio). El fog
// además da una pista de profundidad real mientras no hay entorno modelado.
const SKY_COLOR = "#2b241c";

function paradaKey(parada: RielParada): string {
  return parada.tipo === "personaje" ? (parada.waypoint.slug ?? parada.waypoint.nombre) : parada.elemento.id;
}

/**
 * Árbol R3F real: <Canvas> + riel de cámara + capas HTML hermanas (tarjetas),
 * que llena el contenedor sticky de PaseCameraGated. La cámara avanza con el
 * scroll normal de la página (sin scroll interno). Importado solo vía
 * next/dynamic(ssr:false) desde PaseCameraGated; nunca se evalúa en servidor.
 */
export function PaseCameraScene({ paradas, controlPoints }: Props) {
  const curve = useMemo(
    () => createRielCurve(puntosControlDesdeLocal(controlPoints)),
    [controlPoints]
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-fondo-oscuro">
      <Canvas
        camera={{ fov: 55, near: 0.1, far: 2000 }}
        dpr={[1, 1.75]}
      >
        <Suspense fallback={null}>
          <color attach="background" args={[SKY_COLOR]} />
          <fog attach="fog" args={[SKY_COLOR, 40, 700]} />
          <ambientLight intensity={0.7} color="#F5F1EA" />
          <directionalLight position={[60, 90, 30]} intensity={1.4} color="#F0C674" />
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
            <meshStandardMaterial color={GROUND_COLOR} roughness={1} />
          </mesh>
          <PaseCrowdLayer curve={curve} />
          <PaseCameraRig curve={curve} />
            {paradas.map((parada, i) => (
              <PaseBillboard
                key={paradaKey(parada)}
                parada={parada}
                position={paradaPosition(curve, parada.progress, i % 2 === 0 ? 1 : -1).toArray() as [
                  number,
                  number,
                  number,
                ]}
              />
            ))}
        </Suspense>
      </Canvas>
      <PaseInfoCards paradas={paradas} />
    </div>
  );
}
