"use client";

import { useEffect, useMemo, useRef } from "react";
import { Object3D, Vector3, type CatmullRomCurve3, type InstancedMesh } from "three";

interface Props {
  curve: CatmullRomCurve3;
}

const CROWD_COUNT = 48;
const CROWD_LATERAL_OFFSET = 3.6;
const CROWD_JITTER = 0.9;
const CAPSULE_RADIUS = 0.28;
const CAPSULE_LENGTH = 0.55;

// PRNG determinístico (mulberry32) — la disposición de la multitud no debe
// recalcularse al azar en cada render mientras el usuario hace scroll.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Placeholder geométrico de la multitud — cápsulas instanciadas a los lados
 * del riel, un solo draw call para las CROWD_COUNT figuras. Reemplaza al
 * gradiente CSS anterior; vive dentro del <Canvas> (antes era una capa HTML
 * hermana, sin geometría real). Sin arte real todavía.
 */
export function PaseCrowdLayer({ curve }: Props) {
  const meshRef = useRef<InstancedMesh>(null);

  const positions = useMemo(() => {
    const random = mulberry32(20260822);
    const result: Vector3[] = [];
    for (let i = 0; i < CROWD_COUNT; i++) {
      const t = i / (CROWD_COUNT - 1);
      const side = i % 2 === 0 ? 1 : -1;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const normal = new Vector3(-tangent.z, 0, tangent.x).normalize();
      const jitter = (random() - 0.5) * CROWD_JITTER;
      result.push(
        point
          .clone()
          .addScaledVector(normal, CROWD_LATERAL_OFFSET * side + jitter)
          .setY(CAPSULE_LENGTH / 2 + CAPSULE_RADIUS)
      );
    }
    return result;
  }, [curve]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new Object3D();
    positions.forEach((position, i) => {
      dummy.position.copy(position);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CROWD_COUNT]}>
      <capsuleGeometry args={[CAPSULE_RADIUS, CAPSULE_LENGTH, 4, 8]} />
      <meshStandardMaterial color="#C89B3C" roughness={0.85} />
    </instancedMesh>
  );
}
