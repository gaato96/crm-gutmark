import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (session) redirect("/dashboard");

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-800 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-600/40 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-bold">GUTMARK</div>
            <div className="text-xs text-brand-100">Fideliza</div>
          </div>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">
            Vendé más sin conseguir
            <br />
            un solo cliente nuevo.
          </h2>
          <p className="mt-4 max-w-md text-brand-100">
            Conocé, cuidá y hacé volver a tus clientes. Cumpleaños, recompra, segmentación y
            campañas, todo en un solo lugar.
          </p>
        </div>
        <div className="relative text-sm text-brand-200">
          © {new Date().getFullYear()} GUTMARK · Fidelización para PYMES
        </div>
      </div>

      {/* Formulario */}
      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
