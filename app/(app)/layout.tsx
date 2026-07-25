import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  return (
    <AppShell
      businessName={session.business.name}
      rubro={session.business.rubro}
      userEmail={session.email}
    >
      {children}
    </AppShell>
  );
}
