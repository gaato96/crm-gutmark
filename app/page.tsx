import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Sparkles,
  MessageCircle,
  ArrowRight,
  Users,
  Cake,
  Target,
  RotateCcw,
  Send,
  BarChart3,
  ShieldCheck,
  HeartHandshake,
  Clock,
  CheckCircle2,
  Frown,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { businessWhatsappLink } from "@/lib/messages";
import { ThemeToggle } from "@/components/theme-toggle";
import { Reveal } from "@/components/landing/reveal";
import { LoyaltyCard } from "@/components/landing/loyalty-card";

const CTA_MESSAGE =
  "¡Hola! Quiero pedir acceso a GUTMARK Fideliza para mi negocio.";

const RUBROS = [
  "Perfumerías",
  "Peluquerías",
  "Veterinarias",
  "Ópticas",
  "Gimnasios",
  "Pet shops",
  "Indumentaria",
  "Estética",
];

const PAIN_POINTS = [
  {
    icon: Frown,
    title: "Un cliente compró una vez y nunca más volviste a saber de él",
    detail: "Sin un registro, cada venta es la primera y la última.",
  },
  {
    icon: Cake,
    title: "Se te pasó el cumpleaños de una clienta de toda la vida",
    detail: "Un saludo a tiempo vale más que cualquier publicidad.",
  },
  {
    icon: Target,
    title: "No sabés quiénes son tus mejores clientes",
    detail: "Ni cuánto gastan, ni hace cuánto que no vuelven.",
  },
  {
    icon: Clock,
    title: "Perdés horas escribiendo uno por uno para avisar una promo",
    detail: "Y aun así te olvidás de la mitad de la lista.",
  },
];

const MODULES = [
  {
    icon: Users,
    title: "Cargá tu cartera de clientes",
    body: "Base de datos simple: nombre, contacto, cumpleaños y cada compra que te hicieron. A mano o importando un Excel entero de una vez.",
  },
  {
    icon: Target,
    title: "Segmentación automática",
    body: "GUTMARK Fideliza clasifica solo a tus clientes en VIP, frecuentes, nuevos e inactivos. Vos ves quién importa, sin hacer cuentas.",
  },
  {
    icon: RotateCcw,
    title: "Recordatorios que no se te pasan",
    body: "Cumpleaños de la semana y clientes que ya deberían haber vuelto, listos cada mañana en un panel de \"hoy tenés que…\".",
  },
  {
    icon: Send,
    title: "Escribiles en un clic",
    body: "Mensaje de WhatsApp ya redactado y personalizado, listo para enviar. O un email automático. Vos elegís, nunca escribís de cero.",
  },
];

