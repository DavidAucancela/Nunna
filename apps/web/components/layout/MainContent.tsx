import type { ReactNode } from "react";

interface MainContentProps {
  children: ReactNode;
  footer: ReactNode;
}

export function MainContent({ children, footer }: MainContentProps) {
  return (
    <>
      <main id="main-content" className="pt-16">
        {children}
      </main>
      {footer}
    </>
  );
}
