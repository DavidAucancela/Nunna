import { NextResponse } from "next/server";
import personajes from "@/lib/data/personajes.json";
import glosario from "@/lib/data/glosario.json";
import pases from "@/lib/data/pases.json";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    data: {
      personajes: personajes.length,
      glosario: glosario.length,
      pases: pases.length,
    },
  });
}
