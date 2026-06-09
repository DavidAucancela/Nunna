"use client";

import { useEffect } from "react";

export function ScrollToTop() {
  useEffect(() => {
    // requestAnimationFrame ensures this fires after Next.js completes the navigation paint
    const raf = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}
