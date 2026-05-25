import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const directusUrl = process.env.DIRECTUS_URL;
  const token = process.env.DIRECTUS_STATIC_TOKEN;

  const envOk = !!directusUrl && !!token;

  let directusOk = false;
  let personajesCount = 0;
  let directusError = "";

  if (envOk) {
    try {
      const res = await fetch(`${directusUrl}/items/personajes?fields=id&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        directusOk = true;
        personajesCount = data?.data?.length ?? 0;
      } else {
        directusError = `HTTP ${res.status}`;
      }
    } catch (e) {
      directusError = e instanceof Error ? e.message : "fetch failed";
    }
  }

  return NextResponse.json({
    status: envOk && directusOk ? "ok" : "degraded",
    env: {
      DIRECTUS_URL: directusUrl ? directusUrl.replace(/\/\/.*@/, "//***@") : "NOT SET",
      DIRECTUS_STATIC_TOKEN: token ? `${token.slice(0, 4)}…` : "NOT SET",
    },
    directus: {
      reachable: directusOk,
      personajesCount,
      error: directusError || null,
    },
  });
}
