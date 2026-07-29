# Recomendación de precios — Vuelvo

**Versión:** v1 · **Fecha:** 2026-07-29
**Contexto base:** [`.agents/product-marketing.md`](../../.agents/product-marketing.md)

---

## Punto de partida

Hoy `basePlanPrice` está en `$0` (default del schema, `PlatformSetting`) y los
nueve módulos ya tienen precio sugerido cargado en `lib/modules.ts`. Este
documento recomienda el número que falta y revisa si los que ya existen tienen
sentido entre sí — **no es una propuesta teórica, es la pieza que falta para
poder vender**.

**Aviso de método, para ser honesto sobre la base de esta recomendación:** no
hay todavía investigación de willingness-to-pay con clientes reales (Van
Westendorp, entrevistas, etc.) porque no hay clientes todavía. Lo que sigue es
una recomendación de arranque construida por comparación de alternativas y por
la lógica del propio negocio — no un número validado. **Está señalado dónde hay
que confirmarlo con las primeras 10-15 ventas**, y hay un método concreto para
esa validación en la sección 7.

---

## 1. Contexto de negocio

- **Tipo de producto:** SaaS B2B vertical, para PYMEs de atención al público.
- **Precio actual:** sin definir (`$0`).
- **Mercado objetivo:** microempresas argentinas, 1–10 empleados, sin área de
  compras ni presupuesto de software formal.
- **Motion de venta:** 100% asistida — no hay autoservicio. El precio se dice en
  una conversación de WhatsApp, no se descubre solo en una página.
- **Moneda:** pesos argentinos (`ARS`), la única moneda que tiene sentido para
  este comprador — nunca cotizar en dólares.

---

## 2. Valor entregado y alternativa a comparar

**Valor primario:** recuperar facturación de clientes que el negocio ya tiene,
sin gastar en publicidad para conseguir clientes nuevos.

**La alternativa que hay que superar no es otro software — es la publicidad
paga.** Un dueño de negocio de barrio no está comparando Vuelvo contra HubSpot;
está comparando "pagar esta cuota fija" contra "la próxima campaña de Instagram
Ads". Esa es la comparación que define el techo de precio aceptable: **el precio
mensual tiene que sentirse claramente más barato que un mes de publicidad**, y
más barato que el sueldo de medio día de alguien escribiendo mensajes uno por
uno.

**Piso de precio:** lo que cuesta el tiempo que hoy se pierde escribiendo a mano
y perdiendo clientes por olvido. Es difícil de cuantificar sin datos reales,
así que el piso real termina siendo psicológico: **por debajo de cierto número
el negocio no lo va a tomar en serio** (ver Van Westendorp más abajo — la
"demasiado barato" también existe).

---

## 3. Cómo cotizan las alternativas (referencia de mercado, no de copia directa)

No hay copiar-y-pegar posible porque no hay un competidor directo real (ver
"Competitive Landscape" en el contexto de producto), pero sirve anclar contra:

| Alternativa | Costo mensual aproximado | Qué le falta frente a Vuelvo |
|---|---|---|
| **Publicidad en redes (Meta Ads)** | Desde $30.000–$80.000/mes para resultado visible | Consigue clientes nuevos caros; no toca a los que ya compraron |
| **App de sellos digitales de fidelización** | ~$8.000–$15.000/mes, según lo que se ve en el mercado regional | Resuelve el premio, no la memoria ni el aviso de a quién escribirle |
| **CRM genérico low-cost (HubSpot Starter, Zoho)** | Desde USD 15–20/usuario/mes (~$20.000–$30.000 al tipo de cambio) | En inglés, con vocabulario B2B que no aplica, y sin fidelización nativa |
| **Sistema de gestión/POS con módulo de clientes** | Ya lo pagan, entre $15.000 y $40.000/mes | El cliente es un campo de la factura, no el centro del sistema |
| **"Lo tengo en la cabeza" (gratis)** | $0 | Se rompe pasados los ~150-200 clientes, sin que el dueño lo note a tiempo |

**Lectura:** un plan base entre $10.000 y $18.000/mes cae claramente por debajo
del costo de un mes de publicidad y en línea con lo que un negocio de este
tamaño ya paga por herramientas de gestión — sin sentirse "gratis" (que en este
mercado se lee como poco serio).

---

## 4. Recomendación: plan base

### Precio recomendado

> ### **Plan base: $14.900/mes**

**Por qué este número y no otro:**
- Cae debajo del umbral psicológico de $15.000, que en el mercado argentino de
  PYMEs suele funcionar como quiebre de decisión ("catorce mil y algo" se
  procesa distinto de "quince mil").
- Es claramente menor a un mes de publicidad paga — el argumento de venta más
  fuerte del producto necesita que esto sea cierto en los números, no solo en el
  copy.
