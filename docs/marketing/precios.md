# Recomendación de precios — Vuelvo

**Versión:** v2 · **Fecha:** 2026-07-29
**Contexto base:** [`.agents/product-marketing.md`](../../.agents/product-marketing.md)

> **Nota de la v2:** la v1 recomendaba $14.900/mes. El dueño del proyecto la
> corrigió con un argumento correcto y que pesa más que la comparación de
> mercado que sostenía ese número: **a ese precio, el negocio necesita una
> cantidad enorme de clientes para ser rentable, y eso lo hace insostenible**.
> Esta versión no ajusta el número — lo vuelve a construir empezando por la
> pregunta que la v1 se salteó: *cuántos clientes hacen falta para que esto
> valga la pena*, no *contra qué se compara*. Ver §0.

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

## 0. Por qué se descarta el número de la v1, y con qué se lo reemplaza

La v1 llegó a $14.900 comparando contra alternativas de mercado (publicidad,
apps de sellos, CRMs genéricos) y buscando un número que "no se sintiera caro".
Ese método tiene un defecto de origen: **nunca pregunta si el número alcanza
para sostener el negocio que lo cobra.** Se puede fijar un precio que ningún
prospecto objete y que igual sea insostenible, si hace falta una cantidad de
clientes que un operador solo, sin equipo, no puede atender ni conseguir.

**La pregunta correcta no es "¿contra qué se compara?" — es "¿cuántos clientes
hacen falta para que esto sea un negocio, no un hobby que factura?"** Esa
pregunta manda sobre la de comparación de mercado, no al revés: el precio tiene
que primero ser sostenible, y recién después competitivo.

### La cuenta que faltaba

Con el plan de marketing apuntando a **~15 negocios a los 90 días** y
**~40–70 al año**, cualquier precio hay que probarlo contra esos volúmenes, no
contra volúmenes hipotéticos de "cuando esto escale":

| Precio del plan base | Clientes para $1.000.000/mes | Clientes para $2.000.000/mes | Clientes para $3.000.000/mes |
|---|---|---|---|
| $14.900 (v1, descartado) | 67 | 134 | 202 |
| $25.000 | 40 | 80 | 120 |
| **$39.900 (recomendado)** | **26** | **51** | **76** |
| $55.000 | 19 | 37 | 55 |

*(Estos montos de MRR — $1M / $2M / $3M ARS al mes — son puntos de referencia
neutrales para comparar precios entre sí, no una promesa de ingreso. Poné al
lado tu propio número de referencia mensual y mirá qué fila te queda cerca con
el volumen de clientes que el plan de marketing proyecta para ese momento.)*

**La lectura de esta tabla es el argumento central de esta versión:** a
$14.900, incluso llegando al techo optimista del año 1 (70 clientes) el negocio
factura ~$1.043.000/mes — bruto, antes de módulos que se cae la mitad no
adoptan, de bajas, y del tiempo completo de una persona vendiendo, dando soporte
y desarrollando. Es la definición de "quedar corriendo desde atrás": cada
cliente nuevo apenas mueve la aguja, y hace falta una base gigantesca solo para
llegar a un ingreso modesto. **Ese es exactamente el problema que señalaste, y
la tabla lo confirma con números, no solo con la sensación.**

A $39.900, el mismo rango de 40–70 clientes ya produce entre ~$1.600.000 y
~$2.800.000/mes solo de plan base — antes de sumar la venta de módulos, que en
este modelo es la segunda fuente de ingreso, no la principal. **El volumen
objetivo del plan de marketing (que no cambia) empieza a ser un negocio real, no
solo tracción.**

### Por qué no ir más alto todavía

Subir de más tiene un costo distinto pero igual de real: **el precio también es
lo que decide si la primera conversación de venta llega a la demo.** En la etapa
actual (cero clientes, cero casos, todo se vende a pulmón por WhatsApp), un
precio percibido como caro sin prueba social de por medio mata la venta antes de
que el producto tenga chance de mostrarse. $39.900 todavía queda debajo de lo
que muchos de estos negocios ya pagan por su sistema de gestión o POS (ver §3),
así que no rompe el techo de aceptación — pero ya no regala el producto.

