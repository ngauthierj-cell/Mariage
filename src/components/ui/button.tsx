import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-ivory hover:bg-ink/90",
  secondary: "border border-ink bg-transparent text-ink hover:bg-champagne",
  ghost: "bg-transparent text-gold-deep underline-offset-4 hover:underline",
};

export function buttonClasses(variant: Variant = "primary", className?: string) {
  return cn(
    "inline-flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-full px-6",
    "text-sm font-medium tracking-wide transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
