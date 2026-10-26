# Hoja de ruta — Vuelvo CRM

Estado real de lo construido y orden de lo que sigue. **Este archivo es la fuente
de verdad del plan**: antes vivía solo en la conversación y no se podía encontrar
después. Si cambia el orden de las fases, se actualiza acá.

Última actualización: 2026-10-26.

### Novedades 2026-10-26

- **Stock** (módulo pago, $16.900): stock por producto que descuenta cada
  venta, carga de mercadería pagada opcionalmente desde la caja, mermas,
  devoluciones, ajuste por conteo, alertas para reponer con pedido para el
  proveedor y costo de lo vendido en Reportes.
- P0 del Programa Fundadores: botón "Reportar o sugerir" (+ /admin/soporte),
  recuperar contraseña por email, checklist de activación en Inicio, plan
  base en $35.000 y módulos sin construir fuera del catálogo.
- P1: CRM de negocios en /admin (semáforo de salud, actividad, notas,
  seguimiento cada 14 días y campañas del equipo a los negocios), resumen
  semanal por email los lunes e informe del mes en PDF.
- Configuración en pestañas, con logo, saludo y color de acento del panel.

### Novedades 2026-10-03

- Campañas: el "enviado" se guarda (ContactLog) y sobrevive a recargar; lista
  de pendientes y enviados con Deshacer; tope opcional "hasta" en disparadores
  por tiempo; cada campaña muestra la plata que trajo.
- Dashboard: "Tu plan de hoy" + Volvieron por tus mensajes / Recompra
  pendiente / Lo que se llevó la competencia.
- Presets por rubro: catálogo, campañas y módulos de fábrica al crear un
  negocio (rubros nuevos: suplementos, óptica, lavadero).
- Cuentas demo: diez rubros, datos regenerables desde /admin, siempre al día.
- Arreglos: búsqueda de Nueva venta sin mayúsculas/acentos, login visible en la
  landing mobile, gráficos por día/hora que salían vacíos, zona horaria en
  reportes y cumpleaños.
- Landing: calculadora de lo que se pierde, campañas por rubro y preguntas
  frecuentes. Panel mobile con barra de navegación inferior.

---

## Qué está construido hoy

### Plan base (siempre activo, todo negocio lo tiene)

| Pantalla | Estado |
|---|---|
| `/dashboard` | ✅ |
| `/clientes` (alta, edición, import/export CSV, ficha) | ✅ |
| `/segmentos` (VIP, frecuente, ocasional, nuevo, inactivo) | ✅ |
| `/recordatorios` | ✅ |
| `/campanas` (campañas propias con disparador y mensaje) | ✅ |
| `/configuracion` | ✅ |
| `/catalogo` (productos y servicios con precio) | ✅ |

### Módulos pagos

| Módulo | Precio | Estado |
|---|---|---|
| Puntos / beneficios | $8.900 | ✅ construido |
| **Caja y Reportes** | $22.900 | ✅ construido |
| **Stock / Inventario** | $16.900 | ✅ construido |
| Punto de venta (POS) | $22.900 | ✗ |
| Cuenta corriente | $10.900 | ✗ |
| Turnos / Reservas | $14.900 | ✗ |
| Vidriera digital (pública) | $12.900 | ✗ |
| Gastos y rentabilidad | $10.900 | ✗ |
| Asistente IA | a definir | ✗ |

"✗" significa que la carpeta de la ruta no existe. No son pantallas a medias:
no están. El flag `implemented` de `lib/modules.ts` es lo que impide que el
superadmin le active a un negocio un módulo que le dejaría un link roto.

---

## Fases

### Fase 0 — Módulos fantasma ✅

Activar un módulo sin construir metía un link en el sidebar que daba 404.
Resuelto con el flag `implemented`.

### Fase 1 — Identidad v2 ✅

Rebranding a Vuelvo CRM: logo vectorial, paleta verde/violeta, Montserrat +
Poppins. Ver "Identidad de marca (v2)" en `CLAUDE.md`.

### Fase 2 — Campañas personalizables ✅

El negocio crea sus propias campañas con disparador y mensaje. Seis tipos de
disparador, audiencia calculada al leer. Ver "Campañas" en `CLAUDE.md`.

### Fase 3 — Caja y Reportes ✅

Se entregó en dos partes.

**3a — Servicios y venta enriquecida** ✅ *(plan base, para todos)*

- `Service`: producto o servicio con precio predefinido y, opcionalmente, cada
  cuántos días se espera la recompra de *ese* servicio (un corte a los 15 días,
  una coloración a los 60).
- La venta pasa de "monto suelto" a tener ítems, descuento y método de pago.
- Disparador de campaña nuevo: **por servicio + días desde esa compra**. Es lo
  que permite "a los que se hicieron corte + barba, escribiles a los 15 días".

**3b — Caja, empleados y reportes** ✅ *(módulo pago)*

- Apertura y cierre de caja con arqueo (esperado vs. contado vs. diferencia).
- Movimientos: ventas, ingresos, egresos y retiros.
- `Employee` con porcentaje de comisión; cada venta registra quién atendió y
  genera el costo de comisión solo.
- Reglas de costo configurables (impuestos, comisión de Mercado Pago) que se
  aplican según el método de pago.
- Reportes por semana y por mes: facturación, costos, neto, ticket promedio,
  por servicio, por empleado y por método de pago.

### Fase 4 — Resto de los módulos *(siguiente)*

Orden recomendado. El criterio no es dificultad sino **cuánto refuerza la
recompra**, que es la promesa del producto:

| # | Módulo | Por qué en este lugar |
|---|---|---|
| 1 | Vidriera digital | Página pública con lo que vende, para compartir por WhatsApp o Instagram. La más barata de construir y la que más se comparte. |
| 2 | Turnos / Reservas | Recompra calendarizada. Es el corazón del producto para peluquería, estética y veterinaria. |
| 3 | ~~Stock~~ ✅ | Adelantado el 26/10 porque lo pidieron clientes. Prerrequisito de POS. |
| 4 | Cuenta corriente | El fiado es universal en el barrio y hoy se lleva en papel. |
| 5 | Gastos y rentabilidad | Simple y de alto valor percibido. Se apoya en lo que deje la Fase 3. |
| 6 | POS | El más caro. Requiere Stock y Caja andando. |

Candidatos a sumar al catálogo: **encuestas de satisfacción** (cierran el ciclo
y alimentan las reseñas de Google, que es la señal que usa el plan de
prospección) y **referidos**.

**No** se hace facturación electrónica AFIP: es un producto entero con
mantenimiento regulatorio permanente.

### Fase 5 — Asistente IA *(última, por decisión del 19/08/2026)*

Módulo pago aparte. Botón "sugerir mensaje" que redacta según la ficha del
cliente —sobre todo el campo Notas— y la campaña de destino.

Queda al final a propósito: cuanto más completa esté la ficha del cliente
(servicios comprados, frecuencia, gasto, quién lo atendió), mejor escribe el
asistente. Construirlo antes que la Fase 3 lo dejaría redactando con la mitad
de los datos.

Requiere antes de empezar:

- `ANTHROPIC_API_KEY` en el entorno.
- Un límite de uso mensual por negocio (`aiMonthlyLimit` + contador). El costo
  es por uso y lo paga el proyecto, no el cliente: sin tope, un negocio que
  apriete el botón 3.000 veces genera un gasto que nadie está mirando.
- `requireModule("ia")` **dentro** de cada Server Action, no solo en el layout.
