import { getOrigenStyle } from "@/lib/origen-styles";

interface OrigenPlaceholderProps {
  origen: string | undefined;
  nombre?: string;
  className?: string;
  /** "hero" = pantalla completa, "card" = compacto */
  variant?: "hero" | "card";
  /** Sufijo único para los IDs de SVG — obligatorio cuando hay múltiples instancias en la misma página */
  uid?: string;
}

function ChakanaPattern({ color, uid }: { color: string; uid: string }) {
  const id = `chakana-${uid}`;
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 h-full w-full animate-spin-slow"
        style={{ opacity: 0.35, transformOrigin: "center" }}
        aria-hidden="true"
      >
        <defs>
          <pattern id={id} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect x="20" y="0"  width="20" height="20" fill={color} />
            <rect x="0"  y="20" width="60" height="20" fill={color} />
            <rect x="20" y="40" width="20" height="20" fill={color} />
            <rect x="22" y="2"  width="16" height="16" fill="none" stroke={color} strokeWidth="1.5" />
            <rect x="2"  y="22" width="16" height="16" fill="none" stroke={color} strokeWidth="1.5" />
            <rect x="42" y="22" width="16" height="16" fill="none" stroke={color} strokeWidth="1.5" />
            <rect x="22" y="42" width="16" height="16" fill="none" stroke={color} strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}

function EspiralPattern({ color, uid }: { color: string; uid: string }) {
  const id = `espiral-${uid}`;
  return (
    <svg
      viewBox="0 0 200 200"
      className="absolute inset-0 h-full w-full"
      style={{ opacity: 0.38 }}
      aria-hidden="true"
    >
      <defs>
        <pattern id={id} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <circle cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="1.5" />
          <circle cx="40" cy="40" r="22" fill="none" stroke={color} strokeWidth="1.2" />
          <circle cx="40" cy="40" r="12" fill="none" stroke={color} strokeWidth="1" />
          <circle cx="40" cy="40" r="4"  fill={color} fillOpacity="0.5" />
          <line x1="40" y1="8"  x2="40" y2="72" stroke={color} strokeWidth="0.5" strokeDasharray="2 4" />
          <line x1="8"  y1="40" x2="72" y2="40" stroke={color} strokeWidth="0.5" strokeDasharray="2 4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

function RomboPattern({ color, uid }: { color: string; uid: string }) {
  const id = `rombo-${uid}`;
  return (
    <svg
      viewBox="0 0 200 200"
      className="absolute inset-0 h-full w-full"
      style={{ opacity: 0.38 }}
      aria-hidden="true"
    >
      <defs>
        <pattern id={id} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <polygon points="20,2 38,20 20,38 2,20"  fill="none" stroke={color} strokeWidth="1.5" />
          <polygon points="20,10 30,20 20,30 10,20" fill={color} fillOpacity="0.45" />
          <circle cx="20" cy="20" r="1.5" fill={color} fillOpacity="0.7" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

function CentralGlyph({ color, variant }: { color: string; variant: "hero" | "card" }) {
  const size = variant === "hero" ? 64 : 36;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        style={{ opacity: 0.55 }}
      >
        {/* Cruz andina simplificada */}
        <rect x="28" y="4"  width="8" height="56" rx="1" fill={color} />
        <rect x="4"  y="28" width="56" height="8" rx="1" fill={color} />
        <rect x="24" y="24" width="16" height="16" rx="2" fill={color} fillOpacity="0.4" />
      </svg>
    </div>
  );
}

export function OrigenPlaceholder({
  origen,
  nombre,
  className = "",
  variant = "hero",
  uid,
}: OrigenPlaceholderProps) {
  const style = getOrigenStyle(origen);
  // uid único para evitar conflicto de IDs de SVG cuando hay múltiples instancias en la misma página
  const safeUid = uid ?? (nombre ? nombre.toLowerCase().replace(/[^a-z0-9]/g, "") : origen ?? "default");

  const Pattern =
    style.patternId === "chakana"
      ? ChakanaPattern
      : style.patternId === "espiral"
        ? EspiralPattern
        : RomboPattern;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(ellipse at 40% 35%, ${style.bgFrom} 0%, ${style.bgVia} 55%, #080705 100%)`,
      }}
    >
      {/* Orb central — glow pulsante */}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div
          className="animate-pulse-slow rounded-full"
          style={{
            width: variant === "hero" ? "60%" : "80%",
            height: variant === "hero" ? "60%" : "80%",
            backgroundColor: style.accentColor,
            opacity: 0.18,
            filter: "blur(50px)",
          }}
        />
      </div>

      {/* Segundo orb desplazado para profundidad */}
      <div className="absolute inset-0" aria-hidden="true">
        <div
          className="absolute"
          style={{
            top: "20%",
            right: "10%",
            width: "40%",
            height: "40%",
            backgroundColor: style.bgFrom,
            opacity: 0.35,
            filter: "blur(40px)",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* Patrón geométrico andino */}
      <Pattern color={style.accentColor} uid={safeUid} />

      {/* Símbolo central */}
      <CentralGlyph color={style.accentColor} variant={variant} />

      {/* Nombre como marca de agua — solo hero */}
      {variant === "hero" && nombre && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <p
            className="font-serif font-bold uppercase tracking-widest text-center px-6"
            style={{
              fontSize: "clamp(3rem, 15vw, 12rem)",
              color: style.accentColor,
              opacity: 0.07,
              lineHeight: 1,
            }}
            aria-hidden="true"
          >
            {nombre}
          </p>
        </div>
      )}
    </div>
  );
}
