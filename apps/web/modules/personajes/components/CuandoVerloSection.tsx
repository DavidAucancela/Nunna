import type { PaseListItem } from "@seres-del-pase/types";
import { FadeUp } from "@/components/ui/FadeUp";

const MESES_ES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"] as const;

interface CuandoVerloSectionProps {
  pases: PaseListItem[];
  accentColor: string;
  eyebrow: string;
  titulo: string;
}

export function CuandoVerloSection({ pases, accentColor, eyebrow, titulo }: CuandoVerloSectionProps) {
  if (pases.length === 0) return null;

  return (
    <FadeUp>
      <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-6">
        <div className="mb-8">
          <p
            className="mb-2 text-[10px] uppercase tracking-[0.3em]"
            style={{ color: `${accentColor}80` }}
          >
            {eyebrow}
          </p>
          <h2 className="font-serif text-2xl font-bold text-texto-claro sm:text-3xl">
            {titulo}
          </h2>
        </div>

        <div className="space-y-3">
          {pases.map((pase) => {
            const mesLabel = pase.mes && pase.mes >= 1 && pase.mes <= 12 ? MESES_ES[pase.mes - 1] : null;
            const shortName = pase.nombre.replace(/^Pase del Niño\s*[—–-]\s*/i, "");

            return (
              <div
                key={pase.id}
                className="flex gap-4 rounded-2xl border border-borde-sutil bg-stone-900/30 p-4"
              >
                {/* Burbuja de fecha */}
                {mesLabel && pase.dia ? (
                  <div
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-center"
                    style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                  >
                    <span className="text-xl font-bold leading-none">{pase.dia}</span>
                    <span className="text-[10px] uppercase tracking-wide">{mesLabel}</span>
                  </div>
                ) : (
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-center"
                    style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug text-texto-claro">{shortName}</p>
                  {pase.horario && (
                    <p className="mt-0.5 text-xs text-stone-500">{pase.horario}</p>
                  )}
                  {pase.inicio && pase.fin && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-stone-600">
                      <span className="truncate">{pase.inicio}</span>
                      <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                      <span className="truncate">{pase.fin}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </FadeUp>
  );
}
