"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

interface ColeccionCounterProps {
  slug: string;
  nombre: string;
}

export function ColeccionCounter({ slug, nombre }: ColeccionCounterProps) {
  const [count, setCount] = useState<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    void supabase
      .rpc("count_collectors", { p_slug: slug })
      .then(({ data, error }) => {
        if (!mountedRef.current || error) return;
        if (typeof data === "number" && data > 0) setCount(data);
      });
  }, [slug]);

  if (count === null) return null;

  return (
    <p className="mt-4 text-xs text-stone-600">
      <span className="mr-1.5 text-stone-700">✦</span>
      <span className="tabular-nums text-stone-500">{count.toLocaleString("es-EC")}</span>{" "}
      {count === 1
        ? `persona tiene a ${nombre} en su colección`
        : `personas tienen a ${nombre} en su colección`}
    </p>
  );
}