**Esto no es el precio final.** Es el precio de arranque, corregido para no
condenar el negocio a la insostenibilidad, con una revisión ya prevista a los
6 meses (ver §8) en cuanto haya casos reales que sostengan un número mayor.

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
| **Publicidad en redes (Meta Ads)** | Desde $60.000–$150.000/mes para resultado visible | Consigue clientes nuevos caros; no toca a los que ya compraron |
| **App de sellos digitales de fidelización** | ~$15.000–$25.000/mes | Resuelve el premio, no la memoria ni el aviso de a quién escribirle |
| **CRM genérico low-cost (HubSpot Starter, Zoho)** | Desde USD 15–20/usuario/mes al tipo de cambio del momento | En inglés, con vocabulario B2B que no aplica, y sin fidelización nativa |
| **Sistema de gestión/POS con módulo de clientes** | Ya lo pagan, entre $25.000 y $60.000/mes | El cliente es un campo de la factura, no el centro del sistema |
| **"Lo tengo en la cabeza" (gratis)** | $0 | Se rompe pasados los ~150-200 clientes, sin que el dueño lo note a tiempo |

**Aviso honesto sobre esta tabla:** estos son montos de referencia razonados
para el contexto argentino actual, no precios verificados de cada proveedor hoy
mismo — con la inflación local se desactualizan rápido. Lo que hay que sostener
de esta tabla no son los números exactos sino el orden de magnitud: **un
sistema de gestión que un negocio de este tamaño ya paga hoy está en la misma
franja o por encima de lo que se recomienda en §4, no muy por debajo.**

**Lectura corregida (ver §0 para el argumento completo):** la comparación de
mercado por sí sola tiende a anclar bajo, porque el punto de referencia más
visible ("app de sellos") es el producto más simple de toda la lista. Vuelvo
hace más que eso — es el sistema de gestión de la relación con el cliente, no
solo el premio — así que el ancla correcta es la fila de sistemas de
gestión/POS, no la de apps de sellos.

---

## 4. Recomendación: plan base

### Precio recomendado

> ### **Plan base: $39.900/mes**

**Por qué este número y no otro:**
- Es el precio más bajo que, con el volumen que el propio plan de marketing
  proyecta (40–70 clientes al año 1), produce un negocio real y no una
  cantidad de facturación que apenas cubre el tiempo invertido — ver la cuenta
  completa en §0.
- Sigue siendo claramente menor a un mes de publicidad paga, así que el
  argumento de venta central ("esto es más barato que un mes de Instagram Ads")
  se sostiene con margen, no al límite.
- Queda en la misma franja que un sistema de gestión/POS que el negocio ya
  paga hoy — no es "otro gasto de software", es del mismo orden que lo que ya
  tiene presupuestado.
- Dado el contexto de inflación argentina, **un ajuste periódico ya está
  contemplado en el modelo** (ver §8) — el número de arranque no tiene que
  cargar con "cubrir la inflación de los próximos dos años" adentro suyo.

**Qué incluye (ya construido, sin re-empaquetar):** dashboard, clientes,
segmentos, recordatorios, campañas, configuración. Es decir, todo el plan base
actual del producto — no hace falta sacar nada para justificar el precio.

**[HIPÓTESIS — validar con las primeras 15 conversaciones de venta reales. Ver
método de validación en §7. Si la señal de "demasiado caro" aparece con
fuerza en esas primeras charlas, el ajuste se hace bajando el precio de lista
con datos en la mano — no volviendo a $14.900 por intuición.]**

---

## 5. Revisión de los módulos existentes

