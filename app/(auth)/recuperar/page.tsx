import type { Metadata } from "next";
import { RequestResetForm } from "@/components/password-reset-forms";
import { emailConfigured } from "@/lib/email";

export const metadata: Metadata = { title: "Recuperar contraseña · Vuelvo CRM" };

export default function RecuperarPage() {
  return <RequestResetForm emailEnabled={emailConfigured()} />;
}
