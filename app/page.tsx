import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Cake,
  Check,
  CheckCheck,
  FileSpreadsheet,
  HeartHandshake,
  MessageCircle,
  Puzzle,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { businessWhatsappLink, renderTemplate } from "@/lib/messages";
import { RUBROS as RUBRO_PHOTOS } from "@/lib/landing-media";
import { demoPresets } from "@/lib/rubro-presets";
import { CAMPAIGN_SEED } from "@/lib/campaigns";
import { rubroLabel } from "@/lib/rubros";
import { HeroVideo } from "@/components/landing/hero-video";
import { HeroMotion } from "@/components/landing/hero-motion";
import { FloatingNav } from "@/components/landing/floating-nav";
import { LoyaltyCard } from "@/components/landing/loyalty-card";
import { WordScrub } from "@/components/landing/word-scrub";
import { RubroMarquee } from "@/components/landing/rubro-marquee";
import { MagneticCta } from "@/components/landing/magnetic-cta";
import { PainAccordion, type PainSlice } from "@/components/landing/pain-accordion";
import { StackCards } from "@/components/landing/stack-cards";
import { CountUp } from "@/components/landing/count-up";
import { RevealGroup } from "@/components/landing/reveal-group";
import { Reveal } from "@/components/landing/reveal";
import { LossCalculator } from "@/components/landing/loss-calculator";
import { RubroCampaigns, type RubroShowcase } from "@/components/landing/rubro-campaigns";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

const CTA_MESSAGE = "¡Hola! Quiero pedir acceso a Vuelvo CRM para mi negocio.";
const CTA_HREF = businessWhatsappLink(CTA_MESSAGE);
// Un solo texto por intención en toda la página: el botón de WhatsApp dice
// siempre "Pedir acceso", nunca "Escribinos" ni "Empezar".
const CTA_LABEL = "Pedir acceso";

// Las fotos de la landing son las de los rubros (lib/landing-media.ts), ya
// verificadas y con el host declarado en next.config. Se buscan por nombre
// para que reordenar esa lista no cambie qué foto va en cada lugar.
const photo = (name: string) => RUBRO_PHOTOS.find((r) => r.name === name) ?? RUBRO_PHOTOS[0];

const PAINS: PainSlice[] = [
  {
    title: "Compró una vez y nunca más supiste de él",
    detail:
      "Sin un registro, cada venta empieza y termina en sí misma. No sabés si volvió, si se fue a otro lado o si simplemente se olvidó.",
    src: photo("Indumentaria").src,
    alt: photo("Indumentaria").alt,
  },
  {
    title: "Se te pasó el cumpleaños de una clienta de siempre",
    detail:
      "Un saludo a tiempo, con un beneficio, rinde más que cualquier publicidad paga. Y es lo primero que se olvida en un día de mostrador.",
    src: photo("Estética").src,
    alt: photo("Estética").alt,
  },
  {
    title: "No sabés quiénes son tus mejores clientes",
    detail:
      "Ni cuánto gastan, ni cada cuánto vienen, ni hace cuánto que no aparecen. Los tratás igual que a alguien que vino una sola vez.",
    src: photo("Peluquerías").src,
    alt: photo("Peluquerías").alt,
  },
  {
    title: "Avisar una promo te lleva la tarde entera",
    detail:
      "Escribís uno por uno, copiás y pegás, y aun así te salteás la mitad de la lista. Al final no lo hacés.",
    src: photo("Gimnasios").src,
    alt: photo("Gimnasios").alt,
  },
];

const STEPS = [
  {
    title: "Cargá tu cartera",
    body: "Nombre, teléfono, cumpleaños y lo que ya te compraron. A mano o importando tu Excel. El catálogo y las campañas de tu rubro ya vienen armados.",
    tone: "surface" as const,
    img: photo("Perfumerías"),
  },
  {
    title: "Se ordena sola",
    body: "Cada cliente queda en VIP, frecuente, ocasional, nuevo o inactivo, y se reacomoda solo con cada venta que registrás.",
    tone: "accent" as const,
    img: photo("Veterinarias"),
  },
  {
    title: "Te avisa a quién escribirle",
    body: "Los cumpleaños de la semana y los que ya deberían haber vuelto te esperan cada mañana en el panel, con el mensaje listo.",
    tone: "brand" as const,
    img: photo("Ópticas"),
  },
  {
    title: "Mandás en un toque y ves qué volvió",
    body: "Sale por tu WhatsApp con el nombre puesto. El panel te muestra cuántos clientes compraron después del mensaje y cuánta plata dejaron.",
    tone: "ink" as const,
    img: photo("Pet shops"),
  },
];

