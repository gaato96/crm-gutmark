import Link from "next/link";
import { Cake, RotateCcw, HeartHandshake, PartyPopper, Send } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentBusiness, getEnrichedCustomers, toConfig } from "@/lib/queries";
import { buildMessage } from "@/lib/build-message";
import { PageHeader, SectionTitle } from "@/components/ui";
import { ReminderCard } from "@/components/reminder-card";

export const dynamic = "force-dynamic";

export default async function RecordatoriosPage() {
  const biz = await getCurrentBusiness();
  const cfg = toConfig(biz);
  const customers = await getEnrichedCustomers(biz.id, cfg);
  const templates = await db.template.findMany({ where: { businessId: biz.id } });

  const birthdays = customers
    .filter((c) => c.birthdayInDays !== null && c.birthdayInDays <= 7)
    .sort((a, b) => (a.birthdayInDays ?? 99) - (b.birthdayInDays ?? 99));

  const recompra = customers
    .filter((c) => c.needsWinback && c.segment !== "inactivo")
    .sort((a, b) => (b.daysSinceLast ?? 0) - (a.daysSinceLast ?? 0));

  const reactivar = customers
    .filter((c) => c.segment === "inactivo")
    .sort((a, b) => (b.daysSinceLast ?? 0) - (a.daysSinceLast ?? 0));

  const total = birthdays.length + recompra.length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Recordatorios"
        subtitle={
          total > 0
            ? `Tenés ${total} oportunidades para contactar clientes hoy.`
            : "Estás al día. No hay acciones urgentes."
        }
        action={
          <Link href="/campanas" className="btn-secondary">
            <Send className="h-4 w-4" /> Ir a campañas
          </Link>
        }
      />

      {total === 0 && reactivar.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
            <PartyPopper className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-ink">¡Todo bajo control!</h3>
          <p className="mt-1 max-w-sm text-sm text-ink-muted">
            No hay cumpleaños ni recompras pendientes por ahora. Volvé mañana para ver nuevas
            oportunidades.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Cumpleaños */}
          <section>
            <SectionHeader
              icon={<Cake className="h-4 w-4" />}
              tone="accent"
              title="Cumpleaños esta semana"
              count={birthdays.length}
            />
            {birthdays.length === 0 ? (
              <EmptyRow text="No hay cumpleaños en los próximos 7 días." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {birthdays.map((c) => {
                  const msg = buildMessage("birthday", c.name, biz.name, templates);
                  return (
                    <ReminderCard
                      key={c.id}
                      id={c.id}
                      name={c.name}
                      phone={c.phone}
                      email={c.email}
                      reason="birthday"
                      hint={
                        c.birthdayInDays === 0
                          ? "¡Hoy! 🎉"
                          : c.birthdayInDays === 1
                          ? "Mañana"
                          : `En ${c.birthdayInDays} días`
                      }
                      {...msg}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Recompra */}
          <section>
            <SectionHeader
              icon={<RotateCcw className="h-4 w-4" />}
              tone="brand"
              title="Hora de que vuelvan"
              count={recompra.length}
            />
            {recompra.length === 0 ? (
              <EmptyRow text="Ningún cliente pasó el tiempo esperado de recompra." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recompra.map((c) => {
                  const msg = buildMessage("winback", c.name, biz.name, templates);
                  return (
                    <ReminderCard
                      key={c.id}
                      id={c.id}
                      name={c.name}
                      phone={c.phone}
                      email={c.email}
                      reason="winback"
                      hint={`Hace ${c.daysSinceLast} días`}
                      {...msg}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Reactivar inactivos */}
          {reactivar.length > 0 && (
            <section>
              <SectionHeader
                icon={<HeartHandshake className="h-4 w-4" />}
                tone="slate"
                title="Reactivar inactivos"
                count={reactivar.length}
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {reactivar.slice(0, 6).map((c) => {
                  const msg = buildMessage("winback", c.name, biz.name, templates);
                  return (
                    <ReminderCard
                      key={c.id}
                      id={c.id}
                      name={c.name}
                      phone={c.phone}
                      email={c.email}
                      reason="winback"
                      hint={`Hace ${c.daysSinceLast} días`}
                      {...msg}
                    />
                  );
                })}
              </div>
              {reactivar.length > 6 && (
                <p className="mt-3 text-center text-sm text-ink-muted">
                  Y {reactivar.length - 6} clientes inactivos más.{" "}
                  <Link href="/segmentos?s=inactivo" className="font-medium text-brand-600">
                    Ver todos
                  </Link>
                </p>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  icon,
  tone,
  title,
  count,
}: {
  icon: React.ReactNode;
  tone: "accent" | "brand" | "slate";
  title: string;
  count: number;
}) {
  const tones = {
    accent: "bg-accent-500/10 text-accent-600",
    brand: "bg-brand-500/10 text-brand-600",
    slate: "bg-surface-2 text-ink-muted",
  };
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${tones[tone]}`}>{icon}</span>
      <h2 className="font-bold text-ink">{title}</h2>
      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-ink-soft">
        {count}
      </span>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
      {text}
    </div>
  );
}
