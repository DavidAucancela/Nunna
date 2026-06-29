import Image from "next/image";
import type { Artesano, TipoOrigen } from "@seres-del-pase/types";
import { OrigenPlaceholder } from "@/components/ui/OrigenPlaceholder";
import { FadeUp } from "@/components/ui/FadeUp";

interface ArtesanoSectionProps {
  artesano: Artesano;
  nombre: string;
  origen?: TipoOrigen;
  accentColor: string;
}

export function ArtesanoSection({ artesano, nombre, origen, accentColor }: ArtesanoSectionProps) {
  return (
    <FadeUp>
      <section className="mx-auto max-w-3xl px-5 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-borde-sutil">
          {/* Header */}
          <div
            className="flex items-center gap-2 px-6 py-3"
            style={{ backgroundColor: `${accentColor}12` }}
          >
            <svg
              width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.5}
              viewBox="0 0 24 24" style={{ color: accentColor }} aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <span
              className="text-[10px] font-medium uppercase tracking-[0.3em]"
              style={{ color: accentColor }}
            >
              El artesano detrás del imán
            </span>
          </div>

          {/* Cuerpo */}
          <div className="flex gap-5 p-6 sm:gap-8">
            {/* Foto o placeholder */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-borde-sutil">
              {artesano.foto ? (
                <Image
                  src={artesano.foto}
                  alt={artesano.nombre}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <OrigenPlaceholder
                  origen={origen}
                  nombre={artesano.nombre}
                  variant="card"
                  className="absolute inset-0"
                />
              )}
            </div>

            {/* Datos */}
            <div className="min-w-0">
              <p className="font-serif text-lg font-semibold leading-snug text-texto-claro">
                {artesano.nombre}
              </p>
              {artesano.ciudad && (
                <p className="mt-0.5 text-xs text-stone-500">{artesano.ciudad}</p>
              )}
              {artesano.bio ? (
                <p className="mt-3 text-sm leading-relaxed text-stone-400">{artesano.bio}</p>
              ) : (
                <p className="mt-3 text-sm italic leading-relaxed text-stone-600">
                  Creador del imán de {nombre}.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </FadeUp>
  );
}
