# Plan de marketing y adquisición — Vuelvo

**Versión:** v1 · **Fecha:** 2026-07-29 · **Horizonte:** 90 días + 12 meses
**Estructura:** AARRR (Adquisición · Activación · Retención · Referidos · Ingresos)
**Contexto base:** [`.agents/product-marketing.md`](../../.agents/product-marketing.md)

---

## 1. Resumen ejecutivo

Vuelvo terminó de construirse y no tiene clientes. Esa es toda la situación, y
define el plan entero: **los próximos 90 días no son de marketing, son de venta
directa.** Cualquier peso o cualquier hora que se vaya a anuncios, a SEO o a
contenido antes de tener diez negocios pagando y contentos está mal gastado, no
porque esos canales no sirvan, sino porque todavía no sabés qué decir en ellos.

### Las tres apuestas

**Apuesta 1 — Ganar a mano antes de ganar a escala.**
Los primeros 10 clientes se consiguen uno por uno, por WhatsApp y en persona, sin
ningún canal pago. El objetivo real de esos 10 no es la facturación (es mínima):
es descubrir qué frase hace que un dueño diga que sí, y cuál es el número
concreto que devuelve el producto. Sin esas dos cosas, ningún anuncio va a
funcionar. Con ellas, casi cualquiera funciona.

**Apuesta 2 — El caso de un negocio real es el único activo de marketing que
importa este año.**
"Perfumería tal reactivó 34 clientes en 60 días y facturó $X extra" vale más que
todo el contenido que puedas producir en doce meses. Hay que conseguirlo del
primer piloto, con permiso y con números reales, y después construir todo encima
de eso: la web, los anuncios, los mensajes, el video.

**Apuesta 3 — El canal de escala no son los anuncios, son los proveedores del
rubro.**
El distribuidor que le vende insumos a 200 peluquerías ya tiene la confianza que
vos vas a tardar dos años en construir, y no compite con vos. Un acuerdo de
referidos con dos o tres distribuidores puede generar más altas que cualquier
presupuesto de Meta que puedas pagar este año. Es la palanca de mayor retorno del
plan y hay que empezar a trabajarla en el mes 2, no en el mes 8.

### Prioridades de los primeros 90 días

1. **Definir el precio y publicarlo.** Hoy está en `0` en el sistema. Bloquea todo.
2. **Instrumentar la analítica.** Sin medir el embudo, todo lo demás es a ciegas.
3. **Conseguir 3 pilotos** con acompañamiento intensivo y permiso para contar el caso.
4. **Grabar la demo de 60 segundos** para mandar por WhatsApp.
5. **Llegar a 10 negocios pagando** con retención mensual.
6. **Construir el cálculo de retorno** ("esto se paga solo con X clientes reactivados").

### Resultado esperado a 12 meses

Entre **40 y 70 negocios activos** pagando mensualmente, con una tasa de baja
mensual por debajo del 5%, un canal de referidos que aporte alrededor de un
tercio de las altas, y un caso documentado por cada rubro principal. **[HIPÓTESIS
— es un objetivo de trabajo, no una proyección; se corrige con datos reales a
partir del mes 3.]**

---

## 2. Marco estratégico

**Categoría que reclamamos:**
No competimos en "CRM". Competimos en **"hacer que tus clientes vuelvan"**. La
palabra CRM se usa recién cuando el prospecto ya entendió qué hace el producto —
nunca en el primer contacto.

**Cliente ideal, en una línea:**
Negocio de barrio con local a la calle, 1 a 10 empleados, clientela que vuelve
cada 30–90 días, entre 150 y 2.000 clientes, cuyo dueño atiende el mostrador y ya
usa WhatsApp. Detalle completo en [prospección §1](prospeccion.md).

**Lógica del modelo de negocio:**
Suscripción mensual en pesos, plan base + módulos activables de a uno, alta
asistida sin autoservicio, cobro manual sin pasarela. El alta asistida es una
decisión estratégica y no un límite técnico: **el onboarding es el producto** en
un mercado donde el mayor obstáculo no es el precio sino "no me voy a poner a
cargar todo eso". Su costo es que la adquisición no escala sola — y esa es
exactamente la razón por la que el plan apuesta a referidos y a proveedores en
vez de a un embudo autoservicio.

