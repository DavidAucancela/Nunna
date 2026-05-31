"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  label: string;
  suffix?: string;
}

export function AnimatedCounter({ value, label, suffix = "" }: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1">
      <span className="font-serif text-4xl font-bold text-texto-claro sm:text-5xl">
        {count}
        {suffix}
      </span>
      <span className="text-xs uppercase tracking-widest text-stone-500">{label}</span>
    </div>
  );
}
