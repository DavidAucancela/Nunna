import * as React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "kichwa" | "origen";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-stone-800 text-stone-200 border border-stone-700",
    kichwa: "bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 italic",
    origen: "bg-amber-900/30 text-amber-300 border border-amber-800/40",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