**No negociables de voz:**
Voseo rioplatense. Frases cortas. Concreto sobre abstracto. Cero jerga en inglés.
El CTA dice siempre "Pedir acceso". Nunca prometer envío automático de mensajes —
el envío es manual asistido. Nunca inventar métricas ni testimonios.

---

## 3. Estado actual

### Equipo y presupuesto

| Ítem | Estado |
|---|---|
| Equipo de marketing | Una persona, que además desarrolla el producto |
| Presupuesto mensual | ~$0 (bootstrapped) |
| Clientes pagos | 0 |
| MRR | $0 |
| Fase de crecimiento | Pre-ingresos. La etapa más dura y la más manual. |
| Runway | Sin dependencia de inversión — el límite real es el tiempo de una persona |

**Implicancia directa:** el recurso escaso no es la plata, son las horas. Todo lo
que se recomienda acá tiene que caber en unas 10–15 horas semanales de trabajo
comercial, o no va a pasar.

### Lo que ya está hecho (y está bien hecho)

- ✅ Producto completo y desplegado: base de clientes, segmentación automática,
  recordatorios, campañas, importación/exportación CSV, venta rápida.
- ✅ Infraestructura completa de módulos pagos: catálogo de nueve, activación y
  precio por negocio, control de acceso. **Un módulo construido (Puntos)**; los
  otros ocho están en el catálogo pero todavía no tienen pantalla.
- ✅ Panel de superadministración con gestión de módulos, precios por negocio y
  registro de pagos.
- ✅ Landing pública con copy trabajado, motion GSAP y accesibilidad cuidada.
- ✅ Marca completa: nombre, logo, identidad, PWA instalable.
- ✅ Aislamiento de datos por negocio y cierre del acceso externo a la base.

**Esto es mucho más de lo que tiene la mayoría de los proyectos en esta etapa.**
El problema no es el producto.

### Lo que falta (y bloquea)

| Falta | Impacto | Prioridad |
|---|---|---|
| **Precio sin definir** (`basePlanPrice = 0`) | No se puede vender. Literal. | 🔴 Bloqueante |
| **Sin analítica** | Todo se decide por intuición | 🔴 Bloqueante |
| **Sin clientes ni casos** | La web no tiene prueba social y no puede tenerla | 🔴 Crítico |
| **Sin demo grabada** | Cada demo cuesta una reunión en vivo | 🟠 Alto |
| **Sin oferta de entrada definida** | Respuestas distintas a cada prospecto | 🟠 Alto |
| **Sin proceso de alta documentado** | El onboarding depende de la memoria | 🟡 Medio |
| **Sin canal de soporte formal** | Funciona con 5 clientes, se rompe con 30 | 🟡 Medio |

### Puntaje del estado actual

Sobre 5, evaluado contra lo que hay hoy:

| Área | Puntaje | Comentario |
|---|---|---|
| Producto y valor entregado | 4.5 | Sólido y completo para el segmento |
| Posicionamiento y mensaje | 4 | Claro y bien escrito; falta validarlo con clientes reales |
| Marca e identidad | 4.5 | Terminada y coherente |
| Sitio web | 4 | Bien construido; le falta precio y prueba social |
| Precio y empaquetado | 1 | Sin definir |
| Adquisición | 0.5 | Sin canal activo |
| Activación / onboarding | 2 | Asistido pero no documentado ni medido |
| Retención | 1.5 | El producto retiene por diseño; sin proceso ni medición |
| Referidos | 0 | Inexistente |
| Analítica y medición | 0 | Inexistente |
| Contenido | 0.5 | Solo la landing |
| Ventas | 1 | Sin proceso ni material |
| **Promedio** | **~1.9** | Perfil típico de producto terminado sin salir a vender |

**La lectura:** el producto está en 4+ y la comercialización en 1. Todo el
esfuerzo de los próximos 90 días va del lado derecho de esa brecha.

