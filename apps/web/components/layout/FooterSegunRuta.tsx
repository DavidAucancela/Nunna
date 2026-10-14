"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

// Rutas sin pie de página. `/pases` es una ventana fija: el footer no tiene
// dónde vivir ahí (y al final del recorrido de un pase tampoco se quiere).
const SIN_FOOTER = new Set<string>(["/pases"]);

export function FooterSegunRuta({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return SIN_FOOTER.has(pathname) ? null : <>{children}</>;
}
