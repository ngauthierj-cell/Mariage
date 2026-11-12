import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Ornament } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 pt-16 pb-12">
      <header className="flex flex-col items-center gap-4 text-center">
        <Link href="/" className="text-xs font-medium tracking-[0.3em] text-gold-deep uppercase">
          {APP_NAME}
        </Link>
        <h1 className="text-4xl">Connexion</h1>
        <Ornament />
        <p className="text-muted">Connectez-vous pour retrouver votre mariage, ou créez votre espace en un instant.</p>
      </header>
      <Suspense fallback={<div className="h-64" aria-busy="true" />}>
        <LoginForm />
      </Suspense>
      <p className="text-center text-xs leading-relaxed text-muted">
        En continuant, vous acceptez que vos données servent uniquement à l&apos;organisation de votre mariage.
        Ni publicité, ni revente.
      </p>
    </main>
  );
}
