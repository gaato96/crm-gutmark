import { requireModule } from "@/lib/module-guard";

export default async function PuntosLayout({ children }: { children: React.ReactNode }) {
  await requireModule("puntos");
  return <>{children}</>;
}
