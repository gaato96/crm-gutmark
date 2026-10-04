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
import { HeroStage } from "@/components/landing/hero-stage";
import { HeroChat } from "@/components/landing/hero-chat";
import { FloatingNav } from "@/components/landing/floating-nav";
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
import { AmbientCanvas } from "@/components/landing/ambient-canvas";
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
    visual: "ticket",
  },
  {
    title: "Se te pasó el cumpleaños de una clienta de siempre",
    detail:
      "Un saludo a tiempo, con un beneficio, rinde más que cualquier publicidad paga. Y es lo primero que se olvida en un día de mostrador.",
    visual: "calendar",
  },
  {
    title: "No sabés quiénes son tus mejores clientes",
    detail:
      "Ni cuánto gastan, ni cada cuánto vienen, ni hace cuánto que no aparecen. Los tratás igual que a alguien que vino una sola vez.",
    visual: "ranking",
  },
  {
    title: "No sabés a quién escribirle ni qué decirle",
    detail:
      "Abrís WhatsApp, ves cientos de contactos y no sabés por dónde empezar ni qué decirle a cada uno. Al final no le escribís a nadie.",
    visual: "contacts",
  },
];

const STEPS = [
  {
    title: "Cargá tu cartera",
    body: "Nombre, teléfono, cumpleaños y lo que ya te compraron. A mano o importando tu Excel. El catálogo y las campañas de tu rubro ya vienen armados.",
    tone: "surface" as const,
  },
  {
    title: "Se ordena sola",
    body: "Cada cliente queda en VIP, frecuente, ocasional, nuevo o inactivo, y se reacomoda solo con cada venta que registrás.",
    tone: "accent" as const,
  },
  {
    title: "Te avisa a quién escribirle",
    body: "Los cumpleaños de la semana y los que ya deberían haber vuelto te esperan cada mañana en el panel, con el mensaje listo.",
    tone: "brand" as const,
  },
  {
    title: "Mandás en un toque y ves qué volvió",
    body: "Sale por tu WhatsApp con el nombre puesto. El panel te muestra cuántos clientes compraron después del mensaje y cuánta plata dejaron.",
    tone: "ink" as const,
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
    a: "El sistema elige a quién escribirle y redacta el mensaje con su nombre; vos lo mandás desde tu WhatsApp, uno por uno, con un toque cada uno. Así le llega un mensaje tuyo, no de un número desconocido, y no hay riesgo de que te bloqueen.",
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
    <div className="landing-root dark relative isolate min-h-screen w-full max-w-full overflow-x-clip bg-canvas text-ink">
      <AmbientCanvas />
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
      <div className="animate-drift-a absolute -left-32 -top-32 h-[34rem] w-[34rem] rounded-full bg-brand-400/25 blur-[110px] dark:bg-brand-500/25" />
      <div className="animate-drift-b absolute -right-40 top-10 h-[30rem] w-[30rem] rounded-full bg-accent-500/25 blur-[110px] dark:bg-accent-500/35" />
      <div className="animate-drift-a absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent-300/20 blur-[90px] [animation-duration:31s]" />
    </div>
  );
}

/**
 * El hero es la única banda que se queda oscura en los dos temas: su fondo es
 * el video, y sobre un video no se puede garantizar contraste con tokens que
 * cambian según el tema. El scrim y los colores del texto quedan fijos y el
 * contraste se calcula una sola vez (ver "Landing pública" en CLAUDE.md).
 *
 * Texto a la izquierda, chat animado a la derecha: el chat cuenta la historia
 * entera del producto (aviso de cumpleaños, mensaje escrito, respuesta, venta).
 */
