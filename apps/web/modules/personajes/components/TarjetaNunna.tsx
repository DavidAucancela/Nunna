import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import type { TarjetaArte } from "@seres-del-pase/types";

// ─────────────────────────────────────────────────────────────────────────────
// La tarjeta impresa que acompaña a cada imán, redibujada para la web.
//
// Solo la ilustración del frente y los íconos del reverso son imágenes (el arte
// del autor, en `personajes.json` → `tarjeta`); marco, placa, textos y grilla van
// en CSS para verse nítidos a cualquier tamaño. Todo se mide en `cqw` (% del
// ancho de la tarjeta), así las proporciones son las del impreso a cualquier
// escala. Los textos son los impresos, en español, en ambos idiomas del sitio:
// la tarjeta se muestra tal como el comprador la tiene en la mano.
// ─────────────────────────────────────────────────────────────────────────────

/** Colores tomados del arte final de la tarjeta. */
export const TARJETA = {
  fondo: "#37220A",
  dorado: "#F4CB1B",
  filete: "#E0B919",
  placa: "#FFF9E6",
} as const;

/**
 * QR de muestra para ilustrar el reverso en el sitio: lleva a la portada, no a una
 * ficha con `?origen=qr` — un QR real escaneable desde la pantalla permitiría
 * guardar personajes sin tener el imán.
 */
const QR_MUESTRA = "/qr/qr-muestra.png";

export interface TarjetaPersonaje {
  slug: string;
  tarjeta: TarjetaArte;
}

/**
 * Marco común a las dos caras: fondo café, filete dorado grueso y uno fino por dentro.
 * Para posicionar la tarjeta con `absolute`, envuélvela: el `relative` de aquí le ganaría.
 */
function Marco({
  className = "",
  style,
  children,
}: {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative aspect-[52/90] overflow-hidden rounded-[2.5cqw] shadow-[0_24px_50px_-20px_rgba(0,0,0,0.9)] ${className}`}
      style={{ background: TARJETA.fondo, containerType: "inline-size", ...style }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[2.5cqw] border-[2.4cqw]"
        style={{ borderColor: TARJETA.dorado }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[8cqw] border-[0.5cqw]"
        style={{ borderColor: TARJETA.filete }}
      />
      {children}
    </div>
  );
}

export function TarjetaFrente({
  personaje,
  className,
  style,
  sizes = "260px",
}: {
  personaje: TarjetaPersonaje;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  sizes?: string;
}) {
  const { nombre, ilustracion, color, llena } = personaje.tarjeta;
  // La placa tiene ancho fijo: el tamaño del nombre baja con su largo, como en el impreso.
  const tamano = Math.min(11, 66 / (nombre.length * 0.62));
  return (
    <Marco className={className} style={style}>
      <div className={`absolute overflow-hidden ${llena ? "inset-x-[10.5cqw] bottom-[33cqw] top-[10.5cqw]" : "inset-x-[11cqw] bottom-[38cqw] top-[11cqw]"}`}>
        <Image
          src={ilustracion}
          alt={`Ilustración de ${nombre} en la tarjeta del imán`}
          fill
          sizes={sizes}
          className={llena ? "object-cover" : "object-contain object-bottom"}
        />
      </div>
      <div
        className="absolute inset-x-[13cqw] bottom-[13cqw] flex flex-col items-center rounded-[3.5cqw] px-[3cqw] pb-[3cqw] pt-[3.5cqw]"
        style={{ background: TARJETA.placa }}
      >
        <p
          className="whitespace-nowrap font-serif font-black uppercase leading-none"
          style={{ color, fontSize: `${tamano}cqw` }}
        >
          {nombre}
        </p>
        <p className="mt-[1.6cqw] font-serif text-[length:3.6cqw] font-bold leading-none text-black">
          NUNNA-ECU.COM
        </p>
      </div>
    </Marco>
  );
}

/** Un círculo de la colección: ícono de línea, iluminado si `activo`. */
export function CirculoColeccion({
  personaje,
  activo,
  sizes = "80px",
  etiquetaClassName,
}: {
  personaje: TarjetaPersonaje;
  activo: boolean;
  sizes?: string;
  etiquetaClassName: string;
}) {
  const { nombre, icono } = personaje.tarjeta;
  return (
    <div className="flex flex-col items-center">
      <span
        className={`relative block aspect-square w-full overflow-hidden rounded-full transition-[opacity,filter] duration-700 ${
          activo ? "" : "opacity-30 sepia"
        }`}
        style={{ background: TARJETA.placa }}
      >
        <Image
          src={icono}
          alt=""
          fill
          sizes={sizes}
          className="object-cover mix-blend-multiply"
        />
      </span>
      <span
        className={`mt-[1.5cqw] whitespace-nowrap font-serif leading-none ${etiquetaClassName}`}
        style={{ color: TARJETA.placa }}
      >
        {nombre}
      </span>
    </div>
  );
}

export function ordenTarjeta<T extends TarjetaPersonaje>(personajes: T[]): T[] {
  return [...personajes].sort((a, b) => a.tarjeta.orden - b.tarjeta.orden);
}

export function TarjetaReverso({
  actual,
  personajes,
  className,
  style,
  qr,
}: {
  /** Slug del personaje cuyo círculo va iluminado. */
  actual: string;
  personajes: TarjetaPersonaje[];
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** Capa sobre el QR (p. ej. la línea de escaneo animada de "Cómo funciona"). */
  qr?: ReactNode;
}) {
  return (
    <Marco className={className} style={style}>
      <div className="absolute inset-[11cqw] flex flex-col items-center justify-between">
        <div className="grid w-full grid-cols-3 gap-x-[3cqw] gap-y-[3.5cqw]">
          {ordenTarjeta(personajes).map((p) => (
            <CirculoColeccion
              key={p.slug}
              personaje={p}
              activo={p.slug === actual}
              etiquetaClassName="text-[length:3.6cqw]"
            />
          ))}
        </div>
        <div className="flex w-full flex-col items-center">
          <p
            className="font-serif text-[length:4.4cqw] font-black leading-none"
            style={{ color: TARJETA.placa }}
          >
            NUNNA-ECU.COM
          </p>
          <div className="relative mt-[2.5cqw] aspect-square w-[62cqw] bg-white p-[2cqw]">
            <div className="relative h-full w-full">
              <Image src={QR_MUESTRA} alt="" fill sizes="200px" className="object-contain [image-rendering:pixelated]" />
            </div>
            {qr}
          </div>
          <p
            className="mt-[4cqw] whitespace-nowrap font-serif text-[length:4cqw] font-black leading-none"
            style={{ color: TARJETA.placa }}
          >
            ESCANEA, DESCUBRE Y COLECCIONA
          </p>
        </div>
      </div>
    </Marco>
  );
}