---

## 4. Adquisición

*Cómo un desconocido se entera de que Vuelvo existe.*

### Canales activos hoy
Ninguno. La landing existe pero nadie llega a ella.

### Canales para los primeros 90 días

**A1 — Venta directa por WhatsApp (canal principal).**
El método completo está en [prospección](prospeccion.md) y el copy en
[mensajes en frío](mensajes-en-frio.md). 30 mensajes por semana, personalizados a
mano, un rubro y una zona por vez. Es el único canal que puede producir el primer
cliente este mes.
*Objetivo: 2–3 demos por semana.*

**A2 — Visita presencial en zona (el multiplicador).**
Elegir una avenida comercial y recorrerla. Entrar, comprar algo chico, hablar con
quien atiende, mostrar el producto en el celular ahí mismo. Convierte muchísimo
más que el mensaje en frío porque elimina de un saque las dos objeciones más
grandes: la desconfianza y el "no tengo tiempo de que me expliquen".
*Objetivo: una tarde por semana, 8–10 locales, 1 demo cerrada.*
**Si algo de este plan hay que priorizar por encima de todo, es esto.**

**A3 — Acuerdos con proveedores del rubro (la apuesta de escala).**
Identificar distribuidores de insumos de peluquería, cosmética y veterinaria de
la zona. Proponerles comisión por cada negocio referido que se dé de alta, o
directamente que lo ofrezcan como beneficio a sus clientes. Empezar en el mes 2,
cuando ya haya un caso que mostrar.
*Objetivo mes 3: 2 acuerdos firmados. Mes 6: 5.*

**A4 — Grupos y cámaras de comercio locales.**
Grupos de Facebook y WhatsApp de comerciantes, cámaras de comercio barriales.
**Entrar a aportar durante semanas antes de mencionar el producto.** Responder
preguntas sobre cómo manejar clientes, compartir lo que aprendiste. La venta
llega sola por privado.
*Objetivo: presencia útil en 3 grupos para el mes 2.*

**A5 — Instagram como prueba de existencia, no como canal de adquisición.**
Un negocio al que le escribís va a buscar tu perfil antes de contestarte. Si no
existe o está vacío, no te contesta. El objetivo del perfil **no es conseguir
clientes**, es que el prospecto confirme que sos real.
*Mínimo viable: 9 publicaciones que muestren el producto y el problema, y
después 2 por semana. No más que eso.*

### Canales explícitamente pospuestos (y por qué)

| Canal | Cuándo | Por qué no ahora |
|---|---|---|
| **Anuncios pagos (Meta/Google)** | Mes 6+, y solo si hay caso documentado | Sin saber qué mensaje convierte, pagar por impresiones es pagar por aprender lento. Con 10 clientes ya sabés qué decir y el mismo peso rinde el triple. |
| **SEO y blog** | Mes 4+ como inversión de fondo | Tarda 6–12 meses en rendir. Vale empezar temprano *si no le saca horas a la venta directa*, no antes. |
| **Email marketing frío** | No | Los dueños de negocios de barrio no usan email. El canal es WhatsApp. |
| **Influencers / TikTok** | No en 12 meses | El público objetivo no descubre software ahí. |
| **Product Hunt / directorios de startups** | No | Público equivocado por completo: no hay peluqueros en Product Hunt. |

**Lo que NO hay que hacer, dicho explícitamente:** gastar en anuncios antes del
mes 6. Es el error más caro y más común en esta etapa. La tentación va a aparecer
cuando la venta directa se sienta lenta — y va a sentirse lenta, porque lo es.

---

## 5. Activación

*Cómo un negocio que dijo que sí llega a tener una primera experiencia de valor.*

### El momento de la verdad

> **Un negocio está activado cuando le manda su primer mensaje a un cliente real
> desde Vuelvo.** No cuando se registra, no cuando carga la cartera, no cuando
> paga. Un negocio que cargó 400 clientes y nunca mandó un mensaje se va a dar de
> baja en el mes 2, garantizado.

Toda la activación se diseña hacia atrás desde ese evento.

