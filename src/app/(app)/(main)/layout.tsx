import { AppNav } from "@/components/layout/app-nav";

/** Pages principales de l'espace (avec la barre de navigation). */
export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="pb-24">{children}</div>
      <AppNav />
    </>
  );
}
