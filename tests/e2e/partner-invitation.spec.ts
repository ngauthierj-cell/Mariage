import { expect, test } from "@playwright/test";
import { createMinimalWedding, loginWithCode, loginWithEmailLink, uniqueEmail } from "./helpers";

test("invitation du partenaire : lien à usage unique", async ({ browser }) => {
  // Alice crée son espace et génère un lien.
  const alice = await (await browser.newContext()).newPage();
  await loginWithCode(alice, uniqueEmail("alice"));
  await createMinimalWedding(alice, "Alice", "Bastien");
  await expect(alice.getByRole("heading", { name: "Invitez Bastien" })).toBeVisible();
  await alice.getByRole("link", { name: "Inviter Bastien" }).click();
  await expect(alice).toHaveURL(/\/reglages#partenaire$/);
  await alice.getByRole("button", { name: "Créer un lien d'invitation" }).click();
  const linkInput = alice.getByLabel("Lien d'invitation");
  await expect(linkInput).toHaveValue(/\/rejoindre\/[A-Za-z0-9_-]{43}$/);
  const inviteUrl = await linkInput.inputValue();

  // Bastien ouvre le lien sans être connecté → connexion par le lien e-mail → retour sur l'invitation.
  const bastien = await (await browser.newContext()).newPage();
  await bastien.goto(inviteUrl);
  await expect(bastien).toHaveURL(/\/connexion\?suite=%2Frejoindre%2F/);
  await loginWithEmailLink(bastien, uniqueEmail("bastien"));
  await expect(bastien).toHaveURL(new RegExp(`/rejoindre/`));
  await expect(bastien.getByRole("heading", { level: 1 })).toHaveText("Alice & Bastien");
  await bastien.getByRole("button", { name: "Rejoindre l'espace" }).click();
  await expect(bastien).toHaveURL(/\/accueil$/);
  await expect(bastien.getByRole("heading", { level: 1 })).toHaveText("Alice & Bastien");
  await expect(bastien.getByRole("heading", { name: /Invitez/ })).toHaveCount(0);

  // Côté Alice : Bastien apparaît comme membre, plus de bouton d'invitation.
  await alice.reload();
  await expect(alice.getByText(/a rejoint votre espace le/)).toBeVisible();
  await expect(alice.getByRole("button", { name: /lien d'invitation/ })).toHaveCount(0);

  // Le lien ne fonctionne qu'une fois.
  const chloe = await (await browser.newContext()).newPage();
  await chloe.goto(inviteUrl);
  await loginWithEmailLink(chloe, uniqueEmail("chloe"));
  await expect(chloe.getByRole("heading", { name: "Lien déjà utilisé" })).toBeVisible();
});

test("un lien régénéré désactive l'ancien ; un lien annulé est refusé", async ({ browser }) => {
  const emma = await (await browser.newContext()).newPage();
  await loginWithCode(emma, uniqueEmail("emma"));
  await createMinimalWedding(emma, "Emma", "Félix");
  await emma.goto("/reglages");
  await emma.getByRole("button", { name: "Créer un lien d'invitation" }).click();
  const first = await emma.getByLabel("Lien d'invitation").inputValue();

  // Après rechargement, le lien n'est plus affichable : on en génère un nouveau.
  await emma.reload();
  await expect(emma.getByText(/Une invitation est en cours/)).toBeVisible();
  await emma.getByRole("button", { name: "Générer un nouveau lien" }).click();
  const second = await emma.getByLabel("Lien d'invitation").inputValue();
  expect(second).not.toBe(first);
  await emma.getByRole("button", { name: "Annuler l'invitation" }).click();
  await expect(emma.getByRole("button", { name: "Créer un lien d'invitation" })).toBeVisible();

  const felix = await (await browser.newContext()).newPage();
  await loginWithCode(felix, uniqueEmail("felix"));
  await felix.goto(first);
  await expect(felix.getByRole("heading", { name: "Lien annulé" })).toBeVisible();
  await felix.goto(second);
  await expect(felix.getByRole("heading", { name: "Lien annulé" })).toBeVisible();
  await felix.goto(first.replace(/[A-Za-z0-9_-]{43}$/, "x".repeat(43)));
  await expect(felix.getByRole("heading", { name: "Lien invalide" })).toBeVisible();
});

test("un utilisateur ayant déjà un espace ne peut pas en rejoindre un autre", async ({ browser }) => {
  const gaelle = await (await browser.newContext()).newPage();
  await loginWithCode(gaelle, uniqueEmail("gaelle"));
  await createMinimalWedding(gaelle, "Gaëlle", "Hugo");
  await gaelle.goto("/reglages");
  await gaelle.getByRole("button", { name: "Créer un lien d'invitation" }).click();
  const url = await gaelle.getByLabel("Lien d'invitation").inputValue();

  const ines = await (await browser.newContext()).newPage();
  await loginWithCode(ines, uniqueEmail("ines"));
  await createMinimalWedding(ines, "Inès", "Jules");
  await ines.goto(url);
  await expect(ines.getByRole("heading", { name: "Vous avez déjà un espace" })).toBeVisible();
});