### El proceso de alta (documentarlo y seguirlo siempre igual)

| Paso | Qué pasa | Meta de tiempo |
|---|---|---|
| 1 | Crear la cuenta y configurar el negocio | Día 0 |
| 2 | Importar la cartera (Excel, contactos, o carga asistida) | Día 0–1 |
| 3 | Ajustar umbrales de segmentación al rubro real | Día 1 |
| 4 | Ajustar las plantillas de mensaje a la voz del negocio | Día 1 |
| 5 | **Mandar juntos el primer mensaje a un cliente real** | **Día 1 — no negociable** |
| 6 | Instalar la app en el celular del dueño y de quien atiende | Día 1 |
| 7 | Llamada corta de seguimiento | Día 7 |
| 8 | Revisión de resultados con números concretos | Día 30 |

**El paso 5 se hace en la misma sesión de alta, sí o sí.** Es la diferencia
entre un cliente que renueva y uno que no. Si el dueño se va sin haber mandado un
mensaje, el alta no está terminada.

**El paso 8 es el que produce el caso de éxito.** Hay que ir con los números
preparados: cuántos clientes se contactaron, cuántos volvieron, cuánto facturó
eso.

### Qué hay que construir para mejorar la activación

- **Video de 60 segundos** de la pantalla de recordatorios, para mandar por
  WhatsApp antes de la demo. Ahorra reuniones.
- **Checklist de alta** en papel o en Notion, para que el proceso no dependa de la
  memoria y sea delegable más adelante.
- **Plantillas por rubro** precargadas (peluquería, perfumería, veterinaria): que
  el negocio no arranque desde una plantilla en blanco.
- **Medir** cuántos días pasan entre el alta y el primer mensaje enviado. Es el
  indicador de activación y hoy no se mide.

---

## 6. Retención

*Cómo un cliente sigue pagando el mes 3, el 6 y el 12.*

### Por qué se van a ir (en orden de probabilidad)

1. **Dejaron de usarlo.** No es que no les gustó — se les fue de la rutina. Es la
   causa número uno y es prevenible.
2. **No vieron el retorno.** Usaron el producto pero nadie les mostró el número.
3. **La persona que lo usaba se fue del local.** Riesgo real en negocios chicos.
4. **Apretón económico.** Cuando hay que recortar, el software es lo primero que
   se corta. Se defiende con retorno demostrable, no con descuentos.

### Sistema de retención

**Ritual del día 30: la revisión de números.**
Una vez al mes, mirar cada cuenta y mandar un mensaje corto con lo que pasó:
"Este mes contactaste a 42 clientes, volvieron 11". **Este es el motor de
retención más importante de todo el plan** — es lo que convierte el gasto en
inversión visible.

**Alerta de inactividad (irónicamente, lo que el producto hace por sus clientes).**
Si un negocio no registra ninguna venta en 10 días, hay que escribirle. Es
exactamente la misma lógica del producto aplicada al propio negocio.
*Se puede automatizar mirando la fecha de última compra registrada por negocio
desde el panel de superadmin.*

**El módulo como escalón de compromiso.**
Un negocio que activa un segundo módulo casi no se da de baja: ya integró el
producto a su operación. Ofrecer el módulo correcto en el momento correcto es
retención, no solo ingreso.

> **Ojo con el calendario:** hoy el único módulo vendible es Puntos, así que
> "el segundo módulo" todavía no existe. Esta palanca no se puede usar hasta
> que se construya al menos uno más — por eso conviene tener Catálogo o Turnos
> listo antes del mes 4, que es cuando el plan cuenta con este ingreso.

**Soporte por WhatsApp con respuesta el mismo día.**
En este segmento el soporte personal es diferencial competitivo, no costo. "Te
contestamos nosotros, no un bot" ya está prometido en la web — hay que cumplirlo.

### Objetivo
Tasa de baja mensual por debajo del **5%** en el primer año. Por encima del 8%
hay un problema de activación, no de producto: revisar cuántos de los que se
fueron habían mandado su primer mensaje.

---

## 7. Referidos

