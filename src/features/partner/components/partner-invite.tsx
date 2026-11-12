"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createInvitation, revokeInvitation } from "../actions";

const dateFr = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );

/** Création, partage et annulation du lien d'invitation du/de la partenaire. */
export function PartnerInvite({
  partnerName,
  activeExpiresAt,
}: {
  partnerName: string;
  activeExpiresAt: string | null;
}) {
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  // Menu de partage natif : absent côté serveur, d'où useSyncExternalStore (pas d'écart d'hydratation).
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false,
  );

  function generate() {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const res = await createInvitation();
      if (res.ok) setLink({ url: res.url, expiresAt: res.expiresAt });
      else setError(res.error);
    });
  }

  function revoke() {
    startTransition(async () => {
      await revokeInvitation();
      setLink(null);
    });
  }

  async function share() {
    if (!link) return;
    try {
      await navigator.share({
        title: "Rejoins notre espace mariage",
        text: `Rejoins-moi pour organiser notre mariage à deux :`,
        url: link.url,
      });
    } catch {
      /* partage annulé */
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
    } catch {
      setError("Copie impossible : sélectionnez le lien et copiez-le manuellement.");
    }
  }

  if (link) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Envoyez ce lien à {partnerName}. Il ne fonctionne qu&apos;une fois, jusqu&apos;au {dateFr(link.expiresAt)}.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Lien d&apos;invitation</span>
          <input
            readOnly
            value={link.url}
            onFocus={(e) => e.currentTarget.select()}
            className="min-h-touch rounded-xl border border-field bg-champagne/40 px-4 text-sm text-ink"
          />
        </label>
        <div className="flex flex-col gap-2">
          {canShare && <Button onClick={share}>Partager le lien</Button>}
          <Button variant={canShare ? "secondary" : "primary"} onClick={copy}>
            {copied ? "Lien copié ✓" : "Copier le lien"}
          </Button>
          <Button variant="ghost" onClick={revoke} disabled={pending}>
            Annuler l&apos;invitation
          </Button>
        </div>
        <p className="sr-only" role="status">
          {copied ? "Lien copié dans le presse-papiers" : ""}
        </p>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {activeExpiresAt ? (
        <p className="text-sm text-muted">
          Une invitation est en cours jusqu&apos;au {dateFr(activeExpiresAt)}. Par sécurité, le lien ne peut pas être
          réaffiché : générez-en un nouveau si besoin (l&apos;ancien sera désactivé).
        </p>
      ) : (
        <p className="text-sm text-muted">
          Invitez {partnerName} à rejoindre votre espace : vous aurez tous les deux les mêmes droits et verrez les
          modifications de l&apos;autre en temps réel.
        </p>
      )}
      <Button onClick={generate} disabled={pending}>
        {pending ? "Création…" : activeExpiresAt ? "Générer un nouveau lien" : "Créer un lien d'invitation"}
      </Button>
      {activeExpiresAt && (
        <Button variant="ghost" onClick={revoke} disabled={pending}>
          Annuler l&apos;invitation
        </Button>
      )}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
