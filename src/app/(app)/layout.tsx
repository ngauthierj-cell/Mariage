import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";

/** Zone connectée : toute page enfant exige une session valide. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-10 pb-12">
      <Suspense fallback={<p className="text-muted" aria-busy="true">Chargement…</p>}>
        <AuthGate>{children}</AuthGate>
      </Suspense>
    </div>
  );
}

async function AuthGate({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