*Cómo un cliente contento trae al siguiente.*

Este es el canal que decide si el negocio escala o se queda dependiendo del
esfuerzo manual. **Los negocios de barrio se conocen entre sí** — el de la
esquina habla con el de enfrente todos los días. Es el mercado ideal para
referidos y hoy no hay nada armado.

### Programa (activar en el mes 3, cuando haya clientes contentos)

**Mecánica:** un mes gratis para quien refiere y un mes gratis para el referido,
cuando el referido completa su primer mes pago. Simple, entendible en una frase,
y no requiere ningún desarrollo: se administra a mano desde el panel de
superadmin marcando el negocio como exento por un período.

**Cuándo pedirlo:** en la revisión del día 30, justo después de mostrarle los
números buenos. Es el único momento en que el cliente está mirando el valor de
frente. Pedirlo antes es prematuro; pedirlo suelto por mensaje no funciona.

**Cómo pedirlo:** no "¿conocés a alguien?" (nadie se acuerda de nadie con esa
pregunta), sino **"¿quién más de la cuadra tiene el mismo problema?"**. La
pregunta concreta produce nombres; la genérica produce "voy a pensar".

### Otras formas de referencia

- **Los proveedores del rubro** (ver §4-A3). Técnicamente son referidos, no
  publicidad, y son la palanca más grande del plan.
- **El testimonio en video de 30 segundos**, grabado con el celular en el local,
  vale más que cualquier pieza de diseño. Pedirlo en la revisión del mes 2.
- **Presencia de marca discreta** en los mensajes que reciben los clientes
  finales: hay que evaluarlo con cuidado — el negocio quiere que el mensaje se
  vea suyo, no de un proveedor. **No implementarlo sin preguntarles primero.**

---

## 8. Ingresos

*Detalle completo y números concretos en [recomendación de precios](precios.md).*

**Situación:** el plan base figura en `0`. Es el bloqueo número uno del proyecto.

**Principios que salen del análisis de precios:**
1. Precio único y público para el plan base. Nada de "consultanos".
2. Los módulos se venden después del alta, nunca en la primera conversación:
   sumar decisiones a una venta que todavía no está cerrada la mata.
3. Nada de descuentos por cerrar. Si hay que dar algo, dar **más servicio**
   (carga de cartera sin cargo, un mes de acompañamiento), nunca menos precio —
   un descuento inicial fija el precio para siempre y devalúa el producto.
4. **Ajuste anual por inflación previsto desde el contrato inicial.** En Argentina
   un precio nominal fijo es una pérdida silenciosa. Avisarlo desde el día uno
   evita la conversación incómoda más adelante.
5. El camino de expansión de ingresos es el segundo módulo, no la suba de precio.

**Palancas de ingreso, por orden de rendimiento:**
1. **Más negocios** (el foco de los primeros 12 meses)
2. **Más módulos por negocio** (empieza a rendir a partir del mes 4)
3. **Ajuste de precio** (anual, por inflación, no como estrategia de crecimiento)

---

## 9. Hoja de ruta de 90 días

### Semanas 1–2 — Desbloquear

| # | Acción | Etapa | Estado |
|---|---|---|---|
| 1 | **Definir el precio del plan base y cargarlo en el sistema** | Ingresos | 🔴 Bloqueante |
| 2 | Instalar analítica en la landing y medir clics en "Pedir acceso" | Todas | 🔴 Bloqueante |
| 3 | Publicar el precio en la web | Ingresos | 🔴 |
| 4 | Grabar el video demo de 60 segundos | Activación | 🟠 |
| 5 | Configurar WhatsApp Business con perfil completo | Adquisición | 🟠 |
| 6 | Armar la planilla de prospección (o cargarla en Vuelvo mismo) | Adquisición | 🟠 |
| 7 | Definir la oferta de entrada y no cambiarla más | Ingresos | 🟠 |

### Semanas 3–4 — Primeros contactos

