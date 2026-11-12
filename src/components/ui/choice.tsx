import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { type?: "checkbox" | "radio" };

/** Pastille sélectionnable (case à cocher ou bouton radio natif, accessible au clavier). */
export function ChoiceChip({ children, className, type = "checkbox", ...props }: InputProps & { children: ReactNode }) {
  return (
    <label className={cn("relative inline-flex cursor-pointer", className)}>
      <input type={type} className="peer sr-only" {...props} />
      <span
        className={cn(
          "inline-flex min-h-touch items-center gap-2 rounded-full border border-field bg-surface px-4 text-sm text-ink transition-colors",
          "peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-deep",
        )}
      >
        {children}
      </span>
    </label>
  );
}

/** Ligne pleine largeur avec intitulé et description (radio ou interrupteur). */
export function ChoiceRow({
  label,
  description,
  type = "checkbox",
  className,
  ...props
}: InputProps & { label: string; description?: string }) {
  return (
    <label
      className={cn(
        "flex min-h-touch cursor-pointer items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-3",
        "has-[:checked]:border-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-deep",
        className,
      )}
    >
      <input type={type} className="peer sr-only" {...props} />
      <span className="flex flex-1 flex-col">
        <span className="text-base text-ink">{label}</span>
        {description && <span className="text-sm text-muted">{description}</span>}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 shrink-0 items-center justify-center border border-field text-transparent",
          type === "radio" ? "rounded-full" : "rounded-md",
          "peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory",
        )}
      >
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 8.5 6.5 12 13 4.5" />
        </svg>
      </span>
    </label>
  );
}
