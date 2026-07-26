"use client";

import { ReactNode, useState, useTransition } from "react";
import { Loader2, Ban, CheckCircle2 } from "lucide-react";
import { impersonateBusiness, toggleBusinessActive } from "@/app/admin-actions";

export function ImpersonateButton({
  businessId,
  disabled,
  label,
}: {
  businessId: string;
  disabled?: boolean;
  label: ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={disabled || isPending}
      onClick={() => startTransition(() => impersonateBusiness(businessId))}
      className="btn-secondary !py-1.5 text-xs"
      title={disabled ? "Este negocio no tiene un usuario dueño" : "Entrar como este negocio"}
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : label}
    </button>
  );
}

export function ToggleActiveButton({
  businessId,
  active,
}: {
  businessId: string;
  active: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await toggleBusinessActive(businessId, !active);
              setConfirming(false);
            })
          }
          className="btn bg-rose-600 !py-1.5 text-xs text-white hover:bg-rose-700"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="btn-ghost !py-1.5 text-xs"
        >
          Cancelar
        </button>
      </div>
    );
  }

  if (!active) {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => toggleBusinessActive(businessId, true))}
        className="btn-secondary !py-1.5 text-xs"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Reactivar
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="btn-ghost !py-1.5 text-xs text-rose-500 hover:bg-rose-500/10"
    >
      <Ban className="h-3.5 w-3.5" aria-hidden="true" /> Suspender
    </button>
  );
}
