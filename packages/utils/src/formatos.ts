export function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function truncar(texto: string, longitud: number): string {
  if (texto.length <= longitud) return texto;
  return texto.slice(0, longitud).trimEnd() + "…";
}

export function capitalizarPrimera(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
