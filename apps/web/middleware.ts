import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Firmas de escáneres automatizados de vulnerabilidades (WordPress, xmlrpc, etc.)
// — nunca coinciden con rutas reales de este sitio. Se cortan acá con un 404
// directo para no gastar RAM/CPU de Railway en tráfico de escaneo puro (ver
// revisión de costo 2026-07-21: un bot pegaba cada ~250ms desde una sola IP).
const SCANNER_PATTERN = /wp-(admin|login|content|includes|json)|xmlrpc\.php|wlwmanifest\.xml/i;

export default function middleware(request: NextRequest) {
  if (SCANNER_PATTERN.test(request.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404 });
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next|_vercel|api|.*\\..*).*)",
    "/(.*(?:wp-admin|wp-login|wp-content|wp-includes|wp-json|xmlrpc\\.php|wlwmanifest\\.xml).*)",
  ],
};
