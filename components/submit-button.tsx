"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingText,
}: {
  children: ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendingText ?? "Guardando…" : children}
    </button>
  );
}
