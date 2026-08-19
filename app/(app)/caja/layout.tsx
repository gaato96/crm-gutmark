import { requireModule } from "@/lib/module-guard";

export default async function CajaLayout({ children }: { children: React.ReactNode }) {
  await requireModule("caja");
  return <>{children}</>;
}
