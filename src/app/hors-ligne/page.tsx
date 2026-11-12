import type { Metadata } from "next";
import { Ornament } from "@/components/ui/card";

export const metadata: Metadata = { title: "Hors ligne" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl">Vous êtes hors ligne</h1>
      <Ornament />
      <p className="text-muted">
        Vérifiez votre connexion internet. Vos données seront à nouveau disponibles dès le retour du
        réseau.
      </p>
    </main>
  );
}
