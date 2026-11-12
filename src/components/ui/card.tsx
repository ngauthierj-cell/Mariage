import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-3xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(22,19,15,0.04)]", className)}
      {...props}
    />
  );
}

/** Petit filet doré décoratif sous les titres. */
export function Ornament({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex items-center gap-2 text-gold", className)}>
      <span className="h-px w-10 bg-gold" />
      <span className="text-xs">◆</span>
      <span className="h-px w-10 bg-gold" />
    </span>
  );
}
