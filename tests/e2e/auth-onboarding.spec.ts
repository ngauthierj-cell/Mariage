import { expect, test } from "@playwright/test";
import { loginWithCode, uniqueEmail, waitForEmail } from "./helpers";

test("une page protégée redirige vers la connexion", async ({ page }) => {
  await page.goto("/accueil");
  await expect(page).toHaveURL(/\/connexion\?suite=%2Faccueil$/);
});

test("connexion par code, onboarding complet, puis tableau de bord", async ({ page }) => {
  const email = uniqueEmail("emma");
  await loginWithCode(page, email);

  // Pas encore de mariage : direction l'onboarding.
  await expect(page).toHaveURL(/\/bienvenue$/);
  await expect(page.getByRole("heading", { name: "Vous deux" })).toBeVisible();

  // Étape 1 : prénoms obligatoires (validation avant de continuer)
  await page.getByRole("button", { name: "Commencer" }).click();
  await expect(page.getByRole("heading", { name: "Vous deux" })).toBeVisible();
  await page.getByLabel("Votre prénom").fill("Emma");
  await page.getByLabel("Le prénom de votre moitié").fill("Félix");
  await page.getByRole("button", { name: "Commencer" }).click();

  // Étape 2 : mois approximatif
  await expect(page.getByRole("heading", { name: "La date" })).toBeVisible();
  await page.getByText("Nous connaissons le mois").click();
  await page.getByLabel("Mois", { exact: true }).selectOption({ label: "juin" });
  await page.getByLabel("Année", { exact: true }).selectOption("2028");
  await page.getByRole("button", { name: "Continuer" }).click();

  // Étape 3 : lieu
  await page.getByLabel("Nom du lieu (facultatif)").fill("Domaine des Oliviers");
  await page.getByLabel("Ville (facultatif)").fill("Aix-en-Provence");
  await page.getByRole("button", { name: "Continuer" }).click();

  // Étape 4 : cérémonies (civile cochée par défaut) + laïque
  await expect(page.getByRole("heading", { name: "La cérémonie" })).toBeVisible();
  await page.getByText("Laïque", { exact: true }).click();
  await page.getByRole("button", { name: "Continuer" }).click();

  // Étape 5 : invités et budget
  await page.getByLabel("Nombre d'invités estimé").fill("120");
  await page.getByLabel("Budget global (€)").fill("25 000");
  await page.getByRole("button", { name: "Continuer" }).click();

  // Étape 6 : prestataires
  await page.getByText("Traiteur", { exact: true }).click();
  await page.getByText("Photographe", { exact: true }).click();
  await page.getByRole("button", { name: "Continuer" }).click();

  // Étape 7 : options
  await page.getByText("Voyage de noces").click();
  await page.getByRole("button", { name: "Retour" }).click();
  await expect(page.getByText("Traiteur", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Créer notre espace" }).click();

  // Tableau de bord
  await expect(page).toHaveURL(/\/accueil$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Emma & Félix");
  await expect(page.getByText("Juin 2028", { exact: false })).toBeVisible();
  await expect(page.getByText("Domaine des Oliviers, Aix-en-Provence")).toBeVisible();
  await expect(page.getByText("Civile, Laïque")).toBeVisible();
  await expect(page.getByText("≈ 120")).toBeVisible();
  await expect(page.getByText(/25\s000\s€/)).toBeVisible();

  // L'onboarding n'est plus accessible une fois le mariage créé.
  await page.goto("/bienvenue");
  await expect(page).toHaveURL(/\/accueil$/);

  // Déconnexion
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/connexion$/);
});

test("connexion par le lien de l'e-mail", async ({ page }) => {
  const email = uniqueEmail("lien");
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByRole("button", { name: "Recevoir mon lien" }).click();
  const { html } = await waitForEmail(page, email);
  const href = /href="([^"]*\/auth\/confirm[^"]*)"/.exec(html)?.[1]?.replaceAll("&amp;", "&");
  expect(href).toBeTruthy();
  await page.goto(href!);
  await expect(page).toHaveURL(/\/bienvenue$/);
});

test("un code erroné affiche une erreur", async ({ page }) => {
  const email = uniqueEmail("erreur");
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByRole("button", { name: "Recevoir mon lien" }).click();
  await page.getByLabel("Code reçu par e-mail").fill("000000");
  await page.getByRole("button", { name: "Valider le code" }).click();
  await expect(page.getByText("Ce code a expiré ou est incorrect")).toBeVisible();
});
