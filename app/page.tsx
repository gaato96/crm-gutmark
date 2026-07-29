import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Cake,
  CheckCircle2,
  FileSpreadsheet,
  HeartHandshake,
  MessageCircle,
  Puzzle,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { businessWhatsappLink } from "@/lib/messages";
import { HeroVideo } from "@/components/landing/hero-video";
import { ThemeToggle } from "@/components/theme-toggle";
import { Reveal } from "@/components/landing/reveal";
import { LoyaltyCard } from "@/components/landing/loyalty-card";
import { HeroStage } from "@/components/landing/hero-stage";
import { WordScrub } from "@/components/landing/word-scrub";
import { StepFlow } from "@/components/landing/step-flow";
import { RubroMarquee } from "@/components/landing/rubro-marquee";
import { MagneticCta } from "@/components/landing/magnetic-cta";
import { Logo } from "@/components/logo";

const CTA_MESSAGE = "¡Hola! Quiero pedir acceso a Vuelvo para mi negocio.";

// Un solo texto por intención en toda la página: el botón de WhatsApp dice
// siempre "Pedir acceso", nunca "Escribinos" ni "Empezar".
const CTA_LABEL = "Pedir acceso";

const PAIN_POINTS = [
  {
    title: "Compró una vez y nunca más supiste de él",
    detail: "Sin un registro, cada venta empieza y termina en sí misma.",
  },
  {
    title: "Se te pasó el cumpleaños de una clienta de siempre",
    detail: "Un saludo a tiempo rinde más que cualquier publicidad paga.",
  },
  {
    title: "No sabés quiénes son tus mejores clientes",
    detail: "Ni cuánto gastan, ni hace cuánto que no aparecen por el local.",
  },
  {
    title: "Avisar una promoción te lleva la tarde entera",
    detail: "Escribís uno por uno y aun así te salteás la mitad de la lista.",
  },
];

const STEPS = [
  {
    title: "Cargá tu cartera",
    body: "Nombre, teléfono, cumpleaños y las compras que ya te hicieron. A mano, o importando el Excel que venís usando hace años.",
  },
  {
    title: "Se ordena sola",
    body: "Cada cliente queda clasificado en VIP, frecuente, ocasional, nuevo o inactivo, y se reacomoda con cada compra que registrás.",
  },
  {
    title: "Te avisa a quién escribirle",
    body: "Los cumpleaños de la semana y los clientes que ya deberían haber vuelto te esperan cada mañana en el panel.",
  },
  {
    title: "Escribís en un clic",
    body: "El mensaje sale redactado y con el nombre puesto. Lo revisás, lo mandás por WhatsApp y volvés a atender.",
  },
];

const SEGMENTS = [
  { name: "VIP", tone: "bg-gold-500/15 text-gold-700 dark:text-gold-300" },
  { name: "Frecuente", tone: "bg-brand-500/15 text-brand-700 dark:text-brand-300" },
  { name: "Ocasional", tone: "bg-surface-3 text-ink-soft" },
  { name: "Nuevo", tone: "bg-brand-500/10 text-brand-600 dark:text-brand-400" },
  { name: "Inactivo", tone: "bg-rose-500/12 text-rose-600 dark:text-rose-400" },
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

export default async function LandingPage() {
  const session = await getSessionUser();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen overflow-x-hidden bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido principal
      </a>
      <Nav />
      <main id="main-content">
        <Hero />
        <RubroSection />
        <ProblemSection />
        <HowItWorks />
        <WhatsInside />
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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo size="sm" />

        <nav aria-label="Secciones" className="hidden items-center gap-7 md:flex">
          <a
            href="#como-funciona"
            className="text-sm font-medium text-ink-soft transition hover:text-ink"
          >
            Cómo funciona
          </a>
          <a
            href="#que-incluye"
            className="text-sm font-medium text-ink-soft transition hover:text-ink"
          >
            Qué incluye
          </a>
        </nav>

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
            <MessageCircle aria-hidden="true" className="h-4 w-4" /> {CTA_LABEL}
          </a>
        </div>
      </div>
    </header>
  );
}

/**
 * El hero es la única banda que se queda oscura en los dos temas.
 *
 * Es a propósito: sobre un video no se puede garantizar contraste con tokens
 * que cambian de valor según el tema, así que el scrim y el texto quedan fijos
 * y el contraste se calcula una sola vez. El borde inferior se funde a `canvas`
 * para que el corte hacia la sección siguiente no se note en ningún tema.
 *
 * Por eso acá NO se usan `text-ink` ni `bg-surface`: sobre este fondo, en modo
 * claro, serían texto oscuro sobre negro.
 */
