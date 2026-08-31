import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Sparkles,
  ListChecks,
  LayoutDashboard,
  Users,
  Tags,
  Target,
  BellRing,
  Send,
  Blocks,
  Settings,
  ShoppingBag,
  Gift,
  Wallet,
  MessageCircle,
  Mail,
  Cake,
  Clock,
  Repeat,
  Wallet2,
  Users2,
  CalendarClock,
  BadgeCheck,
  Lightbulb,
  HelpCircle,
  CheckCircle2,
  Package,
  ScanBarcode,
  LayoutGrid,
  BookUser,
  Receipt,
} from "lucide-react";
import { getCurrentBusiness } from "@/lib/queries";
import { catalogWords, rubroLabel } from "@/lib/rubros";
import { SEGMENT_META, type Segment } from "@/lib/segmentation";
import { MODULE_SEED, isModuleImplemented, type ModuleCode } from "@/lib/modules";
import { TRIGGER_META, type TriggerType } from "@/lib/campaigns";
import { formatMoney } from "@/lib/format";
import { businessWhatsappLink } from "@/lib/messages";
import { SegmentBadge } from "@/components/ui";
import { Logo } from "@/components/logo";

// Guía interna de onboarding. Vive dentro de (app) a propósito: solo la ve
// quien ya tiene sesión con un negocio (no es pública como la landing), y por
// eso no hace falta un slug secreto como el de app/panel-mkt-9f3e7ab2 — acá el
// control de acceso real es la sesión, no la URL. El `robots: noindex` de
// abajo es un cinturón extra para que no aparezca en buscadores.
export const metadata: Metadata = {
  title: "Guía · Vuelvo CRM",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const MODULE_ICONS: Record<ModuleCode, typeof Package> = {
  puntos: Gift,
  stock: Package,
  pos: ScanBarcode,
  caja: Wallet,
  gastos: Receipt,
  "cuenta-corriente": BookUser,
  turnos: CalendarClock,
  catalogo: LayoutGrid,
};

export default async function GuiaPage() {
  const biz = await getCurrentBusiness();
  const words = catalogWords(biz.catalogMode);
  const activeModules = new Set(biz.modules);

  const waLink = businessWhatsappLink(
    `¡Hola! Soy de ${biz.name}. Tengo una consulta sobre cómo usar Vuelvo CRM.`
  );

  return (
    <div className="animate-fade-in pb-16">
      {/* Portada */}
      <div className="mb-8 overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="relative bg-accent-600 px-6 py-10 sm:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 20%, rgb(255 255 255 / 0.14), transparent 45%), radial-gradient(circle at 85% 80%, rgb(0 190 134 / 0.35), transparent 50%)",
            }}
          />
          <div className="relative">
            <Logo tone="onBrand" size="md" />
            <h1 className="mt-6 max-w-2xl font-display text-[1.9rem] font-bold leading-tight text-white sm:text-4xl">
              Guía de {biz.name} en Vuelvo CRM
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
              Todo lo que el sistema puede hacer por vos, explicado con ejemplos concretos
              para {rubroLabel(biz.rubro).toLowerCase()}. Porque vender una vez no alcanza —
              esto es para que los clientes que ya conseguiste, vuelvan.
            </p>
          </div>
        </div>

        {/* Índice rápido */}
        <nav className="flex flex-wrap gap-2 p-5 sm:p-6" aria-label="Índice de la guía">
          {TOC.map((t) => (
            <a
              key={t.href}
              href={t.href}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3.5 py-2 text-xs font-semibold text-ink-soft ring-1 ring-inset ring-line transition hover:bg-brand-500/15 hover:text-brand-700 dark:hover:text-brand-300"
            >
              {t.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Primeros pasos */}
      <Section id="primeros-pasos" icon={<ListChecks className="h-5 w-5" />} title="Primeros pasos">
        <p className="text-sm text-ink-muted">
          Con esto listo, el sistema ya trabaja solo: calcula segmentos, arma audiencias de
          campaña y te avisa a quién contactar cada día.
        </p>
        <ol className="mt-5 space-y-4">
          <Step n={1} title="Revisá tu rubro en Configuración">
            De ahí sale el vocabulario de toda la app: si vendés {words.plural}, el sistema
            habla de "{words.singular}" y no te va a preguntar "¿qué servicio hizo" si en
            realidad vendés productos.
          </Step>
          <Step n={2} title={`Cargá tu ${words.title.toLowerCase()}`}>
            En <b>{words.nav}</b> cargás lo que vendés con su precio y, si querés, cada
            cuánto se repite (ej: "{words.ejemplo}" cada 15 días). Con eso cargado, después
            elegís de una lista al vender — sin tipear montos a mano — y podés armar
            campañas por ítem específico.
          </Step>
          <Step n={3} title="Cargá o importá tus clientes actuales">
            Uno por uno desde <b>Clientes → Nuevo cliente</b>, o de una sola vez desde{" "}
            <b>Clientes → Importar</b> subiendo un Excel/CSV con lo que ya tengas (nombre,
            teléfono, cumpleaños si lo sabés). Cuantos más clientes viejos cargues ahora, antes
            empieza a avisarte el sistema quién dejó de venir.
          </Step>
          <Step n={4} title="Revisá las 2 campañas que ya vienen activas">
            Todo negocio arranca con <b>Cumpleaños</b> y <b>Recompra</b> ya creadas y
            prendidas — solo el texto viene genérico. Andá a <b>Campañas → Mis campañas</b> y
            reescribí el mensaje con tu tono, tu beneficio y el nombre real de tu negocio.
          </Step>
        </ol>
      </Section>

      {/* Recorrido por el menú */}
      <Section id="recorrido" icon={<LayoutDashboard className="h-5 w-5" />} title="Qué hace cada pantalla">
        <p className="text-sm text-ink-muted">
          El menú de la izquierda tiene siempre estas pantallas — son el plan base, nunca se
          pagan aparte.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <NavCard icon={<LayoutDashboard className="h-4 w-4" />} title="Inicio">
            El resumen del día: cumpleaños próximos, clientes por perder, y un pantallazo de
            cómo viene el negocio. Es lo primero que conviene mirar cada mañana.
          </NavCard>
          <NavCard icon={<Users className="h-4 w-4" />} title="Clientes">
            La ficha completa de cada uno: historial de compras, notas propias (útiles para
            recordar preferencias — "usa tinte sin amoníaco", "alérgico al alimento X"),
            puntos si tenés el módulo, y el botón de registrar una venta puntual.
          </NavCard>
          <NavCard icon={<Tags className="h-4 w-4" />} title={words.nav}>
            {words.subtitle}
          </NavCard>
          <NavCard icon={<Target className="h-4 w-4" />} title="Segmentos">
            Clasifica sola a cada cliente en VIP, Frecuente, Ocasional, Nuevo o Inactivo —
            ver la sección <a href="#segmentos" className="underline decoration-dotted underline-offset-2">Segmentos</a> más abajo. No cargás nada acá, solo mirás.
          </NavCard>
          <NavCard icon={<BellRing className="h-4 w-4" />} title="Recordatorios">
            La versión "de hoy" de tus campañas: quién cumple años esta semana, quién está por
            vencer su recompra, ya con el link de WhatsApp listo para tocar y enviar.
          </NavCard>
          <NavCard icon={<Send className="h-4 w-4" />} title="Campañas">
            Donde armás y editás tus propias campañas, y desde donde efectivamente enviás los
            mensajes. Ver la sección <a href="#campanas" className="underline decoration-dotted underline-offset-2">Campañas</a>, es la parte más potente del sistema.
          </NavCard>
          <NavCard icon={<Blocks className="h-4 w-4" />} title="Módulos">
            Catálogo de funciones extra que podés sumar cuando las necesites (Puntos, Caja,
            etc.). Ver la sección <a href="#modulos" className="underline decoration-dotted underline-offset-2">Módulos</a>.
          </NavCard>
          <NavCard icon={<Settings className="h-4 w-4" />} title="Configuración">
            Los números que usa todo lo anterior: cada cuánto se considera "inactivo" un
            cliente, cuánto tiene que gastar para ser VIP, tu rubro, y tu contraseña.
          </NavCard>
        </div>
      </Section>

      {/* Ventas */}
      <Section id="ventas" icon={<ShoppingBag className="h-5 w-5" />} title="Registrar una venta">
        <p className="text-sm text-ink-muted">
          Es la acción que más vas a repetir, así que tiene tres atajos: el botón{" "}
          <b>Nueva venta</b> arriba de todo, el botón <Plus className="inline h-3.5 w-3.5" />{" "}
          flotante en el celular, y la tecla <kbd className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-bold ring-1 ring-inset ring-line">N</kbd> del
          teclado (con foco fuera de un campo de texto).
        </p>
        <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
          <ListItem>
            Elegís al cliente (o cargás uno nuevo ahí mismo, sin salir del modal) y después los{" "}
            {words.plural} que compró: se van sumando a una lista con cantidad y precio
            editable, por si pactaste otro valor.
          </ListItem>
          <ListItem>
            Sumás un <b>descuento</b> si corresponde y elegís el <b>método de pago</b>
            (efectivo, débito, crédito, transferencia, Mercado Pago). Esto importa de verdad si
            tenés el módulo Caja: solo el efectivo cuenta para el arqueo.
          </ListItem>
          <ListItem>
            Con el módulo Caja activo, además elegís <b>quién {words.sellerLabel.toLowerCase().replace("¿quién ", "").replace("?", "")}</b> — así después sabés cuánta comisión se le debe a cada uno.
          </ListItem>
        </ul>
        <Tip>
          El monto que queda registrado es lo que <b>efectivamente cobraste</b> (precio menos
          descuento). Los puntos, las comisiones y los reportes se calculan siempre sobre ese
          número, nunca sobre el precio de lista.
        </Tip>
      </Section>

      {/* Segmentos */}
      <Section id="segmentos" icon={<Target className="h-5 w-5" />} title="Cómo se arma cada segmento">
        <p className="text-sm text-ink-muted">
          Nadie clasifica clientes a mano: el sistema mira el historial de compras de cada uno
          y lo ubica solo. Se recalcula en cada pantalla, así que si un cliente compra hoy,
          hoy mismo puede cambiar de segmento.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="pb-2 pr-4 font-semibold">Segmento</th>
                <th className="pb-2 font-semibold">Cuándo cae ahí un cliente</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(SEGMENT_META) as Segment[]).map((seg) => (
                <tr key={seg} className="border-b border-line-soft last:border-0">
                  <td className="py-3 pr-4 align-top">
                    <SegmentBadge segment={seg} />
                  </td>
                  <td className="py-3 align-top text-ink-soft">{SEGMENT_META[seg].description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ConfigNumber label="Días para considerarse inactivo" value={`${biz.inactivityDays} días`} />
          <ConfigNumber label={`Recompra esperada (general)`} value={`${biz.recompraDays} días`} />
          <ConfigNumber label="Gasto mínimo para ser VIP" value={formatMoney(biz.vipMinSpend)} />
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Estos tres números son los que hoy tenés cargados en Configuración. Ajustalos ahí
          cuando quieras: por ejemplo, si tu ticket promedio es alto, quizás el umbral VIP te
          quede corto y todo el mundo termine siendo VIP (con lo cual deja de ser especial).
        </p>
      </Section>

      {/* Campañas */}
      <Section id="campanas" icon={<Send className="h-5 w-5" />} title="Campañas: el corazón del sistema">
        <p className="text-sm text-ink-soft">
          Una campaña junta dos cosas en una sola ficha: <b>a quién le llega</b> (el
          disparador) y <b>qué le decís</b> (el mensaje de WhatsApp y de email). No hay envío
          automático masivo: vos tocás el botón, se abre WhatsApp con el mensaje ya escrito
          para ese cliente puntual, y lo mandás. El sistema arma la lista y el texto; el envío
          lo hacés vos, uno por uno, con dos toques.
        </p>

        <h3 className="mt-6 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
          Tipos de disparador
        </h3>
        <div className="mt-3 space-y-3">
          {(Object.keys(TRIGGER_META) as TriggerType[])
            .filter((t) => t !== "all")
            .map((t) => (
              <TriggerRow key={t} type={t} />
            ))}
          <TriggerRow type="all" />
        </div>

        <h3 className="mt-8 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
          Variables para personalizar el mensaje
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          Escribilas tal cual, entre llaves, en cualquier parte del texto. Si escribís una mal
          (<code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs">{"{nombree}"}</code>),
          queda visible tal cual en el mensaje en vez de desaparecer — así lo notás antes de
          mandarlo, no después.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "{nombre}", "{apellido}", "{negocio}", "{ultima_compra}", "{dias_sin_comprar}",
            "{total_gastado}", "{puntos}", "{cumple}", "{servicio}",
          ].map((v) => (
            <code key={v} className="rounded-lg bg-surface-2 px-2.5 py-1.5 font-mono text-xs text-ink-soft ring-1 ring-inset ring-line">
              {v}
            </code>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          <code className="font-mono">{"{servicio}"}</code> solo tiene valor con el disparador
          "{words.singular} + días desde esa compra", y <code className="font-mono">{"{puntos}"}</code> solo si tenés el módulo Puntos activo.
        </p>

        <h3 className="mt-8 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
          Estrategias que funcionan
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          Ejemplos listos para adaptar a {biz.name}. La idea no es mandar todas juntas: elegí
          2 o 3 para arrancar y sumá el resto con el tiempo.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <StrategyCard
            icon={<Cake className="h-4 w-4" />}
            title="Cumpleaños con beneficio (ya viene armada)"
            trigger="Cumpleaños · 7 días de anticipación"
          >
            Avisa antes de la fecha para que el cliente tenga tiempo de venir. La clave es que
            el beneficio sea concreto y con vencimiento corto ("esta semana"), no un genérico
            "feliz cumple" sin motivo para pasar por el local.
            <Example channel="whatsapp">
              ¡Hola {"{nombre}"}! 🎂 De parte de {"{negocio}"} te deseamos un muy feliz
              cumpleaños. Tenés un 15% en tu próxima visita esta semana. ¡Te esperamos!
            </Example>
          </StrategyCard>

          <StrategyCard
            icon={<Repeat className="h-4 w-4" />}
            title="Recompra general (ya viene armada)"
            trigger={`Tiempo sin comprar · ${biz.recompraDays} días (excluye inactivos)`}
          >
            Para el que se está por perder, pero todavía no hace tanto que no viene. Por eso
            excluye a los ya <SegmentBadge segment="inactivo" /> — a ellos les toca un mensaje
            distinto, más de reactivación que de recordatorio.
            <Example channel="whatsapp">
              ¡Hola {"{nombre}"}! 👋 Hace {"{dias_sin_comprar}"} días que no te vemos por{" "}
              {"{negocio}"} y te extrañamos. Si venís esta semana, tenés un beneficio especial
              esperándote.
            </Example>
          </StrategyCard>

          <StrategyCard
            icon={<Clock className="h-4 w-4" />}
            title={`Por ${words.singular} específico`}
            trigger={`${words.singular[0].toUpperCase() + words.singular.slice(1)} + días desde esa compra`}
          >
            La más precisa: cada {words.singular} puede tener su propio tiempo de recompra
            (un {words.ejemplo.toLowerCase()} no vuelve al mismo ritmo que otra cosa). Usá "
            <b>Cualquier {words.singular}</b>" en el selector para armar UNA sola campaña que
            cubra todo tu {words.nav.toLowerCase()}, en vez de repetir la misma campaña ítem
            por ítem — el mensaje se arma solo con <code className="font-mono text-xs">{"{servicio}"}</code>.
            <Example channel="whatsapp">
              ¡Hola {"{nombre}"}! Ya pasó un tiempo desde tu último {"{servicio}"} en{" "}
              {"{negocio}"}. ¿Coordinamos tu próxima visita?
            </Example>
          </StrategyCard>

          <StrategyCard
            icon={<Clock className="h-4 w-4" />}
            title="Seguimiento post-servicio, en horas"
            trigger={`${words.singular} + 2 horas`}
          >
            No todo disparador es de días. Preguntar "¿cómo salió?" pocas horas después de un
            servicio genera confianza y detecta un problema antes de que se convierta en una
            mala reseña — y de paso, deja la puerta abierta a la próxima visita.
            <Example channel="whatsapp">
              ¡Hola {"{nombre}"}! Queríamos saber cómo te fue con tu {"{servicio}"} de hoy en{" "}
              {"{negocio}"}. Cualquier cosa, escribinos 🙌
            </Example>
          </StrategyCard>

          <StrategyCard
            icon={<BadgeCheck className="h-4 w-4" />}
            title="Trato especial para tus VIP"
            trigger="Segmento · VIP"
          >
            A tus mejores clientes no les mandes la misma campaña masiva que a todos: dales
            algo que se sienta exclusivo (acceso anticipado, un producto de cortesía, prioridad
            de turno). Es la audiencia más chica y la más barata de fidelizar — ya te eligen.
            <Example channel="whatsapp">
              ¡Hola {"{nombre}"}! Sos uno de nuestros clientes más fieles en {"{negocio}"} y
              queríamos agradecerte con algo especial en tu próxima visita. 💜
            </Example>
          </StrategyCard>

          <StrategyCard
            icon={<Users2 className="h-4 w-4" />}
            title="Reactivación fuerte para inactivos"
            trigger="Segmento · Inactivo"
          >
            A quien ya hace mucho que no viene, el mensaje de "recompra" ya no le sirve —
            necesita un motivo más grande para volver, no un recordatorio. Un beneficio más
            agresivo que el de recompra normal, y sin culpa, funciona mejor que el silencio.
            <Example channel="whatsapp">
              ¡Hola {"{nombre}"}! Sabemos que pasó tiempo. Te guardamos un 20% para cuando
              quieras volver a {"{negocio}"}, sin vencimiento esta semana. ¡Te esperamos!
            </Example>
          </StrategyCard>

          <StrategyCard
            icon={<Sparkles className="h-4 w-4" />}
            title="Aniversario como cliente"
            trigger="Antigüedad · 365 días"
          >
            Un año desde que se sumó es una excusa natural para un mensaje que no vende nada
            directamente, solo agradece — y ese tipo de mensaje es el que más se comparte o
            responde, porque no se siente publicidad.
            <Example channel="email">
              Asunto: ¡Un año juntos, {"{nombre}"}! · Hace exactamente un año que sos cliente
              de {"{negocio}"}. Gracias por elegirnos — como festejo, tenés un beneficio
              esperándote en tu próxima visita.
            </Example>
          </StrategyCard>

          <StrategyCard
            icon={<Wallet2 className="h-4 w-4" />}
            title="Reconocimiento por gasto acumulado"
            trigger="Gasto acumulado · monto a elección"
          >
            Distinto del segmento VIP (que es automático): acá vos elegís el monto exacto —
            útil para un umbral propio, como "quienes ya gastaron $50.000 este año", e
            invitarlos a algo puntual (un evento, un sorteo, un adelanto de producto nuevo).
            <Example channel="whatsapp">
              ¡Hola {"{nombre}"}! Ya llevás {"{total_gastado}"} en compras con nosotros — como
              agradecimiento, te invitamos a {"{negocio}"} el sábado a nuestro evento
              exclusivo para clientes. 🎉
            </Example>
          </StrategyCard>
        </div>

        <Tip>
          Una campaña de fábrica (Cumpleaños o Recompra) no se puede borrar ni cambiarle el
          disparador — sí el texto. Es a propósito: son las dos que el sistema necesita para
          funcionar de entrada, y siempre podés armar cuantas campañas propias quieras además
          de esas dos.
        </Tip>
      </Section>

      {/* Módulos */}
      <Section id="modulos" icon={<Blocks className="h-5 w-5" />} title="Módulos pagos">
        <p className="text-sm text-ink-muted">
          El plan base (todo lo de arriba) siempre está activo. Esto es lo que podés sumar
          además, cuando el negocio lo necesite.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {MODULE_SEED.map((m) => {
            const Icon = MODULE_ICONS[m.code] ?? Blocks;
            const built = isModuleImplemented(m.code);
            const active = activeModules.has(m.code);
            return (
              <div key={m.code} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="font-semibold text-ink">{m.name}</h3>
                  </div>
                  {active ? (
                    <span className="badge bg-brand-500/15 text-brand-700 ring-brand-500/25 dark:text-brand-300 shrink-0">
                      Activo
                    </span>
                  ) : built ? (
                    <span className="badge bg-surface-3 text-ink-muted ring-line shrink-0">
                      Disponible
                    </span>
                  ) : (
                    <span className="badge bg-surface-3 text-ink-muted ring-line shrink-0">
                      Próximamente
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-ink-muted">{m.description}</p>
                {m.code === "puntos" && (
                  <p className="mt-2 text-xs text-ink-faint">
                    Tip: definí en Configuración cuánto gastar por punto y avisale al cliente su
                    saldo con la variable <code className="font-mono">{"{puntos}"}</code> en una
                    campaña — es un motivo más para volver antes de perder lo acumulado.
                  </p>
                )}
                {m.code === "caja" && (
                  <p className="mt-2 text-xs text-ink-faint">
                    Incluye arqueo de caja, comisiones por empleado (con botón "Marcar pagado"
                    para saber cuánto le debés a cada uno) y reportes de facturación por semana
                    o mes.
                  </p>
                )}
                {!built && (
                  <p className="mt-2 text-xs text-ink-faint">Todavía lo estamos construyendo.</p>
                )}
              </div>
            );
          })}
        </div>

        {activeModules.has("puntos") && (
          <div className="mt-5 rounded-xl border border-line bg-surface-2/60 p-4 text-sm text-ink-soft">
            <b className="text-ink">Puntos, en la práctica:</b> cada compra suma puntos según
            lo que gastó el cliente; se canjean a mano desde su ficha. El saldo nunca se guarda
            como un número fijo — se recalcula sumando movimientos, así nunca se desincroniza
            si alguna vez hay que corregir algo.
          </div>
        )}
        {activeModules.has("caja") && (
          <div className="mt-3 rounded-xl border border-line bg-surface-2/60 p-4 text-sm text-ink-soft">
            <b className="text-ink">Caja, en la práctica:</b> abrís caja con un monto inicial,
            vendés durante el día, y al cerrar contás el cajón <i>a ciegas</i> (el sistema no
            te muestra lo esperado hasta que cargues lo contado — si no, se copia el número y
            el arqueo no sirve). Solo se cuenta el efectivo: una venta con tarjeta no deja
            plata en el cajón. Las comisiones se acumulan por empleado hasta que las marcás
            como pagadas — una vez pagada, queda pagada para siempre, no hay "despagar".
          </div>
        )}
      </Section>

      {/* Buenas prácticas */}
      <Section id="tips" icon={<Lightbulb className="h-5 w-5" />} title="Buenas prácticas">
        <ul className="space-y-2.5 text-sm text-ink-soft">
          <ListItem>Entrá a <b>Recordatorios</b> todos los días — es la lista de a quién escribirle hoy, ya lista para tocar y enviar.</ListItem>
          <ListItem>No prendas todas las campañas a la vez: un cliente que recibe 4 mensajes distintos la misma semana deja de leerlos. Empezá por Cumpleaños y Recompra, y sumá una más por mes.</ListItem>
          <ListItem>Mantené <b>{words.nav}</b> con precios actualizados: es lo que usa el sistema para calcular puntos, comisiones y reportes — un precio viejo ahí desactualiza todo lo demás.</ListItem>
          <ListItem>Cargá el <b>teléfono</b> de cada cliente al alta: sin eso, ninguna campaña por WhatsApp le va a llegar, aunque sí le entre en la audiencia.</ListItem>
          <ListItem>Usá el campo de <b>notas</b> de cada cliente para lo que un mensaje automático no puede saber (una preferencia, una alergia, un detalle de la última visita) — es lo que hace que el trato se sienta personal y no de sistema.</ListItem>
          <ListItem>A un cliente que responde bien a una campaña (viene, compra, agradece), pedile una reseña en Google ahí mismo — es el momento en que más ganas tiene de hacerlo.</ListItem>
        </ul>
      </Section>

      {/* Glosario */}
      <Section id="glosario" icon={<HelpCircle className="h-5 w-5" />} title="Glosario rápido">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Term term="Segmento">Grupo automático (VIP, Frecuente, etc.) según cuánto y cada cuánto compra un cliente. Se recalcula solo.</Term>
          <Term term="Disparador">La condición que decide quién entra a una campaña ("cumple años", "no compra hace 45 días").</Term>
          <Term term="Recompra">El tiempo esperado entre una compra y la siguiente. Puede ser general o por {words.singular}.</Term>
          <Term term="Arqueo">Contar el efectivo real del cajón al cerrar caja y compararlo con lo esperado por el sistema.</Term>
          <Term term="Comisión">Lo que se le debe a un empleado por una venta — fija o por porcentaje — hasta que se marca como pagada.</Term>
          <Term term="Rubro">El tipo de negocio que sos. Define si la app te habla de "productos", "servicios" o ambos.</Term>
        </dl>
      </Section>

      {/* Soporte */}
      <Section id="soporte" icon={<MessageCircle className="h-5 w-5" />} title="¿Quedó alguna duda?">
        <p className="text-sm text-ink-muted">
          Esta guía no reemplaza una consulta directa. Si algo no quedó claro o se te ocurre
          algo que el sistema todavía no hace, escribinos.
        </p>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-4 inline-flex w-full sm:w-auto"
        >
          <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp
        </a>
        <div className="mt-8 flex items-center gap-2 border-t border-line pt-6">
          <Logo size="sm" byline />
        </div>
      </Section>
    </div>
  );
}

// --- Índice -----------------------------------------------------------------

const TOC = [
  { href: "#primeros-pasos", label: "Primeros pasos" },
  { href: "#recorrido", label: "El menú" },
  { href: "#ventas", label: "Ventas" },
  { href: "#segmentos", label: "Segmentos" },
  { href: "#campanas", label: "Campañas" },
  { href: "#modulos", label: "Módulos pagos" },
  { href: "#tips", label: "Buenas prácticas" },
  { href: "#glosario", label: "Glosario" },
  { href: "#soporte", label: "Soporte" },
];

// --- Bloques de layout, propios de esta página -------------------------------

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-500/10 text-accent-600">
          {icon}
        </span>
        <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      </div>
      <div className="card p-5 sm:p-7">{children}</div>
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-brand-950">
        {n}
      </span>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{children}</p>
      </div>
    </li>
  );
}

function NavCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="text-brand-600">{icon}</span>
        {title}
      </div>
      <p className="mt-1.5 text-sm text-ink-muted">{children}</p>
    </div>
  );
}

function ListItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
      <span>{children}</span>
    </li>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent-500/25 bg-accent-500/10 p-4 text-sm text-ink-soft">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

function ConfigNumber({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-4 py-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function TriggerRow({ type }: { type: TriggerType }) {
  const meta = TRIGGER_META[type];
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-ink">{meta.label}</span>
        {meta.allowsHours && (
          <span className="badge bg-surface-2 text-ink-muted ring-line">admite horas</span>
        )}
      </div>
      <p className="mt-1 text-sm text-ink-muted">{meta.help}</p>
    </div>
  );
}

function StrategyCard({
  icon,
  title,
  trigger,
  children,
}: {
  icon: ReactNode;
  title: string;
  trigger: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-600">
          {icon}
        </span>
        <h4 className="font-semibold text-ink">{title}</h4>
      </div>
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
        Disparador: {trigger}
      </p>
      <div className="mt-3 text-sm text-ink-soft">{children}</div>
    </div>
  );
}

function Example({ channel, children }: { channel: "whatsapp" | "email"; children: ReactNode }) {
  const Icon = channel === "whatsapp" ? MessageCircle : Mail;
  return (
    <div className="mt-3 rounded-xl bg-surface-2 p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
        <Icon className="h-3 w-3" />
        Mensaje de ejemplo
      </div>
      <p className="text-sm italic text-ink-soft">{children}</p>
    </div>
  );
}

function Term({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-semibold text-ink">{term}</dt>
      <dd className="mt-0.5 text-sm text-ink-muted">{children}</dd>
    </div>
  );
}

// Ícono suelto: se usa una sola vez arriba, en el texto del atajo de venta.
function Plus(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className={props.className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
