"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { acceptInvitation, type AcceptState } from "../actions";

export function AcceptInvitation({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInvitation, {} as AcceptState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <Button type="submit" disabled={pending}>
        {pending ? "Un instant…" : "Rejoindre l'espace"}
      </Button>
      {state.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
