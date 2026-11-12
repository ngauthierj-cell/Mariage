import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import { getCurrentWedding, getVendorCategories } from "@/features/wedding/queries";
import { HOME_PATH } from "@/lib/auth/routes";

export const metadata: Metadata = { title: "Créer notre mariage" };

export default async function OnboardingPage() {
  const [wedding, categories] = await Promise.all([getCurrentWedding(), getVendorCategories()]);
  if (wedding) redirect(HOME_PATH);
  return <OnboardingWizard categories={categories} />;
}