function Hero() {
  return (
    <HeroStage>
      <section className="relative flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden bg-brand-950">
        {/* Capa 1: el video. Va detrás de todo y no aporta significado. */}
        <HeroVideo
          src="/hero.mp4"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Capa 2: base plana. Fija el piso de oscuridad pase lo que pase en el
            video, así ningún cuadro claro se come el titular. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-brand-950/45"
        />

        {/* Capa 3, mobile: scrim parejo. Acá el texto ocupa todo el ancho, así
            que un degradado horizontal dejaría el final de cada renglón sobre
            la parte más clara. Con el peor cuadro posible del video (un píxel
            blanco) esto da 9:1 en el titular y 8:1 en la bajada. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-brand-950/70 lg:hidden"
        />

        {/* Capa 3, desktop: scrim direccional. El texto vive en la mitad
            izquierda, que queda casi opaca (peor caso 10:1), y hacia la derecha
            baja a ~56% para que el video se vea de verdad. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-brand-950 via-brand-950/80 to-brand-950/20 lg:block"
        />

        {/* Capa 4: fundido inferior hacia el color de fondo del tema activo. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas"
        />
        {/* Capa 5: luz de marca a la deriva. Le mete verde y dorado propios al
            video, que viene con su propio color, y unifica la paleta. */}
        <div
          aria-hidden="true"
          className="grain pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="animate-drift-a absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand-400/20 blur-3xl" />
          <div className="animate-drift-b absolute -right-32 top-40 h-[24rem] w-[24rem] rounded-full bg-gold-400/[0.14] blur-3xl" />
          <div className="animate-drift-b absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-brand-300/10 blur-3xl [animation-duration:32s]" />
        </div>

        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
          <div>
            <span
              data-anim="hero-item"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200 ring-1 ring-inset ring-white/15 backdrop-blur"
            >
              <HeartHandshake aria-hidden="true" className="h-3.5 w-3.5" />
              Fidelización para PYMES
            </span>

            <h1
              data-anim="hero-item"
              className="mt-5 max-w-2xl text-balance font-display text-[2.35rem] leading-[1.08] tracking-tight text-white sm:text-[2.9rem] lg:text-[3.25rem]"
            >
              Vendé más <span className="text-brand-300">sin conseguir</span> un
              solo cliente nuevo.
            </h1>

            <p
              data-anim="hero-item"
              className="mt-6 max-w-xl text-lg leading-relaxed text-brand-100"
            >
              Conocé a los clientes que ya tenés, acordate de todos, y hacelos
              volver antes de que se olviden de vos.
            </p>

            <div
              data-anim="hero-item"
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <MagneticCta
                href={businessWhatsappLink(CTA_MESSAGE)}
                className="btn-gold justify-center whitespace-nowrap !px-7 !py-3.5 text-base"
              >
                <MessageCircle aria-hidden="true" className="h-5 w-5" />
                {CTA_LABEL}
              </MagneticCta>
              {/* Botón propio del hero y no `.btn-secondary`: ese usa tokens de
                  tema y en modo claro sería un botón blanco con texto oscuro
                  sobre un fondo negro. Acá el fondo es fijo, así que el botón
                  también. */}
              <a
                href="#como-funciona"
                className="btn justify-center whitespace-nowrap border border-white/25 bg-white/10 !px-6 !py-3.5 text-base text-white backdrop-blur hover:bg-white/20"
              >
                Ver cómo funciona
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Foto de contexto con la tarjeta apoyada en una esquina. La tarjeta
              ya no compite con una foto: el video es el fondo y la tarjeta es
              el único objeto sólido, así que puede respirar y crecer. */}
          <div
            data-anim="hero-visual"
            className="relative mx-auto w-full max-w-[19rem] lg:mx-0 lg:ml-auto lg:max-w-[20rem]"
          >
            {/* Halo detrás de la tarjeta: la despega del video, que en esa zona
                del scrim es la parte más clara del hero. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-brand-950/50 blur-2xl"
            />

            <div data-anim="hero-photo" className="relative">
              <LoyaltyCard />

              {/* Aviso de cumpleaños, montado en la esquina superior. Es el
                  gancho del producto: el dato que el negocio hoy se pierde. */}
              <div className="absolute -right-3 -top-5 flex items-center gap-2.5 rounded-2xl bg-white/95 px-3 py-2 shadow-pop ring-1 ring-black/5 backdrop-blur sm:-right-6">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-500/20 text-gold-700">
                  <Cake aria-hidden="true" className="h-3.5 w-3.5" />
                </div>
                <div className="leading-tight">
                  <div className="text-[11px] font-bold text-brand-950">
                    Cumple hoy
                  </div>
                  <div className="text-[10px] text-brand-900/60">
                    María González
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </HeroStage>
  );
}

