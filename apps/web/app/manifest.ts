import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nunna — Seres del Pase del Niño",
    short_name: "Nunna",
    description:
      "Catálogo de los personajes del Pase del Niño riobambeño: historia, leyenda y artesanía detrás de cada imán.",
    start_url: "/es",
    display: "standalone",
    background_color: "#0F0E0C",
    theme_color: "#0F0E0C",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