- Es coherente con lo que el mercado local ya paga por gestión/POS: no genera
  fricción de "esto es carísimo para lo que es", pero tampoco regala el
  producto.
- Dado el contexto de inflación argentina, **un ajuste periódico ya está
  contemplado en el modelo** (ver §8) — el número de arranque no tiene que
  cargar con "cubrir la inflación de los próximos dos años" adentro suyo.

**Qué incluye (ya construido, sin re-empaquetar):** dashboard, clientes,
segmentos, recordatorios, campañas, configuración. Es decir, todo el plan base
actual del producto — no hace falta sacar nada para justificar el precio.

**[HIPÓTESIS — validar con las primeras 15 conversaciones de venta reales. Ver
método de validación en §7.]**

---

## 5. Revisión de los módulos existentes

Los nueve módulos ya tienen precio cargado en `lib/modules.ts`. Evaluados contra
el plan base recomendado de $14.900, la estructura relativa **tiene lógica y no
hace falta reescribirla entera** — el orden de precios sigue el orden de
complejidad de construcción y de valor percibido. Ajustes puntuales sugeridos:

| Módulo | Precio actual | Recomendación | Razón del ajuste |
|---|---|---|---|
| Puntos / beneficios | $4.000 | **Mantener** | Es el módulo de entrada natural — barato a propósito, primer "sí" fácil después del alta |
| Cuenta corriente | $5.000 | Mantener | Coherente |
| Gastos y rentabilidad | $5.000 | Mantener | Coherente |
| Caja | $6.000 | Mantener | Coherente |
| Catálogo digital | $6.000 | Mantener | Coherente |
| Reportes | $6.000 | Mantener | Coherente |
| Turnos / Reservas | $7.000 | Mantener | Coherente — valor claro para estética/veterinaria |
| Stock / Inventario | $8.000 | Mantener | Coherente |
| Punto de venta (POS) | $10.000 | **Revisar hacia $12.000** | Es el módulo de mayor complejidad operativa (descuenta stock automático); el salto actual de $8.000→$10.000 entre Stock y POS es chico para la diferencia de valor real |

**No tocar la estructura general.** El catálogo modular en sí (plan base +
módulos de a uno) es una decisión correcta y ya está bien resuelta en el
producto — el ajuste es de un número, no de arquitectura.

### El módulo de entrada recomendado para la venta

