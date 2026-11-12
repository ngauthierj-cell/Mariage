import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { Card, Ornament } from "@/components/ui/card";
import { AcceptInvitation } from "@/features/partner/components/accept-invitation";
import { HOME_PATH } from "@/lib/auth/routes";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Invitation", referrer: "no-referrer" };

const MESSAGES: Record<string, { title: string; text: string }> = {
  invalid: { title: "Lien invalide", text: "Ce lien d'invitation n'existe pas. Vérifiez qu'il a été copié en entier." },
  used: { title: "Lien déjà utilisé", text: "Ce lien a déjà servi. Demandez un nouveau lien à votre moitié." },
  revoked: { title: "Lien annulé", text: "Cette invitation a été annulée. Demandez un nouveau lien à votre moitié." },
  expired: { title: "Lien expiré", text: "Les liens d'invitation sont valables 7 jours. Demandez-en un nouveau à votre moitié." },
  full: { title: "Espace complet", text: "Cet espace compte déjà deux membres." },
  already_member: {
    title: "Vous avez déjà un espace",
    text: "Votre compte est déjà rattaché à un mariage. Pour rejoindre celui-ci, connectez-vous avec une autre adresse, ou supprimez d'abord votre espace actuel depuis les réglages.",
  },
};

export default async function JoinPage({ params }: PageProps<"/rejoindre/[token]">) {
  await requireUser();
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("preview_partner_invitation", { p_token: token });
  const preview = data?.[0];
  const status = preview?.status ?? "invalid";
  if (status === "own") redirect(HOME_PATH);

  return (
    <main className="flex flex-col gap-8 pt-6">
      <header className="flex flex-col items-center gap-4 text-center">
        <p className="text-xs font-medium tracking-[0.3em] text-gold-deep uppercase">Invitation</p>
        {status === "valid" && preview ? (
          <>
            <h1 className="text-4xl leading-tight">
              {preview.partner_a_name} <span className="text-gold-deep">&amp;</span> {preview.partner_b_name}
            </h1>
            <Ornament />
            <p className="text-muted">
              Vous êtes invité·e à rejoindre cet espace pour organiser le mariage à deux, avec les mêmes droits.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl">{MESSAGES[status]?.title ?? MESSAGES.invalid.title}</h1>
            <Ornament />
          </>
        )}
      </header>

      <Card className="flex flex-col gap-4">
        {status === "valid" ? (
          <AcceptInvitation token={token} />
        ) : (
          <>
            <p className="text-sm text-muted">{MESSAGES[status]?.text ?? MESSAGES.invalid.text}</p>
            <Link href={HOME_PATH} className={buttonClasses("secondary")}>
              Retour à l&apos;accueil
            </Link>
          </>
        )}
      </Card>
    </main>
  );
}
