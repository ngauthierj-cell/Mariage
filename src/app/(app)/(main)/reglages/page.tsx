import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOut } from "@/features/auth/actions";
import { PartnerInvite } from "@/features/partner/components/partner-invite";
import { getPartnerStatus } from "@/features/partner/queries";
import { requireWedding } from "@/features/wedding/queries";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Réglages" };

export default async function SettingsPage() {
  const [user, wedding] = await Promise.all([requireUser(), requireWedding()]);
  const status = await getPartnerStatus(wedding.id);
  const me = status.members.find((m) => m.userId === user.id);
  const partner = status.members.find((m) => m.userId !== user.id);
  const partnerName = me?.side === "B" ? wedding.partner_a_name : wedding.partner_b_name;

  return (
    <main className="flex flex-col gap-8">
      <h1 className="text-4xl">Réglages</h1>

      <section id="partenaire" aria-labelledby="partenaire-titre" className="flex flex-col gap-3">
        <h2 id="partenaire-titre" className="text-2xl">
          Votre moitié
        </h2>
        <Card>
          {partner ? (
            <p className="text-sm text-muted">
              <strong className="text-ink">{partner.displayName ?? partnerName}</strong> a rejoint votre espace le{" "}
              {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(partner.joinedAt))}. Vous
              partagez les mêmes droits.
            </p>
          ) : (
            <PartnerInvite partnerName={partnerName} activeExpiresAt={status.activeInvitation?.expiresAt ?? null} />
          )}
        </Card>
      </section>

      <section aria-labelledby="compte-titre" className="flex flex-col gap-3">
        <h2 id="compte-titre" className="text-2xl">
          Compte
        </h2>
        <Card className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Connecté·e avec <strong className="text-ink">{user.email ?? "votre compte"}</strong>.
          </p>
          <form action={signOut}>
            <Button type="submit" variant="secondary" className="w-full">
              Se déconnecter
            </Button>
          </form>
        </Card>
      </section>
    </main>
  );
}
