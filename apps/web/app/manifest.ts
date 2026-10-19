import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nunna — Personajes de las fiestas del Ecuador",
    short_name: "Nunna",
    description:
      "Catálogo de los personajes de las fiestas populares del Ecuador: historia, leyenda y artesanía detrás de cada imán.",
    start_url: "/es",
    display: "standalone",
    background_color: "#0F0E0C",
    theme_color: "#0F0E0C",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
