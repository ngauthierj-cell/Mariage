import { expect, type Page } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

export function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@test.local`;
}

type MailpitMessage = { ID: string; To: Array<{ Address: string }> };

/** Attend l'e-mail de connexion et renvoie son contenu texte (Mailpit de la pile locale). */
export async function waitForEmail(page: Page, to: string): Promise<{ text: string; html: string }> {
  let id: string | undefined;
  await expect
    .poll(
      async () => {
        const res = await page.request.get(`${MAILPIT}/api/v1/messages`);
        const { messages } = (await res.json()) as { messages: MailpitMessage[] };
        id = messages.find((m) => m.To.some((t) => t.Address === to))?.ID;
        return id;
      },
      { timeout: 15_000 },
    )
    .toBeTruthy();
  const res = await page.request.get(`${MAILPIT}/api/v1/message/${id}`);
  const msg = (await res.json()) as { Text: string; HTML: string };
  return { text: msg.Text, html: msg.HTML };
}

/** Connexion complète par code à 6 chiffres. */
export async function loginWithCode(page: Page, email: string): Promise<void> {
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByRole("button", { name: "Recevoir mon lien" }).click();
  await expect(page.getByText(`Un e-mail vient d'être envoyé à ${email}`)).toBeVisible();
  const { text } = await waitForEmail(page, email);
  const code = /\b(\d{6})\b/.exec(text)?.[1];
  expect(code, "code à 6 chiffres présent dans l'e-mail").toBeTruthy();
  await page.getByLabel("Code reçu par e-mail").fill(code!);
  await page.getByRole("button", { name: "Valider le code" }).click();
}
