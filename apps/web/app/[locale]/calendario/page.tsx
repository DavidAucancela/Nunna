import type { Metadata } from "next";
import { getPases } from "@/lib/data";
import { CalendarioGrid } from "@/modules/festividades/components/CalendarioGrid";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Calendario festivo",
    description: "Fechas y festividades de los pases del Chimborazo — Riobamba, Ecuador.",
  };
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Datos fijos de referencia basados en los recorridos oficiales de la Alcaldía de Riobamba
const PASES_FIJOS = [
  {
    mes: 12,
    dia: 20,
    nombre: "Pase del Niño — CDI Gotitas de Dulzura",
    descripcion: "09:30–10:30 · Av. Antonio José de Sucre → Vicente Ramón Roca → Rocafuerte. Personaje: Aya Uma.",
    tipo: "pase",
  },
  {
    mes: 12,
    dia: 20,
    nombre: "Pase del Niño — SAFPI",
    descripcion: "12:00–13:00 · Cuba / México → Juan Bernardo de León → La Paz → Colegio Cisneros. Personaje: Rey Moro.",
    tipo: "pase",
  },
  {
    mes: 12,
    dia: 20,
    nombre: "Pase del Niño — Mercado Santa Rosa",
    descripcion: "13:00–14:00 · Carabobo / Villarroel → Rocafuerte → Colombia / Pichincha → García Moreno. Personaje: Payaso.",
    tipo: "pase",
  },
  {
    mes: 12,
    dia: 20,
    nombre: "Pase del Niño — Unidad Educativa La Salle",
    descripcion: "15:00–18:00 · Carabobo → Venezuela → España → Argentinos → Espejo → Colón / Nueva York. Personaje: Perro.",
    tipo: "pase",
  },
  {
    mes: 12,
    dia: 20,
    nombre: "Pase del Niño — Instituto Tecnológico Riobamba",
    descripcion: "17:00–20:00 · Carlos Zambrano → Av. Daniel León Borja → 10 de Agosto → Iglesia La Catedral. Personaje: Curiquingue.",
    tipo: "pase",
  },
  {
    mes: 8,
    dia: 5,
    nombre: "Fiestas de Riobamba",
    descripcion: "Fundación española de Riobamba (1534). Desfile de personajes por el centro histórico.",
    tipo: "festivo",
  },
  {
    mes: 11,
    dia: 2,
    nombre: "Día de los Difuntos — Aya Marcay Quilla",
    descripcion: "Mes de los difuntos en kichwa. El Perro Guardián del umbral cobra especial relevancia en las celebraciones.",
    tipo: "ceremonial",
  },
];

export default async function CalendarioPage() {
  const pases = await getPases({});

  // Todos los pases agrupados por mes (calendario completo en formato lista)
  const pasesPorMes = MESES.reduce<Record<number, typeof pases>>((acc, _, i) => {
    const mes = i + 1;
    const pasesDelMes = pases.filter((p) => p.mes === mes);
    if (pasesDelMes.length > 0) acc[mes] = pasesDelMes;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-[0.2em] text-acento-dorado">
          Chimborazo · Ecuador
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-texto-claro md:text-5xl">
          Calendario festivo
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-400">
          Los pases riobambeños siguen el ciclo agrícola-ritual andino. Haz clic en cualquier fecha
          marcada para conocer el pase o festividad.
        </p>

        {/* Leyenda */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-stone-500">
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-acento-dorado text-[9px] font-bold text-fondo-oscuro">
              15
            </span>
            Día con evento
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded border border-borde-sutil text-[9px] text-stone-700">
              7
            </span>
            Sin eventos
          </span>
        </div>
      </header>

      <CalendarioGrid pases={pases} pasesFijos={PASES_FIJOS} />

      {/* Calendario completo — todos los pases por mes (vista de lista) */}
      {Object.keys(pasesPorMes).length > 0 && (
        <section className="mt-16 border-t border-borde-sutil pt-12">
          <h2 className="mb-8 font-serif text-2xl font-bold text-texto-claro">
            Calendario completo
          </h2>
          {Object.entries(pasesPorMes).map(([mes, pasesDelMes]) => (
            <div key={mes} className="mb-12">
              <h3 className="mb-4 font-serif text-xl font-bold text-acento-dorado">
                {MESES[Number(mes) - 1]}
              </h3>
              <div className="space-y-4">
                {pasesDelMes.map((pase) => (
                  <div
                    key={pase.id}
                    className="flex items-center gap-6 rounded-2xl border border-borde-sutil bg-stone-900/30 p-6"
                  >
                    <div className="min-w-16 text-center">
                      {pase.dia ? (
                        <span className="text-3xl font-bold text-texto-claro">
                          {String(pase.dia).padStart(2, "0")}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-500">Fecha variable</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-serif text-lg font-semibold text-texto-claro">
                        {pase.nombre}
                      </h4>
                      <p className="mt-1 text-sm text-stone-500">{pase.fechaDescripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
