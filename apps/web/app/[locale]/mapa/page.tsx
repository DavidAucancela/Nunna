import type { Metadata } from "next";
import Image from "next/image";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Mapa de los pases",
    description: "Recorridos reales de los Pases del Niño en Riobamba — Chimborazo, Ecuador.",
  };
}

const PASES = [
  {
    nombre: "CDI Gotitas de Dulzura",
    tipo: "Centro de Desarrollo Infantil",
    fecha: "20 de diciembre",
    horario: "09:30 – 10:30",
    recorrido: "Av. Antonio José de Sucre → Vicente Ramón Roca → Rocafuerte",
    inicio: "Av. Antonio José de Sucre",
    fin: "Iglesia San Nicolás",
    personaje: "Aya Uma",
    imagen: "/informacion_pases/gotitas-de-dulzura.jpg",
    color: "#C89B3C",
  },
  {
    nombre: "SAFPI",
    tipo: "Institución educativa",
    fecha: "20 de diciembre",
    horario: "12:00 – 13:00",
    recorrido: "Cuba / México → Juan Bernardo de León → La Paz",
    inicio: "Cuba / México",
    fin: "Colegio Cisneros",
    personaje: "Rey Moro",
    imagen: "/informacion_pases/safpi.jpg",
    color: "#B8312F",
  },
  {
    nombre: "Instituto Superior Tecnológico Riobamba",
    tipo: "Institución de educación superior",
    fecha: "20 de diciembre",
    horario: "17:00 – 20:00",
    recorrido: "Carlos Zambrano → Av. Daniel León Borja → 10 de Agosto → Espejo",
    inicio: "Carlos Zambrano",
    fin: "Iglesia La Catedral",
    personaje: "Curiquingue",
    imagen: "/informacion_pases/instituto-tecnologico.jpg",
    color: "#1F4D3F",
  },
  {
    nombre: "Mercado Santa Rosa",
    tipo: "Mercado popular",
    fecha: "20 de diciembre",
    horario: "13:00 – 14:00",
    recorrido: "Carabobo / Villarroel → Rocafuerte → Colombia / Pichincha → García Moreno",
    inicio: "Carabobo / Villarroel",
    fin: "García Moreno",
    personaje: "Payaso",
    imagen: "/informacion_pases/mercado-santa-rosa.jpg",
    color: "#C89B3C",
  },
  {
    nombre: "Unidad Educativa La Salle",
    tipo: "Unidad educativa",
    fecha: "20 de diciembre",
    horario: "15:00 – 18:00",
    recorrido: "Carabobo → Venezuela → España → Argentinos → Espejo → Colón / Nueva York",
    inicio: "España (frente al colegio)",
    fin: "Colón / Nueva York",
    personaje: "Perro",
    imagen: "/informacion_pases/la-salle.jpg",
    color: "#B8312F",
  },
];

export default function MapaPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <header className="mb-12">
        <p className="text-sm uppercase tracking-[0.2em] text-acento-dorado">
          Alcaldía de Riobamba · Chimborazo
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-texto-claro md:text-5xl">
          Mapa de los pases
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-stone-400">
          Recorridos oficiales de los Pases del Niño en Riobamba. Cada institución organiza su
          propio pase con personajes, música y comparsas por las calles del centro histórico.
        </p>

        {/* Día central */}
        <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-acento-dorado/30 bg-acento-dorado/8 px-4 py-2.5">
          <svg className="h-4 w-4 text-acento-dorado" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className="text-sm font-medium text-acento-dorado">
            Miércoles 20 de diciembre · 5 pases durante todo el día
          </span>
        </div>
      </header>

      {/* Timeline del día */}
      <section className="mb-12">
        <h2 className="mb-6 font-serif text-xl font-bold text-texto-claro">Orden del día</h2>
        <div className="relative">
          {/* Línea vertical */}
          <div className="absolute left-[3.5rem] top-0 bottom-0 w-px bg-borde-sutil hidden sm:block" />

          <div className="space-y-3">
            {PASES.sort((a, b) => a.horario.localeCompare(b.horario)).map((pase) => (
              <div key={pase.nombre} className="flex items-start gap-4">
                {/* Hora */}
                <div className="hidden w-24 shrink-0 text-right sm:block">
                  <span className="text-sm font-medium text-acento-dorado">
                    {pase.horario.split("–")[0]?.trim()}
                  </span>
                </div>
                {/* Punto */}
                <div
                  className="relative z-10 mt-1 hidden h-3 w-3 shrink-0 rounded-full sm:block"
                  style={{ backgroundColor: pase.color }}
                />
                {/* Card compacta */}
                <div
                  className="flex-1 rounded-xl border border-borde-sutil bg-stone-900/40 px-4 py-3 transition-colors hover:bg-stone-900/70"
                  style={{ borderLeftWidth: 3, borderLeftColor: pase.color }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-texto-claro text-sm">{pase.nombre}</span>
                    <span className="hidden shrink-0 text-xs text-stone-500 sm:inline">
                      {pase.horario}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {pase.inicio} → {pase.fin} · <span style={{ color: pase.color }}>{pase.personaje}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid de pases con imágenes oficiales */}
      <section>
        <h2 className="mb-6 font-serif text-2xl font-bold text-texto-claro">
          Recorridos oficiales
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PASES.map((pase) => (
            <article
              key={pase.nombre}
              className="group overflow-hidden rounded-2xl border border-borde-sutil bg-stone-900/40 transition-colors hover:border-stone-700"
            >
              {/* Imagen del flyer oficial */}
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={pase.imagen}
                  alt={`Recorrido oficial del Pase del Niño — ${pase.nombre}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Overlay sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />

                {/* Horario arriba derecha */}
                <span
                  className="absolute right-3 top-3 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
                  style={{
                    borderColor: `${pase.color}50`,
                    backgroundColor: `${pase.color}20`,
                    color: pase.color,
                  }}
                >
                  {pase.horario}
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-xs uppercase tracking-wider text-stone-500">{pase.tipo}</p>
                <h3 className="mt-1 font-serif text-lg font-bold text-texto-claro leading-tight">
                  {pase.nombre}
                </h3>

                {/* Recorrido */}
                <div className="mt-3 flex items-start gap-2 text-xs text-stone-400">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span className="leading-relaxed">{pase.recorrido}</span>
                </div>

                {/* Personaje */}
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: pase.color }}
                  />
                  <span className="text-xs" style={{ color: pase.color }}>
                    {pase.personaje}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Nota */}
      <section className="mt-10 rounded-2xl border border-stone-800 bg-stone-900/30 p-5">
        <div className="flex gap-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p className="text-sm text-stone-500">
            Recorridos oficiales emitidos por la Alcaldía de Riobamba para el 20 de diciembre de 2023.
            Las rutas y horarios pueden variar en ediciones futuras.
          </p>
        </div>
      </section>
    </div>
  );
}
