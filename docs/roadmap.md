# Hoja de ruta — Vuelvo CRM

Estado real de lo construido y orden de lo que sigue. **Este archivo es la fuente
de verdad del plan**: antes vivía solo en la conversación y no se podía encontrar
después. Si cambia el orden de las fases, se actualiza acá.

Última actualización: 2026-08-19.

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
| `/servicios` (productos y servicios con precio) | 🔨 en curso |

### Módulos pagos

| Módulo | Precio | Estado |
|---|---|---|
| Puntos / beneficios | $9.900 | ✅ construido |
| **Caja y Reportes** | $26.900 | 🔨 **en curso** |
| Stock / Inventario | $21.900 | ✗ |
| Punto de venta (POS) | $26.900 | ✗ |
| Cuenta corriente | $12.900 | ✗ |
| Turnos / Reservas | $17.900 | ✗ |
| Catálogo digital | $14.900 | ✗ |
| Gastos y rentabilidad | $12.900 | ✗ |
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

### Fase 3 — Caja y Reportes 🔨 (en curso)

Se entrega en dos partes.

**3a — Servicios y venta enriquecida** *(plan base, para todos)*

- `Service`: producto o servicio con precio predefinido y, opcionalmente, cada
  cuántos días se espera la recompra de *ese* servicio (un corte a los 15 días,
  una coloración a los 60).
- La venta pasa de "monto suelto" a tener ítems, descuento y método de pago.
- Disparador de campaña nuevo: **por servicio + días desde esa compra**. Es lo
  que permite "a los que se hicieron corte + barba, escribiles a los 15 días".

**3b — Caja, empleados y reportes** *(módulo pago)*

- Apertura y cierre de caja con arqueo (esperado vs. contado vs. diferencia).
- Movimientos: ventas, ingresos, egresos y retiros.
- `Employee` con porcentaje de comisión; cada venta registra quién atendió y
  genera el costo de comisión solo.
- Reglas de costo configurables (impuestos, comisión de Mercado Pago) que se
  aplican según el método de pago.
- Reportes por semana y por mes: facturación, costos, neto, ticket promedio,
  por servicio, por empleado y por método de pago.

### Fase 4 — Resto de los módulos

Orden recomendado. El criterio no es dificultad sino **cuánto refuerza la
recompra**, que es la promesa del producto:

| # | Módulo | Por qué en este lugar |
|---|---|---|
| 1 | Catálogo digital | El más barato de construir y el que más se comparte. Trae tráfico. |
| 2 | Turnos / Reservas | Recompra calendarizada. Es el corazón del producto para peluquería, estética y veterinaria. |
| 3 | Stock | Prerrequisito de POS y de un catálogo con precios reales. |
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