const SEGMENTS = [
  { name: "VIP", pct: 12, tone: "bg-accent-500" },
  { name: "Frecuente", pct: 34, tone: "bg-brand-500" },
  { name: "Ocasional", pct: 22, tone: "bg-sky-500" },
  { name: "Nuevo", pct: 9, tone: "bg-amber-500" },
  { name: "Inactivo", pct: 23, tone: "bg-ink-faint" },
];

const TRUST = [
  {
    icon: ShieldCheck,
    title: "Tus datos son solo tuyos",
    body: "Cada negocio tiene su cuenta aislada del resto. Nadie más ve tu cartera de clientes.",
  },
  {
    icon: HeartHandshake,
    title: "Pensado para negocios chicos",
    body: "Sin funciones que no vas a usar. Lo justo para venderle más a quien ya confía en vos.",
  },
  {
    icon: Users,
    title: "El alta la hacemos juntos",
    body: "Te ayudamos a cargar tu cartera y dejamos todo andando antes de soltarte la mano.",
  },
];

const FAQ = [
  {
    q: "¿Tengo que saber de computación?",
    a: "No. Si usás WhatsApp, podés usar Vuelvo. El alta la hacemos juntos y te dejamos tu cartera cargada.",
  },
  {
    q: "¿Los mensajes se mandan solos?",
    a: "El sistema elige a quién escribirle y redacta el mensaje con su nombre; vos lo mandás desde tu WhatsApp con un toque. Así le llega un mensaje tuyo, no de un número desconocido, y no hay riesgo de que te bloqueen.",
  },
  {
    q: "¿Cómo sé si me está sirviendo?",
    a: "El panel te muestra cuántos clientes compraron después de recibir un mensaje y cuánta plata dejaron. Es la cuenta que justifica el sistema, mes a mes.",
  },
  {
    q: "¿Funciona desde el celular?",
    a: "Sí. Se instala como una app en el teléfono y registrás una venta en el mostrador en segundos.",
  },
  {
    q: "Ya tengo mis clientes en un Excel. ¿Los pierdo?",
    a: "No. Importás la planilla tal como está y cuando quieras descargás tu cartera completa. Los datos son tuyos.",
  },
  {
    q: "¿Sirve para mi rubro?",
    a: "Sirve para cualquier negocio donde el cliente vuelve: barberías, estéticas, gimnasios, veterinarias, ópticas, indumentaria, suplementos, lavaderos, talleres y muchos más.",
  },
];

