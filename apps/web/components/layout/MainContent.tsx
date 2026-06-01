"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface MainContentProps {
  children: ReactNode;
  footer: ReactNode;
}

export function MainContent({ children, footer }: MainContentProps) {
  const pathname = usePathname();
  const isHistoria = pathname.endsWith("/historia");

  if (isHistoria) {
    return <main id="main-content">{children}</main>;
  }

  return (
    <>
      <main id="main-content" className="pt-16">
        {children}
      </main>
      {footer}
    </>
  );
}
