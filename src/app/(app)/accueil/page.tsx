import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, Ornament } from "@/components/ui/card";
import { signOut } from "@/features/auth/actions";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Accueil" };

// Provisoire : deviendra le tableau de bord après l'onboarding (étape 3).
export default async function HomePage() {
  const user = await requireUser();
  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl">Bienvenue</h1>
        <Ornament />
      </header>
      <Card className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Connecté·e en tant que <strong className="text-ink">{user.email ?? "utilisateur"}</strong>.
        </p>
        <form action={signOut}>
          <Button type="submit" variant="secondary" className="w-full">
            Se déconnecter
          </Button>
        </form>
      </Card>
    </main>
  );
}