function Hero() {
  return (
    <HeroStage>
      <section className="relative flex min-h-[100dvh] items-center overflow-hidden bg-accent-900 pt-20">
        <HeroVideo src="/hero.mp4" className="absolute inset-0 h-full w-full object-cover" />

        {/* Piso de oscuridad: ningún cuadro claro del video se come el titular. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-accent-900/45" />
        {/* Mobile: scrim parejo (el texto ocupa todo el ancho). */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-accent-900/72 lg:hidden" />
        {/* Desktop: scrim direccional. Opaco donde está el texto, abierto a la
            derecha para que el video se vea detrás del chat. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-accent-900 via-accent-900/80 to-accent-900/25 lg:block"
        />
        {/* Grilla en movimiento sobre el video: textura de marca. */}
        <div aria-hidden="true" className="bg-grid-move pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-canvas" />
        <div aria-hidden="true" className="grain pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-drift-a absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand-400/25 blur-3xl" />
          <div className="animate-drift-b absolute -right-32 top-40 h-[24rem] w-[24rem] rounded-full bg-accent-400/25 blur-3xl" />
          <div className="animate-drift-b absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-brand-300/15 blur-3xl [animation-duration:32s]" />
        </div>

        <div className="relative mx-auto grid w-full max-w-6xl gap-16 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">
          <div>
            <span
              data-anim="hero-item"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-200 ring-1 ring-inset ring-white/15 backdrop-blur"
            >
              <HeartHandshake aria-hidden="true" className="h-3.5 w-3.5" />
              Fidelización para PYMES
            </span>

            <h1
              data-anim="hero-item"
              className="mt-5 max-w-2xl text-balance font-display text-[2.35rem] font-bold leading-[1.06] tracking-tight text-white sm:text-[3rem] lg:text-[3.5rem]"
            >
              Vendé más <span className="text-brand-300">sin conseguir</span> un solo cliente nuevo.
            </h1>

            <p data-anim="hero-item" className="mt-6 max-w-xl text-lg leading-relaxed text-accent-100">
              Conocé a los clientes que ya tenés, acordate de todos, y hacelos volver antes de que se
              olviden de vos.
            </p>

            <div data-anim="hero-item" className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <MagneticCta
                href={CTA_HREF}
                className="btn-primary justify-center whitespace-nowrap !px-7 !py-3.5 text-base"
              >
                <MessageCircle aria-hidden="true" className="h-5 w-5" />
                {CTA_LABEL}
              </MagneticCta>
              {/* Botón propio del hero (no .btn-secondary): el fondo es fijo y
                  oscuro, así que el botón también. */}
              <a
                href="#como-funciona"
                className="btn justify-center whitespace-nowrap border border-white/25 bg-white/10 !px-6 !py-3.5 text-base text-white backdrop-blur hover:bg-white/20"
              >
                Ver cómo funciona
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div data-anim="hero-visual" className="relative mx-auto mt-6 w-full max-w-[23rem] lg:mx-0 lg:ml-auto lg:mt-0 lg:max-w-[26rem]">
            <div aria-hidden="true" className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-accent-900/60 blur-2xl" />
            <div data-anim="hero-photo" className="relative">
              <HeroChat />
            </div>
          </div>
        </div>
      </section>
    </HeroStage>
  );
}

// ---------------------------------------------------------------------------
function RubroBand() {
  const names = RUBRO_PHOTOS.map((r) => r.name);
  const track = [...names, ...names];
  return (
    <section aria-labelledby="rubros-title" className="relative isolate overflow-hidden border-y border-white/5 bg-white/[0.015] py-14 sm:py-16">
      <Reveal className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 id="rubros-title" className="text-balance text-center font-display text-2xl font-bold text-ink sm:text-3xl">
          Para negocios donde el cliente vuelve
        </h2>
      </Reveal>
      <div aria-hidden="true" className="bg-dots mask-radial pointer-events-none absolute inset-0 -z-10" />
      <div className="mt-8">
        <RubroMarquee />
      </div>
      {/* Segunda cinta, tipográfica y en sentido contrario: da ritmo sin sumar
          información nueva, por eso va fuera del árbol de accesibilidad. */}
      <div aria-hidden="true" className="marquee-mask mt-6 overflow-hidden">
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
    <section className="relative isolate overflow-hidden py-16 md:py-24">
      <div aria-hidden="true" className="bg-grid-lines mask-fade-y pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <WordScrub
          text="Conseguir un cliente nuevo cuesta mucho más que hacer volver a uno que ya te compró. Casi ningún negocio chico trabaja la segunda parte."
          className="mx-auto max-w-5xl text-balance text-center font-display text-[1.75rem] font-bold leading-[1.2] tracking-tight text-ink sm:text-[2.6rem] sm:leading-[1.15]"
        />

        <Reveal className="mt-14 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
    <section id="cuanto-perdes" className="relative isolate scroll-mt-24 overflow-hidden py-16 md:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-drift-b absolute -right-24 top-20 h-[28rem] w-[28rem] rounded-full bg-accent-500/20 blur-[110px]" />
        <div className="animate-drift-a absolute -left-24 bottom-0 h-[26rem] w-[26rem] rounded-full bg-brand-400/15 blur-[110px]" />
        <div className="bg-grid-lines mask-radial absolute inset-0" />
      </div>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-4xl">
          <h2 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            El cliente que no vuelve no se queja. <span className="text-accent-600 dark:text-accent-300">Se va.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Ningún negocio chico lleva la cuenta de cuánta plata se le va por los que compraron una vez
            y nunca más aparecieron. Hacela acá con tus números.
          </p>
        </Reveal>

        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-3">
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
    <section id="que-incluye" className="relative isolate scroll-mt-24 overflow-hidden py-16 md:py-24">
      <div aria-hidden="true" className="bg-dots mask-radial pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-4xl">
          <h2 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Un solo panel, y nada que no vayas a usar.
          </h2>
        </Reveal>

        <RevealGroup className="mt-10 grid grid-flow-dense auto-rows-[minmax(15rem,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* A: mensajes */}
          <article
            data-reveal
            className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#100e1c] p-7 text-white sm:col-span-2 sm:row-span-2"
          >
            <Image
              src={msgPhoto.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover opacity-25 mix-blend-luminosity transition-transform duration-1000 ease-out group-hover:scale-105"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#100e1c] via-[#100e1c]/85 to-accent-900/40" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-500/30 blur-3xl" />
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
  surface: "bg-[#0e1019]/90 text-ink border border-white/10 backdrop-blur",
  accent: "bg-[#0e1019]/90 text-ink border border-white/10 backdrop-blur",
  brand: "bg-[#0e1019]/90 text-ink border border-white/10 backdrop-blur",
  ink: "bg-[#0e1019]/90 text-ink border border-white/10 backdrop-blur",
};
const STEP_MUTED = {
  surface: "text-ink-soft",
  accent: "text-ink-soft",
  brand: "text-ink-soft",
  ink: "text-ink-soft",
};
// Brillo y número de cada paso: violeta y verde alternados.
const STEP_GLOW = {
  surface: { glow: "bg-accent-500/25", num: "text-accent-400" },
  accent: { glow: "bg-brand-500/20", num: "text-brand-400" },
  brand: { glow: "bg-accent-500/25", num: "text-accent-400" },
  ink: { glow: "bg-brand-500/20", num: "text-brand-400" },
};

function StepsSection() {
  return (
    <section id="como-funciona" className="relative scroll-mt-24 py-16 md:py-24">
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
          <div className="mt-10 space-y-6">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                data-stack-card
                className="sticky"
                style={{ top: `calc(6.5rem + ${i * 1.25}rem)` }}
              >
                <article
                  data-stack-inner
                  className={`group grid origin-top overflow-hidden rounded-[2rem] shadow-pop md:min-h-[24rem] md:grid-cols-[1.1fr_0.9fr] ${STEP_TONES[s.tone]}`}
                >
                  <div className="relative flex flex-col justify-between gap-10 p-7 sm:p-10">
                    <div aria-hidden="true" className={`pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full blur-3xl ${STEP_GLOW[s.tone].glow}`} />
                    <span className={`relative font-display text-7xl font-bold leading-none tracking-tighter sm:text-8xl ${STEP_GLOW[s.tone].num}`}>
                      {i + 1}
                    </span>
                    <div className="relative">
                      <h3 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{s.title}</h3>
                      <p className={`mt-4 max-w-md text-base leading-relaxed sm:text-lg ${STEP_MUTED[s.tone]}`}>
                        {s.body}
                      </p>
                    </div>
                  </div>
                  {/* La pantalla de ese paso, dibujada con la interfaz real: antes
                      iba una foto de stock que no tenía relación con el texto. */}
                  <div aria-hidden="true" className="relative hidden items-center justify-center overflow-hidden p-8 md:flex">
                    <div className="bg-grid-move pointer-events-none absolute inset-0 opacity-50" />
                    <div className="relative w-full max-w-sm transition-transform duration-700 ease-out group-hover:-translate-y-1">
                      <StepVisual step={i} tone={s.tone} />
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </StackCards>

        <div className="mt-12 flex justify-center">
          <MagneticCta href={CTA_HREF} className="btn-primary whitespace-nowrap rounded-full !px-8 !py-4 text-base">
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            {CTA_LABEL}
          </MagneticCta>
        </div>
      </div>
    </section>
  );
}

type StepTone = keyof typeof STEP_TONES;

// Paneles de las ilustraciones de cada paso, según el color de la tarjeta.
const PANEL: Record<StepTone, { box: string; line: string; text: string; strong: string }> = {
  surface: { box: "bg-white/[0.05] ring-1 ring-inset ring-white/10", line: "bg-white/10", text: "text-ink-muted", strong: "text-white" },
  accent: { box: "bg-white/[0.05] ring-1 ring-inset ring-white/10", line: "bg-white/10", text: "text-ink-muted", strong: "text-white" },
  brand: { box: "bg-white/[0.05] ring-1 ring-inset ring-white/10", line: "bg-white/10", text: "text-ink-muted", strong: "text-white" },
  ink: { box: "bg-white/[0.05] ring-1 ring-inset ring-white/10", line: "bg-white/10", text: "text-ink-muted", strong: "text-white" },
};

function StepVisual({ step, tone }: { step: number; tone: StepTone }) {
  const p = PANEL[tone];
  if (step === 0) {
    return (
      <div className={`rounded-2xl p-4 shadow-pop ${p.box}`}>
        <div className={`flex items-center gap-2 text-xs font-semibold ${p.strong}`}>
          <FileSpreadsheet className="h-4 w-4" /> clientes.xlsx
        </div>
        <div className="mt-3 space-y-2">
          {["María González", "Juan Pérez", "Laura Sosa", "Diego Ruiz"].map((n, k) => (
            <div key={n} className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-[10px] font-bold text-brand-950">
                {n.split(" ").map((w) => w[0]).join("")}
              </span>
              <span className={`flex-1 text-xs font-medium ${p.strong}`}>{n}</span>
              <Check className={`h-4 w-4 ${k < 3 ? "text-brand-500" : p.text}`} />
            </div>
          ))}
        </div>
        <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${p.line}`}>
          <div className="h-full w-3/4 rounded-full bg-brand-500" />
        </div>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className={`space-y-2.5 rounded-2xl p-4 shadow-pop ${p.box}`}>
        {SEGMENTS.map((sg) => (
          <div key={sg.name} className="flex items-center gap-3">
            <span className={`w-20 text-xs font-semibold ${p.strong}`}>{sg.name}</span>
            <span className={`h-2.5 flex-1 overflow-hidden rounded-full ${p.line}`}>
              <span className={`block h-full rounded-full ${sg.tone}`} style={{ width: `${sg.pct * 2.4}%` }} />
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className={`rounded-2xl p-4 shadow-pop ${p.box}`}>
        <p className={`font-display text-[11px] font-semibold uppercase tracking-[0.14em] ${p.text}`}>Tu plan de hoy</p>
        <div className="mt-3 space-y-2">
          {[
            { n: "Cumpleaños", c: 3, icon: Cake },
            { n: "Hora de volver", c: 9, icon: Send },
            { n: "Reactivación", c: 4, icon: TrendingUp },
          ].map((r) => (
            <div key={r.n} className="flex items-center gap-2.5">
              <span className={`grid h-8 w-8 place-items-center rounded-xl ${p.line}`}>
                <r.icon className={`h-4 w-4 ${p.strong}`} />
              </span>
              <span className={`flex-1 text-sm font-semibold ${p.strong}`}>{r.n}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.line} ${p.strong}`}>{r.c}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-md bg-[#005c4b] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#e9edef] shadow-pop">
        ¡Hola Juan! Ya pasaron unas semanas de tu último corte. ¿Te guardo un lugar?
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-pop">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-brand-950">
          <Check className="h-5 w-5" strokeWidth={3} />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold text-brand-950">Juan volvió</span>
          <span className="block text-xs text-brand-900/60">2 días después del mensaje</span>
        </span>
      </div>
    </div>
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
    <section id="por-rubro" className="relative isolate scroll-mt-24 overflow-hidden border-t border-white/5 py-16 md:py-24">
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
        <Reveal className="mt-10">
          <RubroCampaigns items={buildShowcase()} />
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
function TrustSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#0e1019]/90 px-7 py-12 backdrop-blur sm:px-14 sm:py-16">
            <Aurora className="opacity-60" />
            <div aria-hidden="true" className="bg-grid-move pointer-events-none absolute inset-0 opacity-40" />
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
                      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t.body}</p>
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
    <section id="preguntas" className="scroll-mt-24 pb-16 md:pb-24">
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
      <div className="grain relative isolate overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-accent-600 via-accent-700 to-accent-900 px-6 py-20 text-center shadow-pop sm:py-28">
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
        </nav>
      </div>
      <p className="mt-8 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} Vuelvo CRM · Desarrollado por GUTMARK
      </p>
    </footer>
  );
}
