"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChoiceChip, ChoiceRow } from "@/components/ui/choice";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils/cn";
import type { Tables } from "@/types/database";
import { createWedding, type OnboardingState } from "../actions";
import { FIELD_STEP, STEPS, type Step } from "../schemas";

const STEP_TITLES: Record<Step, { title: string; intro: string }> = {
  couple: { title: "Vous deux", intro: "Commençons par faire connaissance." },
  date: { title: "La date", intro: "Pas de panique si rien n'est encore fixé." },
  lieu: { title: "Le lieu", intro: "Où se déroulera la fête ? Vous pourrez compléter plus tard." },
  ceremonie: {
    title: "La cérémonie",
    intro: "Plusieurs choix possibles. En France, seul le mariage civil a une valeur légale et précède toute cérémonie religieuse.",
  },
  invites: { title: "Invités & budget", intro: "Une estimation suffit, vous l'ajusterez au fil de l'eau." },
  prestataires: { title: "Prestataires", intro: "Lesquels pensez-vous solliciter ? Cela personnalisera votre rétroplanning." },
  options: { title: "Et aussi…", intro: "Cochez ce que vous prévoyez." },
};

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function OnboardingWizard({ categories }: { categories: Tables<"vendor_categories">[] }) {
  const [state, action, pending] = useActionState(createWedding, {} as OnboardingState);
  const [stepIndex, setStepIndex] = useState(0);
  const [precision, setPrecision] = useState<"day" | "month" | "unknown">("day");
  const [today] = useState(localToday);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(today.slice(0, 4));
  const formRef = useRef<HTMLFormElement>(null);
  const [handledState, setHandledState] = useState(state);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const errors = state.errors ?? {};
  const currentYear = Number(today.slice(0, 4));

  // Nouvelle réponse serveur avec erreurs : revenir à la première étape concernée
  // (mise à jour pendant le rendu, motif recommandé par React plutôt qu'un effet).
  if (state !== handledState) {
    setHandledState(state);
    const fields = Object.keys(state.errors ?? {});
    if (fields.length > 0) {
      setStepIndex(Math.min(...fields.map((f) => STEPS.indexOf(FIELD_STEP[f] ?? "couple"))));
    }
  }

  // Accessibilité : focus sur le titre à chaque changement d'étape.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [stepIndex]);

  function goNext() {
    const fieldset = formRef.current?.querySelector(`fieldset[data-step="${step}"]`);
    const inputs = fieldset ? Array.from(fieldset.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select")) : [];
    if (!inputs.every((el) => el.reportValidity())) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  const stepProps = (s: Step) => ({
    "data-step": s,
    hidden: s !== step,
    className: "flex flex-col gap-4",
  });

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      className="flex flex-1 flex-col gap-8"
      onKeyDown={(e) => {
        // Entrée dans un champ = « Continuer » (sauf à la dernière étape).
        if (e.key === "Enter" && !isLast && e.target instanceof HTMLInputElement) {
          e.preventDefault();
          goNext();
        }
      }}
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium tracking-[0.2em] text-gold-deep uppercase">
          Étape {stepIndex + 1} sur {STEPS.length}
        </p>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label="Progression"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={stepIndex + 1}
        >
          <div className="h-full bg-gold transition-all" style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
        </div>
        <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-4xl outline-none">
          {STEP_TITLES[step].title}
        </h1>
        <p className="text-muted">{STEP_TITLES[step].intro}</p>
      </div>

      {/* 1. Le couple */}
      <fieldset {...stepProps("couple")}>
        <legend className="sr-only">Vos prénoms</legend>
        <Field label="Votre prénom" name="partner_a_name" autoComplete="given-name" required maxLength={60} error={errors.partner_a_name} />
        <Field label="Le prénom de votre moitié" name="partner_b_name" autoComplete="off" required maxLength={60} error={errors.partner_b_name} />
      </fieldset>

      {/* 2. La date */}
      <fieldset {...stepProps("date")}>
        <legend className="sr-only">Date du mariage</legend>
        <ChoiceRow type="radio" name="date_precision" value="day" label="Nous avons la date" checked={precision === "day"} onChange={() => setPrecision("day")} />
        <ChoiceRow type="radio" name="date_precision" value="month" label="Nous connaissons le mois" checked={precision === "month"} onChange={() => setPrecision("month")} />
        <ChoiceRow type="radio" name="date_precision" value="unknown" label="Pas encore décidé" checked={precision === "unknown"} onChange={() => setPrecision("unknown")} />

        <div hidden={precision !== "day"} className="pt-2">
          <Field label="Date du mariage" name="wedding_date" type="date" min={today} required={precision === "day"} error={errors.wedding_date} />
        </div>
        <div hidden={precision !== "month"} className="flex flex-col gap-1.5 pt-2">
          <input type="hidden" name="wedding_month" value={month && year ? `${year}-${month}` : ""} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Mois" value={month} onChange={setMonth} required={precision === "month"}>
              <option value="">Choisir…</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, "0")}>
                  {m}
                </option>
              ))}
            </Select>
            <Select label="Année" value={year} onChange={setYear} required={precision === "month"}>
              {Array.from({ length: 6 }, (_, i) => String(currentYear + i)).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
          {errors.wedding_month && (
            <p className="text-sm text-danger" role="alert">
              {errors.wedding_month}
            </p>
          )}
        </div>
      </fieldset>

      {/* 3. Le lieu */}
      <fieldset {...stepProps("lieu")}>
        <legend className="sr-only">Lieu de réception</legend>
        <Field label="Nom du lieu (facultatif)" name="venue_name" maxLength={120} error={errors.venue_name} />
        <Field label="Ville (facultatif)" name="venue_city" autoComplete="address-level2" maxLength={120} error={errors.venue_city} />
        <div className="flex flex-wrap gap-2 pt-1" role="radiogroup" aria-label="Pays">
          <ChoiceChip type="radio" name="location" value="france" defaultChecked>
            En France
          </ChoiceChip>
          <ChoiceChip type="radio" name="location" value="abroad">
            À l&apos;étranger
          </ChoiceChip>
        </div>
      </fieldset>

      {/* 4. La cérémonie */}
      <fieldset {...stepProps("ceremonie")}>
        <legend className="sr-only">Type de cérémonie</legend>
        <ChoiceRow name="ceremony_types" value="civile" label="Civile" description="À la mairie" defaultChecked />
        <ChoiceRow name="ceremony_types" value="religieuse" label="Religieuse" description="Église, temple, synagogue, mosquée…" />
        <ChoiceRow name="ceremony_types" value="laique" label="Laïque" description="Une cérémonie personnalisée, sur le lieu de réception par exemple" />
      </fieldset>

      {/* 5. Invités et budget */}
      <fieldset {...stepProps("invites")}>
        <legend className="sr-only">Invités et budget</legend>
        <Field label="Nombre d'invités estimé" name="estimated_guests" inputMode="numeric" pattern="[0-9]*" placeholder="ex. 100" error={errors.estimated_guests} />
        <Field label="Budget global (€)" name="total_budget" inputMode="decimal" placeholder="ex. 20 000" hint="Montant total que vous envisagez, toutes dépenses comprises." error={errors.total_budget} />
      </fieldset>

      {/* 6. Prestataires */}
      <fieldset {...stepProps("prestataires")}>
        <legend className="sr-only">Prestataires prévus</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <ChoiceChip key={c.code} name="vendor_codes" value={c.code}>
              {c.label}
            </ChoiceChip>
          ))}
        </div>
      </fieldset>

      {/* 7. Options */}
      <fieldset {...stepProps("options")}>
        <legend className="sr-only">Options</legend>
        <ChoiceRow name="has_bachelor_parties" label="EVJF / EVG" description="Enterrements de vie de jeune fille ou de garçon" />
        <ChoiceRow name="has_stationery" label="Faire-part" description="Save the date, faire-part, menus…" />
        <ChoiceRow name="has_registry" label="Liste de mariage" />
        <ChoiceRow name="has_honeymoon" label="Voyage de noces" />
      </fieldset>

      {state.formError && (
        <p role="alert" className="rounded-2xl border border-danger/30 bg-surface p-4 text-sm text-danger">
          {state.formError}
        </p>
      )}

      <div className="sticky bottom-0 mt-auto flex gap-3 bg-ivory/95 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        {stepIndex > 0 && (
          <Button variant="secondary" onClick={() => setStepIndex((i) => i - 1)} disabled={pending}>
            Retour
          </Button>
        )}
        {/* Clés distinctes : sans elles, React réutiliserait le même <button> et le passerait
            en type="submit" pendant le clic sur « Continuer », soumettant le formulaire trop tôt. */}
        {isLast ? (
          <Button key="submit" type="submit" className="flex-1" disabled={pending}>
            {pending ? "Création…" : "Créer notre espace"}
          </Button>
        ) : (
          <Button key="next" className="flex-1" onClick={goNext}>
            {stepIndex === 0 ? "Commencer" : "Continuer"}
          </Button>
        )}
      </div>
    </form>
  );
}

function Select({
  label,
  value,
  onChange,
  required,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={cn("min-h-touch rounded-xl border border-field bg-surface px-3 text-base font-normal text-ink")}
      >
        {children}
      </select>
    </div>
  );
}