| # | Acción | Etapa | Meta |
|---|---|---|---|
| 8 | Investigar y calificar 60 candidatos (peluquerías + perfumerías, una zona) | Adquisición | 60 fichas |
| 9 | Mandar los primeros 60 mensajes en frío | Adquisición | 12+ respuestas |
| 10 | Recorrer una avenida comercial, una tarde por semana | Adquisición | 16 locales |
| 11 | Documentar el checklist de alta | Activación | Hecho |
| 12 | Crear el perfil de Instagram con 9 publicaciones | Adquisición | Publicado |
| 13 | **Cerrar los primeros 3 pilotos** | Adquisición | **3 altas** |

### Semanas 5–8 — Aprender y ajustar

| # | Acción | Etapa | Meta |
|---|---|---|---|
| 14 | Alta completa de los 3 pilotos, con primer mensaje enviado el día 1 | Activación | 3/3 activados |
| 15 | Seguir prospectando: 30 mensajes por semana | Adquisición | 120 mensajes |
| 16 | Primera revisión de números con los pilotos | Retención | 3 revisiones |
| 17 | **Construir el cálculo de retorno con datos reales del piloto** | Todas | Documento |
| 18 | Reescribir el mensaje en frío con lo aprendido | Adquisición | v2 |
| 19 | Primer contacto con 2 distribuidores del rubro | Adquisición | 2 reuniones |
| 20 | Llegar a 8 negocios pagos | Ingresos | 8 clientes |

### Semanas 9–12 — Componer

| # | Acción | Etapa | Meta |
|---|---|---|---|
| 21 | Publicar el primer caso de éxito con números reales | Adquisición | En la web |
| 22 | Grabar el primer testimonio en video | Referidos | 1 video |
| 23 | Lanzar el programa de referidos con los clientes activos | Referidos | Activo |
| 24 | Cerrar el primer acuerdo con un proveedor | Adquisición | 1 acuerdo |
| 25 | Ofrecer **Puntos** (único módulo construido) a quienes usan el base hace 60 días | Ingresos | 3 activaciones |
| 26 | Rehacer la landing con prueba social real | Adquisición | Publicado |
| 27 | **Llegar a 15 negocios pagos** | Ingresos | **15 clientes** |

### Definición de éxito a los 90 días

| Métrica | Meta |
|---|---|
| Negocios pagos | 15 |
| Bajas | ≤1 |
| Casos documentados | 1 publicado, 2 más en curso |
| Acuerdos con proveedores | 1 firmado, 2 en conversación |
| Altas por referido | ≥2 |
| Tiempo alta → primer mensaje | ≤1 día en el 100% de las altas |

**Si a los 90 días hay 15 clientes y ninguno se fue, el negocio funciona y hay
que acelerar. Si hay 15 y se fueron 5, el problema es la activación y hay que
arreglar eso antes de conseguir uno más.** No hay tercera lectura.

---

## 10. Perspectiva a 12 meses

| Trimestre | Foco | Meta de clientes | Qué se desbloquea |
|---|---|---|---|
| **T1** (meses 1–3) | Validar la venta a mano | 15 | El precio, el caso, el proceso de alta |
| **T2** (meses 4–6) | Sistematizar y sumar canal | 30 | Referidos andando, 2–3 proveedores, primer contenido |
| **T3** (meses 7–9) | Primer canal pago con datos | 45 | Anuncios con mensaje ya validado; primera contratación part-time |
| **T4** (meses 10–12) | Densidad por rubro | 60–70 | Un caso por rubro; empaquetados por rubro; delegación del alta |

### Qué cambia cuando cambia la capacidad

- **Con $0/mes (hoy):** solo venta directa, presencial y referidos. Todo depende
  de tus horas. Techo realista: ~5 altas por mes.
- **Con ~$150–300 mil/mes de presupuesto (viable a partir de ~20 clientes):**
  anuncios geolocalizados por rubro y barrio, más un video producido. Esperable:
  +3 a 5 altas mensuales adicionales.
- **Con la primera contratación (viable a partir de ~40 clientes):** alguien que
  haga las altas y el soporte libera tu tiempo para vender, que es donde más
  rendís. **Contratá para el alta antes que para la venta** — vender lo tuyo, al
  principio, no lo hace nadie mejor que vos.