function RubroSection() {
  return (
    <section className="border-y border-line bg-surface-2/50 py-14 sm:py-16">
      <Reveal className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 className="text-balance text-center font-display text-2xl text-ink sm:text-3xl">
          Para negocios donde el cliente vuelve
        </h2>
      </Reveal>
      <div className="mt-9">
        <RubroMarquee />
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <WordScrub
        text="Conseguir un cliente nuevo cuesta mucho más que hacer volver a uno que ya te compró. Casi ningún negocio chico trabaja la segunda parte."
        className="mx-auto max-w-4xl text-balance text-center font-display text-2xl leading-snug text-ink sm:text-[2.1rem] sm:leading-[1.28]"
      />

      <Reveal className="mt-16">
        <h3 className="font-display text-2xl text-ink">¿Te suena familiar?</h3>
      </Reveal>

      <div className="mt-6 grid gap-x-12 sm:grid-cols-2">
        {PAIN_POINTS.map((p, i) => (
          <Reveal key={p.title} delay={i * 70}>
            <div className="flex items-start gap-5 border-t border-line py-6">
              <span className="mt-0.5 font-mono text-sm font-bold tabular-nums text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h4 className="font-semibold leading-snug text-ink">{p.title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {p.detail}
                </p>
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
      className="scroll-mt-20 border-y border-line bg-surface-2/40 py-24 sm:py-32"
    >
      <div className="mx-auto grid max-w-6xl gap-14 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        {/* Centrado vertical y no pegado arriba: la columna de pasos es mucho
            más alta y con `self-start` el título quedaba flotando solo contra
            un bloque de espacio vacío. */}
        <div className="lg:self-center">
          <h2 className="text-balance font-display text-3xl leading-tight text-ink sm:text-4xl">
            De la primera venta al cliente que vuelve
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-ink-muted">
            Cuatro pasos. El primero lo hacés una vez, con nosotros al lado. Los
            otros tres corren solos mientras vos atendés.
          </p>
          <MagneticCta
            href={businessWhatsappLink(CTA_MESSAGE)}
            className="btn-primary mt-8 whitespace-nowrap !px-6 !py-3"
          >
            <MessageCircle aria-hidden="true" className="h-4 w-4" />
            {CTA_LABEL}
          </MagneticCta>
        </div>

        <StepFlow>
          {STEPS.map((step, i) => (
            <li key={step.title} data-step className="relative sm:pl-16">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-brand-600 font-mono text-sm font-bold text-white sm:absolute sm:left-0 sm:top-0 sm:mb-0">
                {i + 1}
              </span>
              <h3 className="font-display text-xl text-ink sm:text-2xl">
                {step.title}
              </h3>
              <p className="mt-2.5 max-w-lg leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </li>
          ))}
        </StepFlow>
      </div>
    </section>
  );
}

function WhatsInside() {
  return (
    <section
      id="que-incluye"
      className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32"
    >
      <Reveal className="max-w-2xl">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
          Qué incluye
        </span>
        <h2 className="mt-3 text-balance font-display text-3xl leading-tight text-ink sm:text-4xl">
          Un solo panel, y nada que no vayas a usar
        </h2>
      </Reveal>

      {/* Reparto: 3 columnas x 3 filas = 9 espacios, 9 ocupados.
          Segmentación ocupa 2 columnas pero UNA sola fila (antes era 2x2 y le
          sobraba media celda de aire); Mensajes es el único alto, que es lo que
          la burbuja de chat necesita; Módulos cierra a lo ancho. */}
      <div className="mt-12 grid auto-rows-[minmax(12rem,auto)] grid-flow-dense gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Segmentación: ancha y baja */}
        <Reveal className="sm:col-span-2">
          <div className="card flex h-full flex-col justify-between gap-5 overflow-hidden p-6 sm:p-7">
            <div>
              <h3 className="font-display text-2xl text-ink">
                Segmentación automática
              </h3>
              <p className="mt-2.5 max-w-lg leading-relaxed text-ink-muted">
                No completás ninguna categoría a mano. El sistema mira cuánto
                gastó cada cliente y hace cuánto no vuelve, y lo reubica solo con
                cada venta que registrás.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SEGMENTS.map((s) => (
                <span key={s.name} className={`badge ring-0 ${s.tone}`}>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Mensajes: la única celda alta. La burbuja es un objeto real de
            WhatsApp, no una captura del panel simulada con divs. */}
        <Reveal className="sm:row-span-2">
          <div className="card grain relative flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 to-brand-900 p-6">
            <div className="relative">
              <div className="flex items-center gap-2 text-brand-100">
                <Send aria-hidden="true" className="h-4 w-4" />
                <span className="text-sm font-semibold">Mensajes listos</span>
              </div>
              <div className="mt-5 rounded-2xl rounded-tl-md bg-white/95 p-3.5 text-[13px] leading-relaxed text-brand-950 shadow-pop">
                ¡Hola Valentina! Vimos que se viene tu cumple. Pasá esta semana
                por Perfumería Bella y te hacemos 15% off.
              </div>
              <div className="mt-3 flex justify-end">
                <div className="rounded-2xl rounded-tr-md bg-brand-600/70 p-3 text-[13px] leading-relaxed text-white ring-1 ring-white/10">
                  ¡Gracias! Paso el jueves.
                </div>
              </div>
            </div>
            <p className="relative mt-6 text-xs leading-relaxed text-brand-200">
              Sale redactado y con el nombre puesto. Vos lo revisás y lo mandás.
            </p>
          </div>
        </Reveal>

        {/* Recordatorios */}
        <Reveal>
          <div className="card flex h-full flex-col justify-between p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold-500/15 text-gold-600 dark:text-gold-400">
              <Cake aria-hidden="true" className="h-5 w-5" />
            </div>
            <div className="mt-6">
              <h3 className="font-bold text-ink">Recordatorios diarios</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                Los cumpleaños de la semana y quién ya debería haber vuelto, en
                la primera pantalla del panel.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Excel */}
        <Reveal>
          <div className="card flex h-full flex-col justify-between p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/12 text-brand-600 dark:text-brand-400">
              <FileSpreadsheet aria-hidden="true" className="h-5 w-5" />
            </div>
            <div className="mt-6">
              <h3 className="font-bold text-ink">Tu Excel entra y sale</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                Importás la planilla que ya tenés y bajás tu cartera completa
                cuando quieras. Los datos siguen siendo tuyos.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Módulos: cierra a lo ancho */}
        <Reveal className="sm:col-span-2 lg:col-span-3">
          <div className="card flex h-full flex-col justify-center gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brand-600 dark:text-brand-400">
                <Puzzle aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-ink">
                  Sumá módulos cuando los necesites
                </h3>
                <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-ink-muted">
                  Puntos y beneficios, stock, punto de venta, caja, turnos,
                  catálogo digital. Se activan de a uno y solo pagás los que uses.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              {["Puntos", "Stock", "Caja", "Turnos", "Reportes"].map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-semibold text-ink-soft"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="border-y border-line bg-surface-2/40 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* Banda tipográfica, sin foto. La foto de stock que había acá (una
            florería) no tenía relación con el producto y leía como relleno.
            TODO: cuando exista la imagen de marca generada, va de fondo acá
            con un `bg-gradient-to-r from-brand-950/85` encima para el contraste. */}
        <Reveal>
          <div className="grain relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 px-7 py-14 sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-gold-400/15 blur-3xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="max-w-lg text-balance font-display text-3xl leading-tight text-white sm:text-4xl">
                Simple de usar, serio para confiar
              </h2>
              <p className="max-w-xs text-sm leading-relaxed text-brand-200">
                Lo construimos para negocios que atienden de verdad, con la
                cartera de clientes como el activo más valioso que tienen.
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {TRUST.map((t, i) => (
            <Reveal key={t.title} delay={i * 80}>
              <div>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/12 text-brand-600 dark:text-brand-400">
                  <t.icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-ink">{t.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {t.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <Reveal>
        <div className="grain relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 px-6 py-16 text-center shadow-pop sm:px-12 sm:py-24">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-brand-400/15 blur-3xl" />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl leading-tight text-white sm:text-[2.75rem]">
              Empezá a fidelizar esta semana
            </h2>
            <p className="mx-auto mt-5 max-w-md leading-relaxed text-brand-100">
              Escribinos por WhatsApp y dejamos tu cuenta andando con tu cartera
              cargada.
            </p>
            <div className="mt-9 flex flex-col items-center gap-4">
              <MagneticCta
                href={businessWhatsappLink(CTA_MESSAGE)}
                className="btn-gold whitespace-nowrap !px-8 !py-4 text-base"
              >
                <MessageCircle aria-hidden="true" className="h-5 w-5" />
                {CTA_LABEL}
              </MagneticCta>
              <span className="inline-flex items-center gap-1.5 text-sm text-brand-200">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                Te contestamos nosotros, no un bot
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
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center sm:flex-row sm:justify-between sm:px-8 sm:text-left">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" />
          <div className="text-xs text-ink-muted">
            Fidelización para PYMES argentinas
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
        © {new Date().getFullYear()} Vuelvo
      </p>
    </footer>
  );
}
