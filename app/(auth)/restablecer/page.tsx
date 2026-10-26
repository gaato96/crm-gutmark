import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/password-reset-forms";
import { findValidReset } from "@/lib/password-reset";

export const metadata: Metadata = {
  title: "Contraseña nueva · Vuelvo CRM",
  // El token viaja en la URL: que no quede indexado ni se filtre por Referer.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

export default async function RestablecerPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const reset = await findValidReset(token);

  if (!reset) {
    return (
      <div>
        <h1 className="font-display text-3xl text-ink">El link ya no sirve</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Venció o ya se usó. Los links duran una hora y sirven una sola vez.
        </p>
        <Link href="/recuperar" className="btn-primary mt-6 w-full">
          Pedir uno nuevo
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} email={reset.user.email} />;
}
