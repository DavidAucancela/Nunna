import type { GlosarioKichwa } from "@seres-del-pase/types";
import glosarioRaw from "../data/glosario.json";

export async function getGlosario(): Promise<GlosarioKichwa[]> {
  return glosarioRaw as GlosarioKichwa[];
}
