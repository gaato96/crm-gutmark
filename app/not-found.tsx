import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center animate-fade-in">
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-surface-2 text-ink-faint">
          <SearchX className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-ink">No encontramos esta página</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Puede que el cliente o la sección ya no existan.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
