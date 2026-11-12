import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Card, Ornament } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

const modules = [
  { title: "Invités & réponses", text: "Foyers, côtés, régimes, et un lien de réponse à partager." },
  { title: "Budget & prestataires", text: "Postes, devis, acomptes et soldes, répartis entre contributeurs." },
  { title: "Rétroplanning", text: "Les bonnes tâches au bon moment, selon votre mariage." },
  { title: "Plan de table", text: "Placez vos invités d'un glisser-déposer." },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-10 px-6 pt-16 pb-12">
      <header className="flex flex-col items-center gap-5 text-center">
        <p className="text-xs font-medium tracking-[0.3em] text-gold-deep uppercase">{APP_NAME}</p>
        <h1 className="text-5xl leading-tight">Organisez votre mariage, à deux.</h1>
        <Ornament />
        <p className="text-base leading-relaxed text-muted">
          Un espace partagé avec votre moitié, synchronisé en temps réel. Gratuit, sans publicité.
        </p>
        {/* La page de connexion arrive à l'étape 2. */}
        <Link href="/connexion" className={buttonClasses("primary", "w-full")}>
          Commencer
        </Link>
      </header>

      <section aria-labelledby="modules" className="flex flex-col gap-4">
        <h2 id="modules" className="text-center text-3xl">
          Tout au même endroit
        </h2>
        {modules.map((m) => (
          <Card key={m.title}>
            <h3 className="text-2xl">{m.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{m.text}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