### La forma real de esto

No va a ser una curva exponencial. Va a ser una línea con escalones: meses de
sumar 4 o 5 clientes, y saltos cuando entra un proveedor con cartera propia o
cuando un rubro se contagia por boca a boca en una zona. **Los escalones vienen
de acuerdos y de densidad, no de esfuerzo individual.** Planificá para los
escalones y aguantá las líneas rectas del medio.

---

## 11. Herramientas y ejecución

### Lo mínimo indispensable (todo gratis o casi)

| Necesidad | Herramienta | Costo |
|---|---|---|
| Analítica web | Plausible, Umami o GA4 | $0–bajo |
| Gestión de prospección | **Vuelvo mismo** | $0 |
| WhatsApp comercial | WhatsApp Business | $0 |
| Video demo | Grabación de pantalla del celular | $0 |
| Documentos y procesos | Notion o Google Docs | $0 |
| Diseño de piezas | Canva | $0 |

**Usar Vuelvo para gestionar la prospección de Vuelvo no es una anécdota simpática:
es control de calidad.** Cada fricción que encuentres usándolo todos los días es
una fricción que tus clientes también tienen, y la vas a encontrar antes que ellos.

### Qué desarrollar en el producto para sostener el marketing

Por orden de retorno:

1. **Analítica en la landing** — sin esto no se decide nada. *(Bloqueante.)*
2. **Sección de precios en la web** — la pregunta número uno de todo prospecto.
3. **Vista de "última actividad por negocio" en el panel de superadmin** — para
   detectar cuentas que se enfrían antes de que se den de baja.
4. **Plantillas de mensaje precargadas por rubro** — acelera el alta.
5. **Página de caso de éxito** en la web — cuando exista el primer caso.
6. **Registro del referidor en el alta** — para saber qué canal trae qué.

---

## 12. Banco de ideas

Curado a propósito. Un banco de 139 ideas para una persona sola es ruido, no
estrategia: lo que sigue es lo que aplica a este negocio, con su momento.

### Hacer ahora (meses 1–3)

| Idea | Etapa | Por qué |
|---|---|---|
| Venta directa por WhatsApp personalizada | Adquisición | Único canal que produce clientes este mes |
| Recorrida presencial por zona comercial | Adquisición | La mayor conversión de todo el plan |
| Video demo de 60 segundos | Activación | Ahorra una reunión por prospecto |
| Publicar el precio | Ingresos | Elimina la fricción más grande |
| Primer mensaje enviado el día del alta | Activación | Determina la retención |
| Revisión mensual de números | Retención | Convierte el gasto en inversión visible |
| Usar el propio producto para prospectar | Producto | Control de calidad continuo |

### Hacer en T2 (meses 4–6)

| Idea | Etapa | Por qué |
|---|---|---|
| Programa de referidos (mes gratis para ambos) | Referidos | Requiere clientes contentos primero |
| Acuerdos con distribuidores del rubro | Adquisición | La palanca de escala del plan |
| Caso de éxito con números reales | Adquisición | El activo de marketing más valioso |
| Testimonio en video con el celular | Referidos | Prueba social creíble y barata |
| Empaquetado por rubro | Ingresos | "Vuelvo para peluquerías" convierte más que genérico |
| Presencia en grupos de comerciantes | Adquisición | Requiere semanas de aporte previo |
| Calculadora de "cuánto estás perdiendo" | Adquisición | Herramienta gratuita que califica sola |

### Hacer en T3–T4 (meses 7–12)

Anuncios geolocalizados por rubro · Contenido en video corto mostrando el producto ·
SEO local ("sistema de fidelización para peluquerías") · Alianza con contadores de
PYMEs · Webinar por rubro · Programa de embajadores por zona

### Descartadas, y por qué