export default async function LandingPage() {
  const session = await getSessionUser();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido principal
      </a>
      <Nav />
      <main id="main-content">
        <Hero />
        <AudienceStrip />
        <PainSection />
        <HowItWorks />
        <TrustSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="glass sticky top-0 z-40 border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
            <Sparkles aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-ink">GUTMARK</div>
            <div className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
              Fideliza
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle compact />
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-ink-soft transition hover:text-ink sm:block"
          >
            Iniciar sesión
          </Link>
          <a
            href={businessWhatsappLink(CTA_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary !py-2 text-sm"
          >
            <MessageCircle aria-hidden="true" className="h-4 w-4" /> Pedir acceso
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
            <HeartHandshake aria-hidden="true" className="h-3.5 w-3.5" />
            Fidelización para PYMES
          </span>

          <h1 className="mt-5 text-balance font-display text-[2.5rem] leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
            Vendé más{" "}
            <span className="text-brand-600 dark:text-brand-400">
              sin conseguir
            </span>{" "}
            un solo cliente nuevo.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            GUTMARK Fideliza te ayuda a conocer a los clientes que ya tenés,
            no olvidarte de ellos y hacerlos volver antes de que se olviden
            de vos. Sin planillas, sin curva de aprendizaje.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={businessWhatsappLink(CTA_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary justify-center !px-6 !py-3.5 text-base"
            >
              <MessageCircle aria-hidden="true" className="h-5 w-5" /> Pedir acceso por WhatsApp
            </a>
            <a
              href="#como-funciona"
              className="btn-secondary justify-center !px-6 !py-3.5 text-base"
            >
              Ver cómo funciona <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>

          <p className="mt-4 text-sm text-ink-muted">
            Te contestamos nosotros, en persona — no un bot ni un formulario perdido.
          </p>
        </div>

        <Reveal className="lg:pt-6">
          <LoyaltyCard />
        </Reveal>
      </div>
    </section>
  );
}

function AudienceStrip() {
  return (
    <Reveal>
      <section className="border-y border-line bg-surface-2/50 py-8">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Pensado para negocios con clientes que vuelven
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            {RUBROS.map((r) => (
              <span
                key={r}
                className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-soft"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function PainSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          El problema
        </span>
        <h2 className="mt-3 text-balance font-display text-3xl text-ink sm:text-4xl">
          ¿Te suena familiar?
        </h2>
        <p className="mt-4 text-ink-muted">
          La mayoría de los negocios pierden más plata por no cuidar a los
          clientes que ya tienen, que por no conseguir clientes nuevos.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {PAIN_POINTS.map((p, i) => (
          <Reveal key={p.title} delay={i * 80}>
            <div className="card flex h-full items-start gap-4 p-5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-500">
                <p.icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-ink">{p.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{p.detail}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="border-y border-line bg-surface-2/40 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
            La solución
          </span>
          <h2 className="mt-3 text-balance font-display text-3xl text-ink sm:text-4xl">
            Todo lo que necesitás para fidelizar, en un solo lugar
          </h2>
          <p className="mt-4 text-ink-muted">
            Cuatro módulos que trabajan juntos para que ningún cliente se te
            escape.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {MODULES.map((m, i) => (
            <Reveal key={m.title} delay={i * 90}>
              <div className="card h-full p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <m.icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-ink-faint">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {m.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const points = [
    {
      icon: ShieldCheck,
      title: "Tus datos, seguros y solo tuyos",
      body: "Cada negocio tiene su propia cuenta, aislada del resto. Nadie más ve tu cartera de clientes.",
    },
    {
      icon: HeartHandshake,
      title: "Hecho para PYMES, no para call centers",
      body: "Sin funciones que no vas a usar. Lo justo y necesario para vender más a quien ya confía en vos.",
    },
    {
      icon: BarChart3,
      title: "Te acompañamos a subir tu primer cliente",
      body: "El alta es personal: te ayudamos a cargar tu cartera y dejar todo funcionando antes de dejarte solo.",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Por qué GUTMARK Fideliza
        </span>
        <h2 className="mt-3 text-balance font-display text-3xl text-ink sm:text-4xl">
          Simple de usar, serio para confiar
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {points.map((p, i) => (
          <Reveal key={p.title} delay={i * 90}>
            <div className="text-center sm:text-left">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gold-500/10 text-gold-600 dark:text-gold-400 sm:mx-0">
                <p.icon aria-hidden="true" className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-bold text-ink">{p.title}</h3>
              <p className="mt-1.5 text-sm text-ink-muted">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-6 py-14 text-center shadow-pop sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-400/20 blur-3xl" />

          <div className="relative">
            <h2 className="mx-auto max-w-xl text-balance font-display text-3xl leading-tight text-white sm:text-4xl">
              Empezá a fidelizar hoy
            </h2>
            <p className="mx-auto mt-4 max-w-md text-brand-100">
              Escribinos por WhatsApp y te acompañamos a poner en marcha tu
              cuenta en el momento.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <a
                href={businessWhatsappLink(CTA_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold !px-7 !py-3.5 text-base"
              >
                <MessageCircle aria-hidden="true" className="h-5 w-5" /> Pedir acceso por WhatsApp
              </a>
              <span className="inline-flex items-center gap-1.5 text-xs text-brand-200">
                <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" /> Respuesta personal, sin
                esperas
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center sm:flex-row sm:justify-between sm:text-left sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-ink">GUTMARK Fideliza</div>
            <div className="text-xs text-ink-muted">
              Fidelización para PYMES argentinas
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <a
            href={businessWhatsappLink(CTA_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink-soft transition hover:text-brand-600 dark:hover:text-brand-400"
          >
            WhatsApp
          </a>
          <Link
            href="/login"
            className="font-medium text-ink-soft transition hover:text-ink"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-ink-faint">
        © {new Date().getFullYear()} GUTMARK Fideliza
      </p>
    </footer>
  );
}
