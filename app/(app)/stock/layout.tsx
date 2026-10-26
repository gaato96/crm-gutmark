import { requireModule } from "@/lib/module-guard";

export default async function StockLayout({ children }: { children: React.ReactNode }) {
  await requireModule("stock");
  return <>{children}</>;
}
