import { NextResponse } from "next/server";
import personajes from "@/lib/data/personajes.json";
import pases from "@/lib/data/pases.json";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    data: {
      personajes: personajes.length,
      pases: pases.length,
    },
  });
}
