"use client";

import { Billboard, useTexture } from "@react-three/drei";
import type { RielParada } from "@/lib/pase-camera/riel";

interface Props {
  parada: RielParada;
  position: [number, number, number];
}

const PERSONAJE_SIZE: [number, number] = [2.6, 4.2];
const ELEMENTO_SIZE: [number, number] = [2.4, 3.0];
const ELEMENTO_PLACEHOLDER_COLOR = "#1F4D3F";

function PersonajeBillboard({
  figura,
  position,
}: {
  figura: string;
  position: [number, number, number];
}) {
  // Cutout con canal alfa real (imagenPortada) — nunca la foto "en-pase", que
  // es una fotografía RGB plana y renderizaría un rectángulo opaco.
  const texture = useTexture(figura);
  return (
    <Billboard position={position}>
      <mesh>
        <planeGeometry args={PERSONAJE_SIZE} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </Billboard>
  );
}

function ElementoPlaceholderMesh({ position }: { position: [number, number, number] }) {
  // Sin arte real todavía — prisma de color de marca con meshStandardMaterial
  // (responde a la iluminación real de la escena, a diferencia de la
  // textura-canvas anterior) para poder iterar cámara/luces mientras se
  // consigue el modelo 3D final de cada elemento del pase.
  return (
    <mesh position={position}>
      <boxGeometry args={[1.4, ELEMENTO_SIZE[1], 1.4]} />
      <meshStandardMaterial color={ELEMENTO_PLACEHOLDER_COLOR} roughness={0.6} metalness={0.05} />
    </mesh>
  );
}

function ElementoImagenBillboard({
  imagen,
  position,
}: {
  imagen: string;
  position: [number, number, number];
}) {
  const texture = useTexture(imagen);
  return (
    <Billboard position={position}>
      <mesh>
        <planeGeometry args={ELEMENTO_SIZE} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </Billboard>
  );
}

export function PaseBillboard({ parada, position }: Props) {
  if (parada.tipo === "personaje") {
    // Sin ficha (waypoint inline) no hay recorte con alfa: prisma de marca, igual que un elemento sin arte.
    return parada.figura ? (
      <PersonajeBillboard figura={parada.figura} position={position} />
    ) : (
      <ElementoPlaceholderMesh position={position} />
    );
  }
  // `imagen` queda como campo opcional desde el día uno (ver ElementoRiel) —
  // en cuanto haya arte real para un elemento, esta rama se activa sola, sin
  // tocar el tipo de datos ni el resto del árbol.
  if (parada.elemento.imagen) {
    return <ElementoImagenBillboard imagen={parada.elemento.imagen} position={position} />;
  }
  return <ElementoPlaceholderMesh position={position} />;
}
