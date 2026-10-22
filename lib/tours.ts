// Recorridos guiados del panel. Archivo puro (sin server-only ni Prisma): lo
// importan el TourProvider, que es client, y la acción que marca un recorrido
// como visto, que valida el id contra TOUR_IDS.
//
// Un paso apunta a un elemento por su atributo `data-tour`. Puede dar varios
// candidatos y se usa el primero que esté visible: el mismo paso señala el
// link del sidebar en la compu y el botón "Más" de la barra inferior en el
// celular, donde el sidebar no existe. Si ninguno está a la vista (la caja
// cerrada no tiene "Cerrar caja"), el paso se muestra centrado igual: el texto
// tiene que entenderse sin el resaltado.

import { catalogWords } from "./rubros";

export const TOUR_IDS = ["bienvenida", "caja"] as const;
export type TourId = (typeof TOUR_IDS)[number];

export function isTourId(v: string): v is TourId {
  return (TOUR_IDS as readonly string[]).includes(v);
}

export interface TourStep {
  target?: string | string[];
  title: string;
  body: string;
  // Botón extra en el paso, que cierra el recorrido y lleva a una pantalla.
  cta?: { href: string; label: string };
}

export interface Tour {
  id: TourId;
  // Ruta en la que arranca solo la primera vez. El de bienvenida no tiene:
  // arranca en la primera pantalla que se abra.
  route?: string;
  steps: TourStep[];
}

export interface TourContext {
  catalogMode: string;
  modules: string[];
}

function welcomeTour({ catalogMode, modules }: TourContext): Tour {
  const words = catalogWords(catalogMode);
  const steps: TourStep[] = [
    {
      title: "¡Bienvenido a Vuelvo CRM!",
      body: "En un par de minutos te mostramos dónde está cada cosa. La idea es simple: que los clientes que ya tenés vuelvan a comprar, sin que se te pase ninguno.",
    },
    {
      target: "nueva-venta",
      title: "Registrá cada venta",
      body: "Es lo que más vas a usar. Cada venta queda en la ficha del cliente, y con eso el sistema sabe cuándo avisarte que lo contactes. En la compu también la abrís con la tecla N.",
    },
    {
      target: "nav-dashboard",
      title: "Inicio: tu plan del día",
      body: "Empezá el día acá: a quién escribirle hoy, cuánta plata trajeron tus mensajes y cuánta recompra está pendiente.",
    },
    {
      target: "nav-clientes",
      title: "Tus clientes",
      body: "Cada cliente tiene su ficha con lo que compró, notas y cumpleaños. Si ya tenés una lista en Excel o Google Sheets, la importás de una sola vez.",
    },
    {
      target: ["nav-catalogo", "nav-mas"],
      title: words.nav,
      body: `Cargá tus ${words.plural} con su precio. Así una venta se arma con dos toques, y podés avisarle a cada cliente cuando le toca volver por lo que compró.`,
    },
    {
      target: ["nav-segmentos", "nav-mas"],
      title: "Segmentos",
      body: "El sistema clasifica solo a cada cliente: VIP, frecuente, ocasional, nuevo o inactivo. No tenés que hacer nada, se actualiza con cada venta.",
    },
    {
      target: ["nav-recordatorios", "nav-mas"],
      title: "Recordatorios",
      body: "Los cumpleaños de la semana, los que ya deberían haber vuelto y los que hace mucho que no vienen. Nada se te pasa.",
    },
    {
      target: "nav-campanas",
      title: "Campañas",
      body: "Mensajes armados para cada grupo de clientes. Tocás WhatsApp y se abre el chat con el texto listo: cada mensaje lo mandás vos, uno por uno, y queda registrado.",
    },
  ];

  if (modules.includes("caja")) {
    steps.push({
      target: ["nav-caja", "nav-mas"],
      title: "Caja y Reportes",
      body: "Abrís la caja al empezar el día, las ventas entran solas y al cerrar contás la plata. La primera vez que entres te explicamos cómo funciona, paso a paso.",
    });
  }
  if (modules.includes("puntos")) {
    steps.push({
      target: ["nav-puntos", "nav-mas"],
      title: "Puntos",
      body: "Cada venta suma puntos al cliente según lo que gastó, y desde su ficha se los canjeás por beneficios.",
    });
  }

  steps.push(
    {
      target: ["nav-guia", "nav-mas"],
      title: "¿Dudas? Está la guía",
      body: "Explica todo con ejemplos para tu rubro. Desde ahí también podés volver a hacer este recorrido cuando quieras.",
    },
    {
      title: "Tu primer paso",
      body: "Empezá por cargar tus clientes, o importarlos si ya los tenés en una planilla. Con eso, el sistema ya te puede decir a quién escribirle.",
      cta: { href: "/clientes/importar", label: "Importar clientes" },
    }
  );

  return { id: "bienvenida", steps };
}

const CAJA_TOUR: Tour = {
  id: "caja",
  route: "/caja",
  steps: [
    {
      title: "Cómo funciona la caja",
      body: "Funciona como una jornada: la abrís con la plata para dar cambio, durante el día las ventas entran solas, y al final contás el efectivo para ver si cuadra.",
    },
    {
      target: "caja-tabs",
      title: "Tres pestañas",
      body: "Caja es el día a día. En Equipo cargás quién atiende y cuánto cobra de comisión. En Costos, lo que te descuentan en cada venta (Mercado Pago, impuestos).",
    },
    {
      target: "caja-abrir",
      title: "1. Abrí la caja",
      body: "Escribí el efectivo que dejás en el cajón para dar cambio: eso es el fondo inicial. Si no dejás nada, poné 0.",
    },
    {
      target: "caja-movimientos",
      title: "2. Las ventas entran solas",
      body: "Cada venta que registrás con Nueva venta aparece acá. A mano solo cargás lo que no es una venta: si le pagaste a un proveedor (egreso), si sacaste plata (retiro) o si pusiste más cambio (ingreso).",
    },
    {
      target: "caja-cerrar",
      title: "3. Cerrá contando",
      body: "Al final del turno contá el efectivo del cajón y escribí cuánto hay. El sistema te dice si sobra o falta. Solo cuenta el efectivo: lo cobrado con tarjeta o transferencia no está en el cajón.",
    },
    {
      target: "caja-cierres",
      title: "Cada cierre queda guardado",
      body: "Con lo que se esperaba, lo que se contó y la diferencia. Tocá uno para ver las ventas de ese turno.",
    },
    {
      title: "Los números, en Reportes",
      body: "Facturación, ganancia neta después de comisiones y costos, y ventas por día o por hora, de la semana o del mes.",
      cta: { href: "/reportes", label: "Ver reportes" },
    },
  ],
};

export function buildTours(ctx: TourContext): Record<TourId, Tour> {
  return { bienvenida: welcomeTour(ctx), caja: CAJA_TOUR };
}