| Idea | Motivo |
|---|---|
| Product Hunt y directorios de startups | Público equivocado: no hay peluqueros ahí |
| Email marketing frío | Los dueños de local no usan email |
| Prueba gratuita autoservicio | Sin alta asistida no cargan la cartera y no ven valor |
| Modelo freemium | En este segmento, gratis se lee como "no sirve", y la carga de datos hace que la conversión de freemium a pago sea aún más difícil |
| LinkedIn | El dueño de una veterinaria de barrio no está ahí |
| Anuncios antes del mes 6 | Pagar por impresiones sin saber qué mensaje convierte |
| Programa de afiliados abierto | Requiere volumen que todavía no existe |

---

## 13. Medición, responsabilidades y decisiones abiertas

### Métrica norte

**Negocios activos que mandaron al menos un mensaje esta semana.**

No es "clientes pagos" — un cliente que paga y no usa ya se dio de baja, solo que
todavía no lo sabe. Esta métrica captura la salud real del negocio en un número.

### Indicadores por etapa

| Etapa | Indicador | Meta |
|---|---|---|
| Adquisición | Mensajes en frío enviados por semana | 30 |
| Adquisición | Tasa de respuesta | >20% |
| Adquisición | Demos por semana | 2–3 |
| Adquisición | Demo → alta | >30% |
| Activación | Días entre alta y primer mensaje | ≤1 |
| Activación | Cartera cargada en las primeras 48 h | 100% |
| Retención | Bajas mensuales | <5% |
| Retención | Negocios activos esta semana | >80% |
| Referidos | Altas por referido | >20% al mes 6 |
| Ingresos | Ingreso mensual recurrente | Crecimiento sostenido |
| Ingresos | Módulos por negocio | >1.3 al mes 6 |

### Responsabilidades

Sos vos en todos los roles. Lo útil acá no es una tabla RACI sino un reparto de
tiempo, que es el recurso realmente escaso:

| Bloque | Horas semanales | Cuándo |
|---|---|---|
| Prospección e investigación | 3 h | Lunes |
| Contacto y seguimiento | 4 h | Martes y jueves |
| Demos y altas | 4 h | Miércoles y viernes |
| Retención y soporte | 2 h | Distribuido |
| Producto y ajustes | El resto | Distribuido |

**La regla:** las horas de venta no se ceden a las de producto. El producto ya
está; lo que falta son clientes. Cada vez que aparezca la tentación de "primero
mejoro esta pantallita", esa es la señal de que hay que salir a vender.

### Decisiones abiertas (bloquean si no se resuelven)

| # | Decisión | Impacto | Para cuándo |
|---|---|---|---|
| 1 | **¿Cuánto sale el plan base?** | Bloquea toda la venta | Semana 1 |
| 2 | ¿Qué se ofrece de entrada? (mes gratis / carga sin cargo / nada) | Respuestas inconsistentes sin esto | Semana 1 |
| 3 | ¿Cuál es el rubro y la zona de arranque? | Sin foco no hay densidad ni boca a boca | Semana 1 |
| 4 | ¿Cuánto tiempo semanal se le puede dedicar de verdad? | Define si las metas son reales o fantasía | Semana 1 |
| 5 | ¿Qué pasa si el cliente quiere pagar por transferencia y se atrasa? | El cobro es manual; hace falta una política | Semana 4 |
| 6 | ¿Se muestra la marca Vuelvo en los mensajes al cliente final? | Afecta referidos y percepción del negocio | Mes 2 — **preguntarles a los clientes** |
| 7 | ¿Cuál es el precio de reventa para el canal de proveedores? | Bloquea los acuerdos | Mes 2 |

### Lo más importante de todo el plan

Si tuvieras que ignorar el 90% de este documento y quedarte con una sola cosa:

> **Salí a la calle, entrá a diez locales de la misma avenida, mostrales la
> pantalla de recordatorios en el celular, y escuchá qué te dicen.**

Todo lo demás de este plan es la formalización de eso. Las diez conversaciones
de esta semana valen más que los doce meses de planificación de arriba.

---

**Documentos relacionados:**
[Contexto de producto](../../.agents/product-marketing.md) ·
[Prospección](prospeccion.md) ·
[Precios](precios.md) ·
[Mensajes en frío](mensajes-en-frio.md)