export default async function LandingPage() {
  const session = await getSessionUser();
  if (session) redirect("/dashboard");

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-clip bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-brand-700 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido principal
      </a>
      <FloatingNav ctaHref={CTA_HREF} ctaLabel={CTA_LABEL} />
      <main id="main-content" className="w-full max-w-full overflow-x-clip">
        <Hero />
        <RubroBand />
        <ProblemSection />
        <LossSection />
        <BentoSection />
        <StepsSection />
        <RubroCampaignsSection />
        <TrustSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fondo ambiental reutilizable: manchas de color de marca a la deriva. Van
// detrás de todo, sin eventos y fuera del árbol de accesibilidad.
function Aurora({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="animate-drift-a absolute -left-32 -top-32 h-[34rem] w-[34rem] rounded-full bg-brand-400/25 blur-[110px] dark:bg-brand-500/20" />
      <div className="animate-drift-b absolute -right-40 top-10 h-[30rem] w-[30rem] rounded-full bg-accent-500/25 blur-[110px] dark:bg-accent-600/30" />
      <div className="animate-drift-a absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent-300/20 blur-[90px] [animation-duration:31s]" />
    </div>
  );
}

// Imagen en píldora dentro del titular.
function InlinePhoto({ name, className = "" }: { name: string; className?: string }) {
  const p = photo(name);
  return (
    <span
      data-hero-pill
      className={`relative mx-[0.12em] hidden h-[0.82em] w-[1.75em] overflow-hidden rounded-full align-[-0.06em] ring-2 ring-surface shadow-pop sm:inline-block ${className}`}
    >
      <Image src={p.src} alt="" fill sizes="160px" className="object-cover" priority />
    </span>
  );
}

// Palabra del titular con máscara para la entrada de abajo hacia arriba.
function W({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
      <span data-hero-word className={`inline-block ${className}`}>
        {children}
      </span>
    </span>
  );
}

function Hero() {
  return (
    <HeroMotion>
      <section className="relative isolate overflow-hidden pb-24 pt-32 sm:pt-40 md:pb-32">
        <Aurora />
        <div aria-hidden="true" className="bg-dots mask-radial pointer-events-none absolute inset-0 -z-10" />

        <div className="relative mx-auto w-full max-w-6xl px-5 text-center sm:px-8">
          <h1 className="mx-auto max-w-6xl text-balance font-display text-[2.15rem] font-bold leading-[1.06] tracking-[-0.03em] text-ink sm:text-[clamp(2.6rem,6vw,5.4rem)]">
            <W>Vendé</W> <W>más</W>
            <InlinePhoto name="Peluquerías" />{" "}
            <W className="text-brand-700 dark:text-brand-400">sin</W>{" "}
            <W className="text-brand-700 dark:text-brand-400">conseguir</W>{" "}
            <W>un</W> <W>solo</W> <W>cliente</W>
            <InlinePhoto name="Veterinarias" />{" "}
            <W>nuevo.</W>
          </h1>

          <p
            data-hero-fade
            className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl"
          >
            Vuelvo conoce a cada cliente que ya tenés, te avisa quién está por volver y te deja el
            WhatsApp escrito. Vos tocás enviar. Ellos vuelven.
          </p>

          <div data-hero-fade className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <MagneticCta
              href={CTA_HREF}
              className="btn-primary justify-center whitespace-nowrap rounded-full !px-8 !py-4 text-base"
            >
              <MessageCircle aria-hidden="true" className="h-5 w-5" />
              {CTA_LABEL}
            </MagneticCta>
            <a
              href="#como-funciona"
              className="btn-secondary justify-center whitespace-nowrap rounded-full !px-7 !py-4 text-base"
            >
              Ver cómo funciona
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </div>

        <ProductFrame />
      </section>
    </HeroMotion>
  );
}

/**
 * Marco de producto: el video del hero como escenario y, encima, las piezas
 * reales del panel (plan del día, mensaje de WhatsApp, tarjeta de puntos).
 * Es un panel de ejemplo con datos de una cuenta demo, no una promesa de
 * resultados — por eso la leyenda de abajo lo aclara.
 */
function ProductFrame() {
  return (
    <div className="relative mx-auto mt-16 w-full max-w-6xl px-4 sm:mt-20 sm:px-8">
      <div
        data-hero-frame
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-accent-900 shadow-[0_40px_120px_-30px_rgba(91,46,229,0.55)] ring-1 ring-black/5 lg:aspect-[16/8.5]"
      >
        <HeroVideo src="/hero.mp4" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-accent-900/85 via-accent-900/55 to-brand-950/70" />
        <div aria-hidden="true" className="grain absolute inset-0" />

        {/* Mobile: apilado. Desktop: piezas flotando sobre el video. */}
        {/* El contenedor ocupa todo el marco en lg (inset-0): las piezas de
            abajo se anclan con bottom-*, y contra una caja de alto cero
            quedaban fuera de cuadro. */}
        <div className="relative grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:absolute lg:inset-0 lg:block lg:p-0">
          <div data-depth="0.6" className="lg:absolute lg:left-[5%] lg:top-[11%] lg:w-[33%]">
            <div className="lg:animate-float">
              <PlanCard />
            </div>
          </div>

          <div data-depth="1.1" className="lg:absolute lg:right-[5%] lg:top-[9%] lg:w-[31%]">
            <div className="lg:animate-float lg:[animation-delay:-2s]">
              <ChatCard />
            </div>
          </div>

          <div data-depth="1.5" className="hidden lg:absolute lg:bottom-[8%] lg:left-[39%] lg:block lg:w-[26%]">
            <div className="animate-float [animation-delay:-4s]">
              <LoyaltyCard />
            </div>
          </div>

          <div data-depth="0.9" className="lg:absolute lg:bottom-[13%] lg:right-[7%]">
            <ReturnToast />
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-ink-muted">Panel de ejemplo con datos de una cuenta demo.</p>
    </div>
  );
}

function PlanCard() {
  const rows = [
    { name: "Cumpleaños", n: 3, icon: Cake, tone: "bg-accent-500/15 text-accent-700 dark:text-accent-300" },
    { name: "Hora del corte", n: 9, icon: Send, tone: "bg-brand-500/15 text-brand-700 dark:text-brand-300" },
    { name: "Recompra", n: 6, icon: TrendingUp, tone: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  ];
  return (
    <div className="rounded-3xl border border-line bg-surface p-5 text-left shadow-pop">
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
        Tu plan de hoy
      </p>
      <p className="mt-2 font-display text-4xl font-bold tabular-nums text-ink">18</p>
      <p className="text-sm font-medium text-ink-soft">clientes para contactar</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full w-[62%] rounded-full bg-brand-500" />
      </div>
      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3">
            <span className={`grid h-8 w-8 place-items-center rounded-xl ${r.tone}`}>
              <r.icon aria-hidden="true" className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-semibold text-ink">{r.name}</span>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold tabular-nums text-ink-soft">
              {r.n}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChatCard() {
  return (
    <div className="overflow-hidden rounded-3xl bg-[#efeae2] text-left shadow-pop dark:bg-[#0b141a]">
      <div className="flex items-center gap-3 bg-[#008069] px-4 py-3 text-white dark:bg-[#202c33]">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 font-display text-sm font-bold">
          MG
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">María González</p>
          <p className="text-[11px] text-white/75">en línea</p>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-[#d9fdd3] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">
          ¡Hola María! Ya pasaron unas semanas de tu último corte. ¿Te guardo un lugar esta semana?
          <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#667781] dark:text-[#8696a0]">
            10:24 <CheckCheck aria-hidden="true" className="h-3.5 w-3.5 text-[#53bdeb]" />
          </span>
        </div>
        <div className="max-w-[70%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-[#111b21] shadow-sm dark:bg-[#202c33] dark:text-[#e9edef]">
          ¡Sí! ¿El jueves a la tarde?
        </div>
      </div>
    </div>
  );
}

function ReturnToast() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 text-left shadow-pop backdrop-blur md:max-w-[17rem]">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-brand-950">
        <Check aria-hidden="true" className="h-5 w-5" strokeWidth={3} />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-bold text-ink">Martín volvió</p>
        <p className="text-xs text-ink-muted">3 días después del mensaje</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function RubroBand() {
  const names = RUBRO_PHOTOS.map((r) => r.name);
  const track = [...names, ...names];
  return (
    <section aria-labelledby="rubros-title" className="relative border-y border-line bg-surface-2/40 py-20 sm:py-24">
      <Reveal className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 id="rubros-title" className="text-balance text-center font-display text-2xl font-bold text-ink sm:text-3xl">
          Para negocios donde el cliente vuelve
        </h2>
      </Reveal>
      <div className="mt-10">
        <RubroMarquee />
      </div>
      {/* Segunda cinta, tipográfica y en sentido contrario: da ritmo sin sumar
          información nueva, por eso va fuera del árbol de accesibilidad. */}
      <div aria-hidden="true" className="marquee-mask mt-8 overflow-hidden">
        <div className="animate-marquee-reverse flex w-max">
          {track.map((n, i) => (
            <span
              key={`${n}-${i}`}
              className="text-outline whitespace-nowrap pr-10 font-display text-5xl font-bold uppercase tracking-tight sm:text-7xl"
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
function ProblemSection() {
  return (
    <section className="relative isolate overflow-hidden py-28 md:py-44">
      <div aria-hidden="true" className="bg-grid-lines mask-fade-y pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <WordScrub
          text="Conseguir un cliente nuevo cuesta mucho más que hacer volver a uno que ya te compró. Casi ningún negocio chico trabaja la segunda parte."
          className="mx-auto max-w-5xl text-balance text-center font-display text-[1.75rem] font-bold leading-[1.2] tracking-tight text-ink sm:text-[2.6rem] sm:leading-[1.15]"
        />

        <Reveal className="mt-24 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">¿Te suena familiar?</h3>
          <p className="max-w-sm text-sm text-ink-muted">Pasá el mouse por cada historia. Las cuatro tienen arreglo.</p>
        </Reveal>
        <Reveal className="mt-8">
          <PainAccordion items={PAINS} />
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
function LossSection() {
  return (
    <section id="cuanto-perdes" className="relative isolate scroll-mt-24 overflow-hidden bg-surface-2/50 py-28 md:py-44">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-drift-b absolute -right-24 top-20 h-[28rem] w-[28rem] rounded-full bg-rose-400/15 blur-[110px]" />
        <div className="animate-drift-a absolute -left-24 bottom-0 h-[26rem] w-[26rem] rounded-full bg-accent-500/15 blur-[110px]" />
      </div>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-4xl">
          <h2 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            El cliente que no vuelve no se queja. <span className="text-rose-600 dark:text-rose-400">Se va.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Ningún negocio chico lleva la cuenta de cuánta plata se le va por los que compraron una vez
            y nunca más aparecieron. Hacela acá con tus números.
          </p>
        </Reveal>

        <RevealGroup className="mt-16 grid gap-4 sm:grid-cols-3">
          <StatCard
            value={<CountUp to={25} prefix="5 a " suffix="×" />}
            label="más caro conseguir un cliente nuevo que retener uno que ya tenés."
            source="Harvard Business Review"
          />
          <StatCard
            value={<CountUp to={95} prefix="+25% a " suffix="%" />}
            label="de ganancia puede traer subir apenas un 5% la cantidad de clientes que vuelven."
            source="Bain & Company"
          />
          <StatCard
            value={<CountUp to={0} suffix=" avisos" />}
            label="te da el cliente que deja de venir. Un día, simplemente, le compra a otro."
            source="Lo que pasa en todo mostrador"
          />
        </RevealGroup>

        <Reveal className="mt-8">
          <LossCalculator />
        </Reveal>
      </div>
    </section>
  );
}

function StatCard({ value, label, source }: { value: React.ReactNode; label: string; source: string }) {
  return (
    <div data-reveal className="group card relative overflow-hidden p-7 transition-transform duration-500 hover:-translate-y-1">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-500/10 blur-2xl transition-transform duration-700 group-hover:scale-150"
      />
      <div className="relative font-display text-4xl font-bold tabular-nums tracking-tight text-ink">{value}</div>
      <p className="relative mt-3 text-sm leading-relaxed text-ink-soft">{label}</p>
      <p className="relative mt-5 text-xs font-medium text-ink-muted">Fuente: {source}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bento. Grilla de 4 columnas en lg:
//   fila 1: A A B B · fila 2: A A C D · fila 3: E E E E  (12 de 12 celdas)
// y de 2 en sm: AA / AA / BB / CD / EE (10 de 10). grid-flow-dense de todos
// modos, por si algún día cambia una tarjeta de tamaño.
function BentoSection() {
  const msgPhoto = photo("Perfumerías");
  return (
    <section id="que-incluye" className="relative isolate scroll-mt-24 overflow-hidden py-28 md:py-44">
      <div aria-hidden="true" className="bg-dots mask-radial pointer-events-none absolute inset-0 -z-10 opacity-70" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-4xl">
          <h2 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Un solo panel, y nada que no vayas a usar.
          </h2>
        </Reveal>

        <RevealGroup className="mt-14 grid grid-flow-dense auto-rows-[minmax(15rem,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* A: mensajes */}
          <article
            data-reveal
            className="group relative overflow-hidden rounded-[1.75rem] bg-accent-800 p-7 text-white sm:col-span-2 sm:row-span-2"
          >
            <Image
              src={msgPhoto.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover opacity-30 mix-blend-luminosity transition-transform duration-1000 ease-out group-hover:scale-105"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-accent-900 via-accent-900/80 to-accent-800/40" />
            <div className="relative flex h-full flex-col">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-accent-100 ring-1 ring-inset ring-white/15">
                <Send aria-hidden="true" className="h-3.5 w-3.5" /> Campañas listas
              </span>
              <h3 className="mt-5 max-w-md font-display text-3xl font-bold leading-tight">
                El mensaje sale escrito, con su nombre y su motivo.
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-accent-100">
                Cumpleaños, recompra, reactivación: cada campaña arma su lista sola todos los días.
              </p>
              <div className="mt-auto space-y-3 pt-8">
                <div className="max-w-sm rounded-2xl rounded-tl-md bg-white/95 p-3.5 text-[13px] leading-relaxed text-brand-950 shadow-pop transition-transform duration-500 group-hover:-translate-y-1">
                  ¡Hola Valentina! Se viene tu cumple: pasá esta semana por Perfumería Bella y tenés 15% off.
                </div>
                <div className="ml-auto max-w-[14rem] rounded-2xl rounded-tr-md bg-brand-500 p-3 text-[13px] font-medium leading-relaxed text-brand-950 shadow-pop transition-transform delay-75 duration-500 group-hover:-translate-y-1">
                  ¡Gracias! Paso el jueves.
                </div>
              </div>
            </div>
          </article>

          {/* B: segmentación */}
          <article data-reveal className="group card relative overflow-hidden p-7 sm:col-span-2">
            <h3 className="font-display text-2xl font-bold text-ink">Segmentación automática</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
              Mira cuánto gastó cada cliente y hace cuánto no vuelve, y lo reubica solo con cada venta.
            </p>
            <div className="mt-6 flex h-3 overflow-hidden rounded-full">
              {SEGMENTS.map((s) => (
                <div
                  key={s.name}
                  className={`${s.tone}`}
                  style={{ flexGrow: s.pct }}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {SEGMENTS.map((s) => (
                <span key={s.name} className="inline-flex items-center gap-2 text-xs font-semibold text-ink-soft">
                  <span className={`h-2 w-2 rounded-full ${s.tone}`} /> {s.name}
                </span>
              ))}
            </div>
          </article>

          {/* C: cumpleaños */}
          <article data-reveal className="group card relative overflow-hidden p-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-500/15 text-accent-700 transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 dark:text-accent-300">
              <Cake aria-hidden="true" className="h-6 w-6" />
            </span>
            <h3 className="mt-8 font-display text-lg font-bold text-ink">Ningún cumpleaños se pasa</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Los de la semana, en la primera pantalla, con el saludo listo.
            </p>
          </article>

          {/* D: excel */}
          <article data-reveal className="group card relative overflow-hidden p-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/15 text-brand-700 transition-transform duration-500 group-hover:rotate-[8deg] group-hover:scale-110 dark:text-brand-300">
              <FileSpreadsheet aria-hidden="true" className="h-6 w-6" />
            </span>
            <h3 className="mt-8 font-display text-lg font-bold text-ink">Tu Excel entra y sale</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Importás la planilla que ya tenés. Los datos siguen siendo tuyos.
            </p>
          </article>

          {/* E: módulos */}
          <article
            data-reveal
            className="relative overflow-hidden rounded-[1.75rem] border border-line bg-gradient-to-r from-brand-500/10 via-surface to-accent-500/10 p-7 sm:col-span-2 lg:col-span-4"
          >
            <div className="flex h-full flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface text-brand-700 ring-1 ring-line dark:text-brand-300">
                  <Puzzle aria-hidden="true" className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">Sumá módulos cuando los necesites</h3>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-muted">
                    Puntos y beneficios para premiar la constancia, y Caja y reportes: arqueo, comisiones
                    de tu equipo y en qué día y horario vendés más.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Puntos", "Caja y reportes"].map((m) => (
                  <span key={m} className="rounded-full bg-brand-500 px-3.5 py-1.5 text-xs font-bold text-brand-950">
                    {m}
                  </span>
                ))}
                {["Turnos", "Vidriera", "Stock"].map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-dashed border-line px-3.5 py-1.5 text-xs font-semibold text-ink-muted"
                  >
                    {m} · pronto
                  </span>
                ))}
              </div>
            </div>
          </article>
        </RevealGroup>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
const STEP_TONES = {
  surface: "bg-surface text-ink border border-line",
  accent: "bg-gradient-to-br from-accent-600 to-accent-800 text-white",
  brand: "bg-gradient-to-br from-brand-300 to-brand-500 text-brand-950",
  ink: "bg-[#0b0f17] text-white ring-1 ring-white/10",
};
const STEP_MUTED = {
  surface: "text-ink-soft",
  accent: "text-accent-100",
  brand: "text-brand-900",
  ink: "text-white/70",
};

function StepsSection() {
  return (
    <section id="como-funciona" className="relative scroll-mt-24 py-28 md:py-44">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <h2 className="max-w-3xl text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              De la primera venta al cliente que vuelve.
            </h2>
          </Reveal>
          <Reveal className="max-w-sm">
            <p className="leading-relaxed text-ink-soft">
              Cuatro pasos. El primero lo hacemos juntos. Los otros tres corren solos mientras vos atendés.
            </p>
          </Reveal>
        </div>

        <StackCards>
          <div className="mt-14 space-y-6">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                data-stack-card
                className="sticky"
                style={{ top: `calc(6.5rem + ${i * 1.25}rem)` }}
              >
                <article
                  data-stack-inner
                  className={`grid origin-top overflow-hidden rounded-[2rem] shadow-pop md:min-h-[24rem] md:grid-cols-[1.1fr_0.9fr] ${STEP_TONES[s.tone]}`}
                >
                  <div className="flex flex-col justify-between gap-10 p-7 sm:p-10">
                    <span className="font-display text-7xl font-bold leading-none tracking-tighter opacity-25 sm:text-8xl">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{s.title}</h3>
                      <p className={`mt-4 max-w-md text-base leading-relaxed sm:text-lg ${STEP_MUTED[s.tone]}`}>
                        {s.body}
                      </p>
                    </div>
                  </div>
                  <div className="group relative hidden overflow-hidden md:block">
                    <Image
                      src={s.img.src}
                      alt={s.img.alt}
                      fill
                      sizes="45vw"
                      className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    />
                    <div
                      aria-hidden="true"
                      className={`absolute inset-0 ${
                        s.tone === "surface"
                          ? "bg-gradient-to-r from-surface via-surface/20 to-transparent"
                          : s.tone === "accent"
                          ? "bg-gradient-to-r from-accent-700 via-accent-700/30 to-transparent"
                          : s.tone === "brand"
                          ? "bg-gradient-to-r from-brand-500 via-brand-500/25 to-transparent"
                          : "bg-gradient-to-r from-[#0b0f17] via-[#0b0f17]/40 to-transparent"
                      }`}
                    />
                  </div>
                </article>
              </div>
            ))}
          </div>
        </StackCards>

        <div className="mt-16 flex justify-center">
          <MagneticCta href={CTA_HREF} className="btn-primary whitespace-nowrap rounded-full !px-8 !py-4 text-base">
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            {CTA_LABEL}
          </MagneticCta>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Las campañas que trae cada rubro, armadas desde los mismos presets que usa
// el alta de negocios (lib/rubro-presets.ts).
function buildShowcase(): RubroShowcase[] {
  const birthdaySeed = CAMPAIGN_SEED.find((c) => c.builtin === "birthday")!;
  return demoPresets().map((p) => {
    const nombre = p.demo.maleShare >= 0.5 ? "Martín" : "Sofía";
    const vars = (servicio?: string) => ({
      nombre,
      negocio: p.demo.businessName,
      servicio: servicio ?? p.services[0]?.name ?? "",
      puntos: "80",
      dias_sin_comprar: String(p.config.recompraDays),
    });
    const extras = p.campaigns
      .filter((c) => c.segment !== "inactivo" && c.segment !== "vip")
      .slice(0, 2)
      .map((c) => ({
        name: c.name,
        when: c.description,
        message: renderTemplate(c.whatsappBody, vars(c.serviceName)),
      }));
    return {
      rubro: p.rubro,
      label: rubroLabel(p.rubro).split(" / ")[0],
      businessName: p.demo.businessName,
      campaigns: [
        {
          name: "Cumpleaños",
          when: "Unos días antes del cumpleaños, con un regalo para que venga esa semana.",
          message: renderTemplate(p.birthday?.whatsappBody ?? birthdaySeed.whatsappBody, vars()),
        },
        ...extras,
      ],
    };
  });
}

function RubroCampaignsSection() {
  return (
    <section id="por-rubro" className="relative isolate scroll-mt-24 overflow-hidden py-28 md:py-44">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-accent-500/[0.07] via-brand-500/[0.06] to-transparent" />
      <div aria-hidden="true" className="bg-grid-lines mask-radial pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-4xl">
          <h2 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Arrancás con las campañas que ya funcionan en tu rubro.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Una barbería sabe que el corte se repite a las tres semanas. Una óptica, que los lentes
            mensuales se terminan a los 30 días. Vuelvo también lo sabe: cada cuenta nueva viene con el
            catálogo y las campañas de su rubro, listas para mandar.
          </p>
        </Reveal>
        <Reveal className="mt-12">
          <RubroCampaigns items={buildShowcase()} />
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
function TrustSection() {
  return (
    <section className="py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="grain relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-accent-700 via-accent-800 to-accent-900 px-7 py-16 sm:px-14 sm:py-20">
            <Aurora className="opacity-70" />
            <div className="relative grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <h2 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
                Simple de usar, serio para confiar.
              </h2>
              <RevealGroup className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
                {TRUST.map((t) => (
                  <div key={t.title} data-reveal className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-brand-300 ring-1 ring-inset ring-white/15">
                      <t.icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">{t.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-accent-100">{t.body}</p>
                    </div>
                  </div>
                ))}
              </RevealGroup>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
function FaqSection() {
  return (
    <section id="preguntas" className="scroll-mt-24 pb-28 md:pb-40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <h2 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
            Preguntas frecuentes
          </h2>
          <p className="mt-5 max-w-sm leading-relaxed text-ink-soft">
            ¿Te quedó alguna? Escribinos por WhatsApp y te contestamos nosotros, no un bot.
          </p>
        </Reveal>
        <div className="divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-xl text-ink-soft transition-[transform,background-color] duration-300 group-open:rotate-45 group-open:bg-brand-500 group-open:text-brand-950"
                >
                  +
                </span>
              </summary>
              <p className="pb-6 pr-12 leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
function FinalCta() {
  const words = ["Vuelvo", "Volvé", "Vuelven", "Vuelvo", "Volvé", "Vuelven"];
  return (
    <section className="px-3 pb-6 sm:px-5">
      <div className="grain relative isolate overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-accent-600 via-accent-700 to-accent-900 px-6 py-24 text-center shadow-pop sm:py-36">
        <Aurora />
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 overflow-hidden">
          <div className="animate-marquee flex w-max">
            {[...words, ...words].map((w, i) => (
              <span
                key={`${w}-${i}`}
                className="text-outline-light whitespace-nowrap pr-12 font-display text-[6rem] font-bold leading-none tracking-tighter sm:text-[11rem]"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
        <div className="relative mx-auto max-w-4xl">
          <Sparkles aria-hidden="true" className="mx-auto h-8 w-8 text-brand-300" />
          <h2 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.02] tracking-tight text-white sm:text-7xl">
            Empezá a fidelizar esta semana.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-accent-100">
            Escribinos por WhatsApp y dejamos tu cuenta andando, con tu cartera cargada y las campañas de
            tu rubro listas.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MagneticCta href={CTA_HREF} className="btn-primary whitespace-nowrap rounded-full !px-9 !py-4 text-base">
              <MessageCircle aria-hidden="true" className="h-5 w-5" />
              {CTA_LABEL}
            </MagneticCta>
            <Link
              href="/login"
              className="btn whitespace-nowrap rounded-full border border-white/25 bg-white/10 !px-8 !py-4 text-base text-white backdrop-blur hover:bg-white/20"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-5 py-12 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <Logo size="sm" byline />
        <nav aria-label="Pie de página" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <a href="#como-funciona" className="font-medium text-ink-soft transition hover:text-ink">
            Cómo funciona
          </a>
          <a href="#preguntas" className="font-medium text-ink-soft transition hover:text-ink">
            Preguntas
          </a>
          <a
            href={CTA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink-soft transition hover:text-brand-700 dark:hover:text-brand-400"
          >
            WhatsApp
          </a>
          <Link href="/login" className="font-medium text-ink-soft transition hover:text-ink">
            Iniciar sesión
          </Link>
          <ThemeToggle compact />
        </nav>
      </div>
      <p className="mt-8 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} Vuelvo CRM · Desarrollado por GUTMARK
      </p>
    </footer>
  );
}