**Puntos/beneficios** debería ser, en el guion de venta, el primer módulo que se
ofrece — nunca en la primera conversación (ver plan de marketing §8), sino en la
revisión del mes 1 o 2. Es el más barato, el más fácil de entender ("como la
tarjetita de sellos, pero que no se pierde") y el que más conecta con lo que el
negocio ya hace intuitivamente con tarjetas de cartón.

---

## 6. Estructura de tiers: por qué NO conviene armar planes "Básico / Pro / Premium"

Es tentador envolver el plan base + módulos en 2 o 3 paquetes con nombre
("Esencial", "Pro", "Full"). **Recomendación: no hacerlo, al menos en el primer
año.** Razones concretas:

1. **La venta es asistida, no autoservicio.** El beneficio de los tiers
   (facilitar que alguien decida solo mirando una tabla) no aplica cuando cada
   venta pasa por una conversación humana. El vendedor arma el combo correcto en
   la charla, no el prospecto solo frente a una página.
2. **El negocio de barrio necesita ver "empiezo con esto y sumo si quiero"**, no
   "elegí entre tres combos". Los módulos de a uno son más fáciles de vender
   ("arrancá con el plan base, sumás lo que necesites después") que forzar una
   elección de paquete completo el día 1.
3. **Empaquetar de más sube el precio de entrada.** Si el plan base + 2 módulos
   se vende como "Plan Pro: $28.000", el número de entrada sube y con él la
   fricción de la primera conversación — justo lo que hay que evitar mientras
   se está validando el producto con los primeros clientes.

**Dónde SÍ conviene empaquetar más adelante:** una vez que haya casos por rubro
(ver plan de marketing, T2), tiene sentido armar **combos por rubro** ("Vuelvo
para peluquerías" = base + Turnos + Puntos a un precio conjunto con 10% de
descuento sobre la suma) como pieza de marketing, no como cambio de arquitectura
de precios. Es un nombre y un descuento sobre lo que ya existe, no un tier nuevo.

---

## 7. Cómo validar el número con datos reales (no solo con esta hipótesis)

**Van Westendorp exprés, sin encuesta formal — en la conversación de venta.**
En cada una de las primeras 10-15 demos, antes de decir el precio, preguntar en
algún momento de la charla (en la voz natural del vendedor, no como formulario):

1. "¿A partir de qué precio por mes dirías que esto es carísimo para lo que
   hace?" *(demasiado caro)*
2. "¿Y a partir de qué precio dirías que es una ganga, tan barato que
   dudarías de que sirva?" *(demasiado barato)*
3. "¿Qué precio te parecería caro, pero lo pagarías si te sirve?" *(caro
   aceptable)*
4. "¿Y qué precio te parecería una ganga sin desconfiar de la calidad?"
   *(barato aceptable)*

Anotar las cuatro respuestas de cada conversación en una planilla simple. Con
10-15 respuestas ya se puede trazar el rango de precio aceptable real del
mercado, en vez de depender de esta comparación por analogía. **Esto hay que
hacerlo en las primeras semanas, antes de que el número de $14.900 se fije de
hecho por ser el que ya le dijiste a los primeros clientes** (un precio dicho no
se puede subir fácil a los que ya lo pagan).

**Señal de alarma en cualquier dirección:**
- Si más del 60% de los prospectos no reacciona en absoluto al precio (ni
  regatea ni duda), probablemente está *por debajo* de lo que aceptarían pagar.
- Si más del 40% dice que es caro sin haber visto la demo primero, el precio va
  antes que la demostración de valor y hay que invertir el orden del guion.

---

## 8. Ajuste por inflación (ineludible en Argentina)

Un precio nominal fijo en pesos pierde valor real todos los meses. Esto no es un
detalle: es la diferencia entre un negocio que a los 12 meses cobra lo mismo en
términos reales, y uno que se licuó a la mitad sin haberlo decidido.

**Recomendación concreta:**
- **Explicitarlo desde el contrato/alta inicial**, en una frase simple: *"El
  precio se actualiza cada [6/12] meses según inflación."* Decirlo el día 1 evita
  la conversación incómoda de "me subieron el precio de sorpresa" más adelante —
  y en este segmento, la sorpresa cuesta la relación completa, no solo la
  renovación.
- **Frecuencia sugerida: cada 6 meses**, no cada 12 — el contexto argentino se
  mueve más rápido que un ciclo anual, y ajustar de a poco cada semestre se
  siente mejor que un salto grande una vez al año.
- **No indexar automáticamente a un índice público (IPC) de forma rígida.**
  Mejor: el superadmin decide el nuevo precio de lista cada semestre mirando el
  contexto, y lo aplica a las altas nuevas. Los clientes existentes reciben aviso
  con al menos 30 días de anticipación antes de que se les aplique.
- El campo `dueDay` / `basePlanPrice` en `PlatformSetting` ya soporta este
  modelo (precio de lista único, ajustable) sin cambios de esquema — es un
  proceso operativo, no una tarea de desarrollo.

---

## 9. Descuentos: cuándo sí y cuándo no

**No hacer descuento por cerrar rápido.** Un descuento de arranque fija una
referencia de precio que después cuesta mucho revertir, y en un mercado tan
chico y conectado (el boca a boca entre negocios de la misma cuadra) el precio
que le diste al primero se va a saber. Si hace falta dar algo para cerrar la
primera venta, dar **más servicio, no menos precio**: carga de cartera sin
cargo, un mes de acompañamiento extra, prioridad de soporte — nunca bajar el
número.

**Descuento anual, sí, cuando exista la opción de pago anual.** No es urgente en
el arranque (nadie va a pagar 12 meses por adelantado a un producto sin
historial), pero cuando el negocio tenga 6+ meses de casos, ofrecer pago anual
con ~15% de descuento mejora el flujo de caja y baja el churn (el cliente que ya
pagó el año no se plantea la baja mes a mes).

**Nunca cotizar en dólares ni atar el precio al tipo de cambio.** El comprador
piensa y factura en pesos; cotizar en dólares agrega una capa de desconfianza
("¿por qué me cobra como si fuera importado?") que no aporta nada acá.

---

## 10. Resumen de la recomendación

| Ítem | Recomendación |
|---|---|
| **Plan base** | $14.900/mes |
| **Estructura** | Plan base + módulos de a uno (mantener, no armar tiers) |
| **Único ajuste de módulo** | POS: $10.000 → $12.000 |
| **Módulo de entrada para upsell** | Puntos/beneficios, ofrecido en la revisión del mes 1-2 |
| **Descuento por cierre rápido** | Nunca — compensar con servicio, no con precio |
| **Descuento anual** | ~15%, a partir de que exista historial (mes 6+) |
| **Ajuste por inflación** | Cada 6 meses, explicitado desde el alta, con 30 días de aviso a existentes |
| **Moneda** | Siempre ARS |
| **Validación pendiente** | Van Westendorp exprés en las primeras 10-15 demos (ver §7) — **antes de fijar el número de hecho** |

**Acción inmediata:** cargar `$14.900` en `PlatformSetting.basePlanPrice` (o el
valor que decidas tras revisar este documento) y actualizar el módulo POS a
`$12.000` en el catálogo, para que deje de figurar `$0` en el sistema — es el
bloqueo número uno de todo el plan de marketing.
