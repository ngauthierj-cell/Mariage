import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, Ornament } from "@/components/ui/card";
import { signOut } from "@/features/auth/actions";
import { requireWedding } from "@/features/wedding/queries";
import { countdownLabel, formatWeddingDate, todayInParis } from "@/lib/utils/dates";
import { formatCents } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Accueil" };

const CEREMONY_LABELS = { civile: "Civile", religieuse: "Religieuse", laique: "Laïque" } as const;

const UPCOMING = [
  { title: "Invités & réponses", text: "Ajoutez vos invités par foyer et partagez votre lien de réponse." },
  { title: "Budget & prestataires", text: "Bientôt disponible." },
  { title: "Rétroplanning", text: "Bientôt disponible." },
  { title: "Plan de table", text: "Bientôt disponible." },
];

export default async function HomePage() {
  const wedding = await requireWedding();
  const countdown = countdownLabel(wedding.date_precision, wedding.wedding_date, todayInParis());
  const place = [wedding.venue_name, wedding.venue_city].filter(Boolean).join(", ");

  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <p className="text-xs font-medium tracking-[0.3em] text-gold-deep uppercase">Notre mariage</p>
        <h1 className="text-5xl leading-tight">
          {wedding.partner_a_name} <span className="text-gold-deep">&amp;</span> {wedding.partner_b_name}
        </h1>
        <Ornament />
        <p className="text-base text-ink first-letter:uppercase">
          {formatWeddingDate(wedding.date_precision, wedding.wedding_date)}
        </p>
        {countdown && (
          <p className="rounded-full bg-ink px-4 py-1.5 font-serif text-xl text-gold">{countdown}</p>
        )}
      </header>

      <Card className="grid grid-cols-2 gap-x-4 gap-y-5">
        <Info label="Lieu" value={place || "À définir"} detail={wedding.is_abroad ? "À l'étranger" : undefined} />
        <Info
          label="Cérémonie"
          value={wedding.ceremony_types.map((c) => CEREMONY_LABELS[c]).join(", ") || "À définir"}
        />
        <Info label="Invités" value={wedding.estimated_guests != null ? `≈ ${wedding.estimated_guests}` : "À définir"} />
        <Info
          label="Budget"
          value={wedding.total_budget_cents != null ? formatCents(wedding.total_budget_cents) : "À définir"}
        />
      </Card>

      <section aria-labelledby="modules" className="flex flex-col gap-3">
        <h2 id="modules" className="text-3xl">
          Vos outils
        </h2>
        {UPCOMING.map((m) => (
          <Card key={m.title} className="p-5">
            <h3 className="text-2xl">{m.title}</h3>
            <p className="mt-1 text-sm text-muted">{m.text}</p>
          </Card>
        ))}
      </section>

      <form action={signOut}>
        <Button type="submit" variant="ghost" className="w-full">
          Se déconnecter
        </Button>
      </form>
    </main>
  );
}

function Info({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs tracking-widest text-muted uppercase">{label}</span>
      <span className="text-base text-ink">{value}</span>
      {detail && <span className="text-sm text-muted">{detail}</span>}
    </div>
  );
}
