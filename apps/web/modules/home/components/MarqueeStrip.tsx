"use client";

const ITEMS = [
  { es: "Aya Uma",         qu: "Aya Uma" },
  { es: "Diablos de lata", qu: "Supay" },
  { es: "Perro",           qu: "Allku" },
  { es: "Payaso",          qu: "Pukllakuk" },
  { es: "Curiquingue",     qu: "Kuriquingui" },
  { es: "Sacha Runa",      qu: "Sacha Runa" },
  { es: "Rey Moro",        qu: "Muru Inka" },
  { es: "Capitán",         qu: "Kapitán" },
  { es: "Ángel",           qu: "Ángel" },
];

export function MarqueeStrip() {
  return (
    <div className="overflow-hidden border-y border-borde-sutil bg-stone-950 py-3.5 select-none">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          /* Móvil: ventana angosta → más lento para que no se perciba veloz */
          animation: marquee 60s linear infinite;
        }
        /* A partir de tablet la pantalla es más ancha → puede ir más rápido */
        @media (min-width: 768px) {
          .marquee-track { animation-duration: 40s; }
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; transform: translateX(0); }
        }
      `}</style>

      <div className="marquee-track" aria-hidden="true">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span key={i} className="flex items-center gap-4 px-6 whitespace-nowrap">
            <span className="font-serif text-sm font-medium text-stone-400">{item.es}</span>
            <span className="font-serif text-xs italic text-acento-dorado/80">{item.qu}</span>
            <span className="text-xs" style={{ color: "#C89B3C40" }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