Los nueve módulos ya tienen precio cargado en `lib/modules.ts`, calculados
contra el plan base descartado de $14.900. **El error de la v1 no estaba en el
orden relativo de los módulos entre sí** (ese orden sigue la complejidad de
construcción y el valor percibido, y sigue teniendo sentido) — **estaba en la
base sobre la que se apoyaban.** Con el plan base en $39.900, mantener los
precios de módulo viejos los deja desproporcionadamente baratos (Puntos a
$4.000 sería menos del 10% del plan base — casi gratis, no un upsell real).
Reescalados en la misma proporción y redondeados:

| Módulo | Precio v1 (sobre base $14.900) | **Precio v2 (sobre base $39.900)** | Razón |
|---|---|---|---|
| Puntos / beneficios | $4.000 | **$9.900** | Módulo de entrada natural — el más barato a propósito, primer "sí" fácil después del alta |
| Cuenta corriente | $5.000 | **$12.900** | Coherente con su complejidad relativa |
| Gastos y rentabilidad | $5.000 | **$12.900** | Coherente |
| Caja | $6.000 | **$14.900** | Coherente |
| Catálogo digital | $6.000 | **$14.900** | Coherente |
| Reportes | $6.000 | **$14.900** | Coherente |
| Turnos / Reservas | $7.000 | **$17.900** | Valor claro para estética/veterinaria |
| Stock / Inventario | $8.000 | **$21.900** | Coherente |
| Punto de venta (POS) | $10.000 | **$26.900** | El módulo de mayor complejidad operativa (descuenta stock automático); mantiene el salto más grande de toda la escala frente a Stock |

**No tocar la estructura general.** El catálogo modular en sí (plan base +
módulos de a uno) es una decisión correcta y ya está bien resuelta en el
producto — el ajuste es de números, no de arquitectura. Con esta escala, un
negocio que suma un solo módulo típico ya empuja su ARPC (ingreso promedio por
cliente) por encima de $50.000/mes, lo que mejora la cuenta de §0 más rápido de
lo que parece a simple vista — el upsell de módulos no es un "extra", es la
segunda mitad del modelo de ingresos.

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
   se vende como "Plan Pro: $70.000", el número de entrada sube y con él la
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
hacerlo en las primeras semanas, antes de que el número de $39.900 se fije de
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
| **Plan base** | **$39.900/mes** |
| **Estructura** | Plan base + módulos de a uno (mantener, no armar tiers) |
| **Precios de módulo** | Reescalados en proporción — ver tabla completa en §5 |
| **Módulo de entrada para upsell** | Puntos/beneficios ($9.900), ofrecido en la revisión del mes 1-2 |
| **Descuento por cierre rápido** | Nunca — compensar con servicio, no con precio |
| **Descuento anual** | ~15%, a partir de que exista historial (mes 6+) |
| **Ajuste por inflación** | Cada 6 meses, explicitado desde el alta, con 30 días de aviso a existentes |
| **Moneda** | Siempre ARS |
| **Revisión al alza** | A los 6 meses, con el primer caso de éxito documentado (ver plan de marketing) — el precio de arranque no es el techo |
| **Validación pendiente** | Van Westendorp exprés en las primeras 10-15 demos (ver §7) — **antes de fijar el número de hecho** |

**Acción inmediata:** cargar `$39.900` en `PlatformSetting.basePlanPrice` (o el
valor que decidas tras revisar este documento) y actualizar los nueve módulos
en `lib/modules.ts` según la tabla de §5, para que el plan deje de figurar `$0`
en el sistema — es el bloqueo número uno de todo el plan de marketing.

## Changelog
*Más reciente primero.*
- v2 (2026-07-29) — Reemplaza el precio base de $14.900 por $39.900/mes. La v1
  ancló solo en comparación de mercado y llegó a un número que, con el volumen
  de clientes que el propio plan de marketing proyecta, no sostiene el negocio.
  Se agrega §0 con la cuenta de clientes-necesarios-por-MRR que sostiene el
  nuevo número, y se reescalan los nueve módulos en la misma proporción.
- v1 (2026-07-29) — Recomendación inicial, $14.900/mes, por comparación de
  mercado. Descartada en v2.
