"use client";

import { useEffect, useState } from "react";
import { IconoWhatsApp } from "./IconoWhatsApp";

interface WhatsAppShareProps {
  nombre: string;
}

export function WhatsAppShare({ nombre }: WhatsAppShareProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const message = encodeURIComponent(
    `Descubrí a ${nombre} en Nunna 🎭\n\n${url}`
  );
  const waUrl = `https://wa.me/?text=${message}`;

  if (!url) return null;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-stone-700 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-300 transition-colors hover:border-green-700 hover:bg-green-950/40 hover:text-green-400"
    >
      <IconoWhatsApp className="h-4 w-4" />
      Compartir este personaje
    </a>
  );
}
