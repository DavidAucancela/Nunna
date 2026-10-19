/**
 * Isotipo de Nunna (2026-10-15): la N trazada como el recorrido de un pase en tres tramos
 * (rojo · dorado · jade) dentro de una placa oscura con filete dorado — el marco de la tarjeta.
 * Mismo dibujo que `public/favicon.svg`; si cambias uno, cambia el otro.
 */
export function NunnaIsotipo({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="64" height="64" rx="14" fill="#0F0E0C" />
      <rect x="2" y="2" width="60" height="60" rx="12" fill="none" stroke="#C89B3C" strokeWidth="2" />
      <g fill="none" strokeWidth="6.5" strokeLinecap="round">
        <path d="M14 52C14 31 17 14 23 14" stroke="#B8312F" />
        <path d="M23 14c6 0 9 38 18 38" stroke="#C89B3C" />
        <path d="M41 52c7 0 9-26 9-38" stroke="#2F7A63" />
      </g>
    </svg>
  );
}
