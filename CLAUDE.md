# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) cuando trabaja con código en este repositorio.

## Qué es esto

Vuelvo CRM — un CRM de fidelización post-venta para PYMEs argentinas (negocios pequeños:
perfumerías, peluquerías, veterinarias, gimnasios, tiendas de mascotas, etc.). La propuesta:
"vendé más sin conseguir un solo cliente nuevo" — ayuda a un negocio a conocer sus clientes
existentes, nunca olvidar un cumpleaños, y traer de vuelta a los clientes inactivos.
Claim: "Porque vender una vez no alcanza".

### Identidad de marca (v2)

La fuente de verdad es `docs/marca/Manual_de_Marca_Vuelvo_CRM.md`. Lo esencial:

**Nombre.** "Vuelvo CRM", con "CRM" en menor jerarquía — es el descriptor de categoría,
no parte del nombre hablado. Arquitectura de marca: GUTMARK (marca madre) → Vuelvo CRM
(producto), que se expresa con "Desarrollado por GUTMARK" en landing y login (prop
`byline` de `<Logo>`), no dentro del panel.

**Logo.** `public/logo.svg` (badge violeta autocontenido) y `public/logo-mark.svg`
(solo la marca, transparente, para superficies que ya son violetas). Son **vectoriales**,
convertidos desde `docs/marca/LOGO VUELVO CRM.pdf` con `node scripts/pdf-to-svg.cjs` —
un parser mínimo del content stream del PDF, no un conversor general. Si el logo cambia,
volver a correr ese script y después `npm run icons:generate`.

`components/logo.tsx` es el único lugar que sabe qué archivo usar. `<LogoMark>` (solo
ícono, con `variant="plain"` para el sin-badge) y `<Logo>` (ícono + wordmark) se usan en
sidebar, topbar mobile, drawer, header de `/admin`, panel de `(auth)`, nav y footer de la
landing, y la tarjeta de fidelidad — cambiar de logo es editar ese archivo, no perseguir
cada uso.

**Paleta.** Verde `#00BE86` (`brand-500`) para acciones; violeta `#5B2EE5` (`accent-600`)
para acentos y superficies de marca; blanco/neutros dominando (60-70% según el manual).
La escala `gold` de la identidad anterior ya no existe: la reemplazó `accent`.

⚠️ **El verde es brillante y no admite texto blanco.** Blanco sobre `#00BE86` da 2.41:1 y
reprueba WCAG AA; con `brand-950` da 8.12:1. Por eso `.btn-primary` es verde con letra
oscura. El violeta es al revés: `.btn-accent` es violeta con letra blanca (7.08:1). Para
texto verde sobre fondo claro hay que usar `brand-700` (7.52:1) — `brand-600` se queda en
4.48:1, apenas por debajo. El anillo de foco usa `brand-600` porque WCAG pide 3:1 para
elementos no textuales.

**Tipografía.** Montserrat (`font-display`: titulares, números, CTA, versalitas) +
Poppins (`font-sans`: cuerpo e interfaz). El manual pide no mezclar más familias de marca;
`font-mono` existe pero apunta a la monoespaciada **del sistema**, sin cargar webfont, y
está solo para lo que necesita ancho fijo de verdad (pegar CSV, bloques de código,
mostrar una contraseña).

`scripts/generate-icons.cjs` (`npm run icons:generate`) rasteriza desde `logo.svg` para
producir `app/icon.png`, `app/apple-icon.png`, todo `public/icons/` y `public/og.png`. El
maskable se arma aparte (violeta a sangre + marca al 58%) porque el sistema operativo
aplica su propia máscara y un badge ya redondeado quedaría recortado dos veces. El texto
del OG usa fuentes del sistema, así que conviene mirarlo antes de commitear.

El plan de fases y el estado real de cada módulo viven en `docs/roadmap.md`.

## Comandos

```bash
npm install          # instala deps + ejecuta `prisma generate` (postinstall)
npm run dev          # servidor dev, http://localhost:3000
npm run build        # prisma generate && next build (lo que ejecuta Vercel)
npm run db:push      # pushea prisma/schema.prisma a la base de datos (sin archivos de migración — schema-driven)
npm run db:seed      # borra + reseed datos demo (ver nota de peligro abajo)
npm run db:reset     # db push --force-reset + db:seed
npm run db:migrate-campaigns   # consolida Template (viejo) en Campaign; idempotente, no borra nada
npm run db:migrate-sales       # rellena Purchase.subtotal en ventas anteriores a los ítems; idempotente
npm run db:migrate-modules     # fusiona el módulo "reportes" dentro de "caja"; idempotente
npm run db:migrate-rubros      # pasa Business.rubro de texto libre a códigos + fija catalogMode; idempotente
npm run icons:generate    # regenera íconos PWA + og.png desde public/logo.svg via sharp
node scripts/pdf-to-svg.cjs   # regenera public/logo*.svg desde el PDF del manual de marca
```

No hay suite de pruebas ni script de lint configurados en este proyecto.

`.env` necesita `DATABASE_URL` (pooled, puerto 6543, `?pgbouncer=true` — usado en runtime) y
`DIRECT_URL` (direct, puerto 5432 — usado por `prisma db push`). Ambos apuntan a la misma
instancia Postgres de Supabase; ver `.env.example`.

**Peligro:** `db:seed` / `db:reset` borran *cada* fila de Business/User/Customer antes de reseed
datos demo (incluyendo el superadmin, que lo recrea). `prisma/seed.ts` se rehúsa a ejecutar si
encuentra algún negocio además del demo (`Perfumería Bella`) e interno del superadmin — así que
una vez que haya negocios reales registrados, `db:seed` aborta con error en lugar de borrarlos.
Solo `ALLOW_SEED=true npm run db:seed` bypasea esa protección; nunca la uses con una BD con datos reales.

## Arquitectura

### Route groups = tres niveles distintos de acceso

- `app/page.tsx` — landing público de marketing (sin auth). Redirige a `/dashboard` o `/admin`
  server-side si ya existe sesión (chequeado via `getSessionUser()`).
- `app/(auth)/` — `/login`, `/registro`. Redirige si ya está logueado.
- `app/(app)/` — el CRM real: el plan base siempre activo (`/dashboard`, `/clientes`,
  `/segmentos`, `/recordatorios`, `/campanas`, `/configuracion`) más cualquier módulo pagado
  que el negocio haya habilitado (`/modulos` para browsear/solicitar, y ruta propia de cada módulo —
  ver "Módulos de complemento pagos" abajo). Guardado en `app/(app)/layout.tsx` via `getSessionUser()`;
  envuelve todo en `<AppShell>` (sidebar, modal de venta rápida, banner de suplantación). Este es
  también el único route group instalable como PWA (ver "PWA" abajo).
- `app/(admin)/` — `/admin` (lista de negocios + MRR), `/admin/negocios/nuevo`,
  `/admin/negocios/[id]` (módulos por negocio/pricing/pagos), `/admin/modulos` (editor de catálogo),
  `/admin/configuracion` (pricing de plataforma + contraseña superadmin). Guardado via
  `requireSuperAdmin()` en `lib/auth.ts`, que checkea `session.role === "superadmin"`.

Los route groups no afectan URLs — mover una página entre `(app)` y `(admin)` solo cambia
qué layout guard aplica, no la ruta.

### Multi-tenancy: businessId + role, aislamiento forzado en capa app

Cada modelo que guarda datos (`Customer`, `Purchase`, `Template`, `ContactLog`) lleva un
`businessId` y siempre es consultado scoped a `getCurrentBusiness()` (en `lib/queries.ts`),
que lee la sesión y devuelve el negocio del llamador. El aislamiento de tenant está forzado en
la **capa aplicación**, no via políticas Postgres RLS por fila — la app se conecta como el rol
`postgres` propietario de tablas, que bypasea RLS completamente, así que una política a nivel
Postgres no agregaría aislamiento real de todos modos (y fue explícitamente saltada por el costo
de latencia). Nunca agregues una query que lea Customer/Purchase/etc. sin filtrar por `businessId` de la sesión.

Lo que Postgres RLS *sí* se usa aquí es cerrar la REST API pública de Supabase
(`/rest/v1/<Table>`): `prisma/security.sql` (aplicada via `node scripts/apply-security.cjs`,
que ejecuta cada statement contra `DIRECT_URL` ya que no hay `psql`/`pg` en esta máquina)
revoca grants default `anon`/`authenticated` y habilita RLS sin políticas en cada tabla —
esto solo bloquea la capa PostgREST que Supabase expone por default sobre tablas Prisma;
no tiene efecto en queries propias de la app. **Re-ejecuta `apply-security.cjs` después de cada
`prisma db push` que agregue una tabla** — nuevas tablas heredan grants públicos nuevamente y
de otro modo estarían expuestas. `scripts/verify-security.cjs` checkea que el lockdown ocurrió
(RLS habilitado + grants revocados) sin necesidad de pegar endpoints REST desde afuera.

`User.role` es `"owner"` (default, atado a un negocio) o `"superadmin"` (puede manejar cada
negocio via `/admin`). La propia fila `User` de un superadmin aún apunta a un negocio placeholder
nominal (`Vuelvo (interno)`, creado por seed, `billingExempt: true`) puramente para satisfacer
el FK requerido — de otro modo no se usa.

### Auth e suplantación (`lib/auth.ts`)

Auth custom cookie-session (bcrypt + tabla `Session`), sin librería auth de terceros.
`getSessionUser()` es la única función que toda página/layout protegido llama; devuelve `null` si
la cookie falta/expiró, o si el negocio fue suspendido `active: false` (a menos que el usuario
sea superadmin).

Superadmin "login como este negocio" (`app/admin-actions.ts` → `impersonateBusiness`) funciona
creando una *nueva* Session para el user propietario del negocio target, guardando el token de
sesión actual del admin en la columna `impersonatorToken` de esa nueva sesión. `stopImpersonating()`
lee esa columna, borra la sesión suplantada, y restaura la cookie al token admin original. Por
eso `AppShell` renderiza un banner de suplantación (`isImpersonating` de `getSessionUser()`) —
es la única pista visual que "Volver a admin" funcionará.

`changePassword` (en `app/auth-actions.ts`) está bloqueado mientras se suplanta — un superadmin
"viendo como" un negocio no puede hijackear contraseña de esa cuenta — y en éxito revoca cada
otra fila `Session` para ese user via `revokeOtherSessions()`, así que cambio de contraseña
también loguea fuera en cualquier otro dispositivo/navegador.

### Todo escribe via Server Actions

`app/actions.ts` (customer/purchase/business CRUD + CSV import + venta rápida),
`app/campaign-actions.ts` (CRUD de campañas), `app/points-actions.ts` (módulo Puntos),
`app/auth-actions.ts` (register/login/logout), `app/admin-actions.ts` (solo superadmin). No hay
capa REST/API para mutaciones — solo `app/(app)/clientes/export/route.ts` existe como
Route Handler plain, porque descarga de CSV necesita headers `Response` raw en lugar de
server action.

⚠️ **Un Server Action es un endpoint POST direccionable por su ID.** Cualquier acción que
reciba un `id` del cliente tiene que confirmar la pertenencia contra el negocio de la
sesión (`findFirst({ where: { id, businessId } })`, o `updateMany`/`deleteMany` con el
`businessId` en el where) — no alcanza con que la UI solo muestre lo propio. `updateCustomer`,
`deleteCustomer`, `addPurchase` y `logContact` no lo hacían y permitían tocar datos de otro
negocio pasando el id a mano.

### Segmentación es computada, no guardada

`lib/segmentation.ts` deriva el segmento de un customer (`vip` / `frecuente` / `ocasional` /
`nuevo` / `inactivo`) en cada lectura de `Business.inactivityDays` / `recompraDays` /
`vipMinSpend` más historial de compras del customer — no hay columna `segment` en ningún lado.
`getEnrichedCustomers()` de `lib/queries.ts` es el único lugar que joinea Customer + Purchase y
corre esta clasificación; reúsalo en lugar de re-derivar segmentos en otros lados.

### Campañas: disparador guardado, audiencia calculada al leer

Una `Campaign` junta **a quién le llega** (el disparador) y **qué le dice** (cuerpo de
WhatsApp + asunto y cuerpo de email) en una sola fila. Reemplazó a `Template`, que
guardaba una fila por tipo × canal y no tenía disparador propio — los tres filtros
("cumple esta semana", "vencieron la recompra", "inactivos") estaban escritos a mano y
duplicados en `/campanas`, `/recordatorios` y `buildDashboard`. `Template` sigue en el
schema hasta confirmar que todos los negocios pasaron por `npm run db:migrate-campaigns`
(idempotente, respeta el texto que el negocio ya había escrito); después se borra.

**No hay cron.** Igual que el segmento, la audiencia no se materializa: se calcula en
cada lectura con `matchesCampaign()` de `lib/campaigns.ts`. Ese archivo es **puro** a
propósito — sin `server-only`, sin Prisma — porque `components/campaign-editor.tsx` es
client y necesita `TRIGGER_META` para armar el formulario. `lib/queries.ts` expone
`getCampaigns()` / `campaignRecipients()` / `ruleDefaults()`, y las tres pantallas pasan
por ahí: si alguna vuelve a filtrar clientes por su cuenta, los números dejan de coincidir
entre sí (que es exactamente el bug que había — el dashboard sumaba cumpleaños + recompra
por separado y contaba dos veces a quien caía en ambas).

`triggerDays` en `null` **no** significa cero: significa "usar el default". La campaña de
recompra de fábrica lo deja en null a propósito para seguir el `recompraDays` de
Configuración en vez de duplicar el valor. `excludeInactive` existe porque el mensaje de
"hace poco que no venís" no aplica a alguien que ya se dio por perdido.

Las campañas con `builtin` (`birthday`, `winback`) se editan en el texto pero **no en el
disparador**, y no se borran: el resto de la app las busca por ese código. Ojo con esto:
el editor deshabilita esos controles, y **un control deshabilitado no viaja en el
FormData**, así que `updateCampaign` parsea el texto y el disparador por separado
(`parseText` / `parseTrigger`) — pedir el disparador siempre haría imposible guardar una
campaña de fábrica. El server tampoco debería confiar en un disparador mandado por el
cliente para una campaña cuyo disparador no se puede cambiar.

Las variables de `renderTemplate` (`lib/messages.ts`) se resuelven por diccionario con una
regex, no con `replaceAll` literal: una variable mal escrita queda **visible** en el
mensaje (`{nombree}`) en vez de desaparecer, así el negocio ve el error antes de
mandárselo a un cliente. `{puntos}` solo trae dato real si el módulo Puntos está activo.

### Rubro y vocabulario: el sistema no es de barberías

El CRM apunta a **cualquier negocio con clientela que vuelve**, no solo a los
que dan servicios. Un kiosco no vende "servicios" y un consultorio no vende
"productos", así que la interfaz no puede tener el vocabulario escrito a mano.

`Business.rubro` es un **código** de `RUBROS` (`lib/rubros.ts`), no texto libre
como antes. De él sale `Business.catalogMode`: `productos` | `servicios` |
`ambos`. Ese modo decide cómo se llama todo: el ítem del menú, el título de la
pantalla, la pregunta de quién hizo la venta, el disparador de campaña, el corte
del reporte y hasta el verbo con que se describe una campaña ("Se hicieron
Corte + Barba" vs "Compraron Alimento 15 kg").

Todo ese texto vive en **un solo lugar**: `catalogWords(mode)` en
`lib/rubros.ts`. Si hay que agregar una palabra nueva, va ahí y no en la
pantalla — el archivo es puro justamente para que lo puedan importar las
pantallas client.

El modo **nace del rubro** al crear el negocio y el superadmin lo puede forzar
aparte desde `/admin/negocios/[id]` (una barbería que solo quiere ver
servicios). Cuando el dueño cambia su rubro desde `/configuracion`, el modo lo
sigue **solo si nadie lo forzó**: si el superadmin lo había cambiado a mano, esa
decisión no se pisa. Un rubro desconocido cae en `ambos`, que es el que no
esconde nada — es preferible mostrarle "Productos y servicios" a un consultorio
que esconderle los productos a un kiosco.

`Service.kind` (`producto` | `servicio`) solo se elige en los negocios de modo
`ambos`; en los demás lo fija el modo, así un kiosco no puede terminar con
"servicios" cargados.

⚠️ La ruta del catálogo es **`/catalogo`** y pertenece al plan base. El módulo
que antes se llamaba "Catálogo digital" pasó a `/vidriera` ("Vidriera digital")
porque es otra cosa: la página **pública** que el negocio comparte, no su lista
de precios interna.

### Servicios y venta con ítems

`Service` es un producto o servicio con precio predefinido (pantalla `/catalogo`). Es del **plan base**,
no de un módulo: sin esto las campañas no pueden filtrar por *qué* compró el
cliente, que es lo que hace que la fidelización sirva de verdad.

Cada servicio puede llevar su propio `recompraDays` — un corte se repite a los 15
días y una coloración a los 60, así que el único `recompraDays` del negocio no
alcanza. El disparador `service-recompra` lo usa como default: si la campaña deja
`triggerDays` en null, hereda el del servicio, y recién si ese también es null cae
al general de Configuración.

Una venta ahora tiene `PurchaseItem[]`, `subtotal`, `discount` y `paymentMethod`.
`amount` sigue siendo **lo que efectivamente entró** (`subtotal - discount`) y es
el campo que suman todos los cálculos de facturación — no cambiar esa semántica.
Los puntos se otorgan sobre `amount`, no sobre el subtotal: si hubo descuento, el
cliente no gana puntos por lo que no gastó.

`PurchaseItem` guarda `name` y `unitPrice` como **foto del momento**: si mañana
sube el precio del corte, la venta de ayer no cambia. Además lleva `businessId`,
`customerId` y `date` denormalizados a propósito — con eso, "cuándo fue la última
vez que este cliente compró este servicio" se resuelve con un solo `groupBy` en
vez de traer todas las compras con sus ítems y recorrerlas en cada pantalla.

`lib/sale-write.ts` (`recordSale`) es el **único** lugar que escribe una venta;
lo usan la ficha del cliente, la venta rápida y el alta con primera venta. Ahí se
releen los servicios del catálogo: el nombre sale de la base y no del formulario,
porque si no un cliente manipulado podría escribir cualquier nombre y precio en
los reportes del propio negocio. Los totales se calculan siempre en el server con
`saleTotals()` — nunca se confía en un total mandado por el cliente.

`lib/sales.ts` es **puro** (métodos de pago y aritmética), igual que
`lib/campaigns.ts` y `lib/modules.ts`, porque lo importa el modal de venta rápida
que es client.

⚠️ En `components/sale-items-picker.tsx`, `onItemsChange` es el setter de React
tal cual (`Dispatch<SetStateAction<…>>`), no un callback plano: las funciones
actualizan a partir del estado **anterior**. Con un callback plano, dos clics
seguidos sobre el mismo servicio leían ambos la lista vieja y el segundo se
perdía — en el mostrador eso es una unidad que no se cobra.

### Módulos de complemento pagos

El plan base (`/dashboard`, `/clientes`, `/segmentos`, `/recordatorios`, `/campanas`) siempre está
activo. Todo lo demás — Stock, POS, Caja, Reportes, Puntos/beneficios, Catálogo digital,
Turnos, Cuenta corriente, Gastos — es un módulo pagado opcional, modelado como `Module` (el
catálogo: name/description/price, `MODULE_SEED` de `lib/modules.ts`) + `BusinessModule` (por
negocio `enabled` + opcional `priceOverride`, `null` = usar precio catálogo).

`lib/modules.ts` es deliberadamente un archivo **puro** — sin `"server-only"`, sin import Prisma —
porque `components/app-shell.tsx` (componente client) importa `MODULE_NAV` para resolver iconos
Lucide client-side; Server Components no pueden pasar componentes de icono como props serializables.
`MODULE_CODES` es la fuente única de verdad para códigos de módulo válidos (`isModuleCode()` guarda
cada lugar donde código viene de input de usuario).

Gatekeeping de ruta de módulo toma dos llamadas a `requireModule(code)` (`lib/module-guard.ts`), no
una: un thin `layout.tsx` en carpeta de ruta del módulo (cubre page loads) *y* llamada dentro de
cada Server Action que muta datos de ese módulo (cubre la action misma, ya que Server Actions
son endpoints POST directamente direccionables que layout guard nunca ve). `getSessionUser()`
ya joinea `BusinessModule` (filtrada a `enabled: true`) en la query de sesión, así que
`session.business.modules: string[]` está disponible sin round-trip extra — `AppShell` la usa
para empalmar cada ítem nav de módulo activo en sidebar entre los items base-plan fijos y
Módulos/Configuración (`buildNavItems()`).

Superadmins togglean módulos y setan price overrides per-negocio desde `/admin/negocios/[id]`
(`components/admin-business-modules.tsx` → `setBusinessModule` / `setBusinessModulePrice` en
`app/admin-actions.ts`); el catálogo mismo (name/description/price/available) se edita desde
`/admin/modulos` (`components/admin-module-catalog.tsx` → `updateModule`). "Sincronizar
catálogo" (`syncModuleCatalog`) upserts `MODULE_SEED` en la DB pero nunca overwrite price/text
de fila existente, así que es seguro re-correr después de agregar módulo nuevo a seed list.

### Billing: pricing manual + ledger de pagos, sin payment gateway

`PlatformSetting` es fila singleton (`getPlatformSettings()` de `lib/platform.ts`, `id:
"singleton"`, upsert on first read) que guarda `basePlanPrice`, `currency`, y `dueDay` (día del
mes en que un negocio se considera `vencido` si no pagó). `Payment` es ledger manual — el
superadmin registra "este negocio pagó $X para período Y/M" desde `/admin/negocios/[id]`
(`components/admin-payments.tsx` → `registerPayment`); no hay integración Mercado Pago /
payment gateway, por choice explícita. `billingStatus()` deriva `al-dia` / `pendiente` /
`vencido` / `exento` (`Business.billingExempt`) de si existe fila `Payment` para período
calendario actual, no de fuente externa. `businessMonthlyTotal()` suma plan base más precio de
cada módulo habilitado (override o precio catálogo) — esto es lo que alimenta card MRR en
`/admin` y breakdown per-negocio en `/admin/negocios/[id]`.

### Módulo Caja y Reportes

Se vende como **un** módulo (código `caja`, $26.900) pero navega desde **dos**
pantallas. Por eso `MODULE_NAV` tiene dos filas con el mismo `code` — el sidebar
usa el `href` como clave de React, que sí es único. Antes eran dos módulos
separados; `npm run db:migrate-modules` fusiona los datos viejos.

**Los costos son una foto.** `SaleCost` guarda el nombre y el importe ya
calculados. Si mañana se le sube la comisión a un barbero, lo que se le debía por
los cortes del mes pasado no cambia. Por eso la etiqueta dice "Comisión Juan" en
texto y no se arma leyendo el empleado al mostrar.

La comisión sale de `Employee.commissionPct` y no de una `CostRule`, porque
depende de quién atendió y no de la venta. Las `CostRule` son para lo que
descuenta un tercero (Mercado Pago, impuesto al débito) y pueden atarse a un
método de pago: cobrar la comisión de la pasarela en una venta en efectivo sería
un error caro y silencioso.

Todo se calcula sobre lo **efectivamente cobrado** (`Purchase.amount`), no sobre
el subtotal: si el negocio hizo un descuento, el barbero cobra su porcentaje de
lo que entró.

⚠️ **El arqueo solo cuenta el efectivo.** Una venta con tarjeta no deja plata en
el cajón; sumarla daría un faltante enorme en cada cierre. Ver `cashExpected()`
en `lib/cash.ts`.

⚠️ **El esperado se congela al cerrar** (`CashSession.expectedAmount`) en vez de
recalcularse al leer. Si después se edita una venta vieja, el arqueo de aquel día
tiene que seguir diciendo lo que decía cuando se cerró.

El cierre es **a ciegas**: el esperado queda tapado hasta escribir lo contado. Si
el número está a la vista se copia y el arqueo no sirve para nada — hay un enlace
para verlo igual, porque el dueño sí puede querer mirarlo.

El signo de un `CashMovement` lo fija `signedAmount()` según el tipo, nunca el
formulario: si el importe viniera con signo desde la UI, un egreso podría
cargarse como ingreso y la caja cerraría bien con la plata mal.

`applySaleSideEffects()` (`lib/cash-write.ts`) se auto-gatea con el módulo, igual
que `awardPointsForPurchase`: el flujo de venta llama siempre y no pasa nada si
el negocio no lo tiene contratado.

Los empleados **no** son usuarios: no tienen login. Son registros para saber
quién hizo cada venta y cuánto se le debe. Darles cuenta propia implicaría
permisos por rol dentro del negocio, que es otro problema (ver `docs/roadmap.md`).

### Theming: CSS variables, no dark: className soup

`app/globals.css` define triplets RGB (`--canvas`, `--surface`, `--surface-2/3`, `--line`,
`--ink*`) bajo `:root` (light) y `:root.dark` (dark), consumidos via Tailwind tokens en
`tailwind.config.ts` (`bg-canvas`, `text-ink-muted`, etc.). `components/theme-toggle.tsx`
togglea la clase `dark` en `<html>` y persiste a `localStorage` (`gf-theme`); script inline
en `app/layout.tsx` la aplica antes de paint para evitar flash. Cuando stylees algo nuevo,
alcanza por semantic tokens (`bg-surface`, `text-ink-soft`, `border-line`) en lugar de
grays Tailwind raw — la paleta raw (`slate-*`, `white`) no se adapta a dark mode.

Tipografía: Montserrat (`font-display`) + Poppins (`font-sans`), via `next/font/google`
en `app/layout.tsx`. Ver "Identidad de marca (v2)" arriba — `font-mono` no carga
webfont, es la del sistema y solo para datos de ancho fijo.

### Landing pública: GSAP, fotos remotas y contraste de botones

`app/page.tsx` es la única página con motion de scroll y con imágenes remotas.
El panel no usa ninguna de las dos cosas, así que todo eso vive fuera de `(app)`.

El motion es GSAP + ScrollTrigger, registrados una sola vez en
`components/landing/gsap-setup.ts`; el resto de los componentes de motion importan
desde ahí. Cada uno es un client-leaf (`"use client"`) que recibe los hijos ya
renderizados por el Server Component padre y los ubica con atributos `data-*`
(`data-anim`, `data-step`), así la landing sigue siendo server-rendered y el
envoltorio client no conoce su contenido. **Todo el motion vive dentro de un
`gsap.matchMedia("(prefers-reduced-motion: no-preference)")`**: con movimiento
reducido las animaciones nunca se crean y el marcado queda en su estado final
visible, sin necesidad de un camino alternativo. Las animaciones CSS
(`animate-marquee` y compañía) necesitan su propio corte, que está al final de
`app/globals.css`.

La cinta de rubros es CSS puro, sin JS: la pista lleva el contenido duplicado y
se desplaza `-50%`. La separación entre ítems va como `padding-right` de cada
uno y **no** como `gap` del flex: con `gap` el ancho total es `2·copia + gap` y
el corte del bucle no cae justo, así que se ve un salto en cada vuelta.

**El hero es la única banda que se queda oscura en los dos temas.** Su fondo es
`public/hero.mp4` y sobre un video no se puede garantizar contraste con tokens
que cambian de valor según el tema, así que el scrim y los colores del texto
quedan fijos y el contraste se calcula una sola vez. Dentro del hero **no uses
`text-ink` ni `bg-surface`**: en modo claro serían texto oscuro sobre negro. El
botón secundario también es propio del hero por el mismo motivo. Lo único que
sigue al tema es el fundido inferior, que va hacia `canvas` para que el corte
con la sección siguiente no se note.

El scrim son dos capas y cambia de forma según el ancho: en mobile es plano
(el texto ocupa todo el ancho, un degradado horizontal dejaría el final de cada
renglón sobre la zona clara) y en `lg:` es direccional (el texto vive en la
mitad izquierda, así que la derecha se abre y deja ver el video). Los peores
casos medidos sobre la base violeta (`accent-900`), suponiendo un cuadro blanco
del video: 12.5:1 en el titular mobile, 19:1 en el titular desktop, 7.3:1 en la
bajada. Si tocás las opacidades, rehacé esa cuenta.

`components/landing/hero-video.tsx` no hace autoplay a ciegas: se frena con
`prefers-reduced-motion`, con `saveData`, y se pausa fuera de pantalla o con la
pestaña oculta. El flag `onScreen` arranca en `true` a propósito, para que si el
IntersectionObserver no llegara a disparar el video no quede pausado para
siempre en el primer cambio de pestaña.

Las fotos salen de Unsplash vía `lib/landing-media.ts` (archivo puro, lo importan
server y client). El host está declarado en `images.remotePatterns` de
`next.config.mjs`; si algún día se agrega otro origen hay que sumarlo ahí o
`next/image` tira error en build.

Los contrastes de botón están calculados y anotados en `app/globals.css` — ver
"Identidad de marca (v2)" arriba para el resumen. Esto afecta a toda la app, no
solo a la landing: **no pongas texto blanco sobre el verde de marca**, que es el
error fácil de cometer viendo el manual sin hacer la cuenta.

### PWA: panel instalable, no el sitio de marketing

Solo `app/(app)/` es instalable como PWA — el landing público (`app/page.tsx`) y
`app/(auth)/` nunca deben ofrecer "Agregar a pantalla de inicio". Por eso `app/(app)/manifest.webmanifest/route.ts`
es el archivo de manifest: es un Route Handler manual, no el convention file de Next que silenciosamente
droppea rutas anidadas en build de producción. `app/(app)/layout.tsx` también lleva
metadata `appleWebApp` y, via `metadata.other`, tag meta `apple-mobile-web-app-capable`
seteado manualmente — Next mismo solo emite `mobile-web-app-capable` sin prefijo, que iOS
Safari viejo ignora. `components/register-sw.tsx` (registro SW) vive en `app/(app)/layout.tsx`
también, no en root layout, así que el service worker no se registra desde visit landing-page.

El `start_url` del manifest es `/dashboard` (prompt install solo aparece mientras browsereas
el panel, así que aquí es donde "abrir app" debería lands) pero `scope` se queda `"/"` — las
rutas del panel son hermanas (`/clientes`, `/segmentos`, etc.), no todas anidadas bajo `/dashboard`,
así que scope más estrecho kickearía la app instalada de vuelta a tab browser normal en el momento
que user navegara a cualquiera de ellas. `id: "/"` se seta explícitamente así que se queda
stable si `start_url` alguna vez cambia de nuevo.

`public/sw.js` solo cache-first's static, assets con hash (`/_next/static/`, `/icons/`,
fonts/images) y pasa cada otro request directo a network. No lo extiendas a cache páginas HTML
o respuestas Server Action — esto es app scoped sesión/negocio, y cachear respuesta dashboard
riskea mostrar stale o (en dispositivo compartido) datos de otro negocio. Iconos se generan
de `scripts/icon-source*.svg` via `npm run icons:generate` (sharp) — editá el SVG y regenerá
en lugar de hand-editing PNGs.

Dev-mode gotcha: porque el SW se registra site-wide (scope `"/"`) en el momento en que primero
visitás cualquier página `(app)`, puede terminar cache-first-ing un route chunk unversioned
`/_next/static/chunks/app/**` de *antes* de tu latest edit — cada restart `next dev` subsecuente
sirve stale Server Action reference de ese cached chunk (surfaces como "Failed to find Server
Action ... this request might be from an older or newer deployment", o nav que silenciosamente
no refleja code change) aún cuando el server en sí es fresh. Si dev behavior se ve stale después
de restart dev server, unregister el SW y clear `caches` para `localhost:3000` antes de asumir
que es un bug real — esto no pasa en production, donde filenames chunk tienen content-hash y
code change siempre produce URL nueva.

### Deployment

Vercel, región pinned a `gru1` (São Paulo) en `vercel.json` — esto importa porque la
instancia Postgres Supabase también está en `sa-east-1`; apuntando serverless functions a
región diferente previamente causó 5-9s page loads de cross-continent connection setup en
cada Lambda frío. Si deploy latency regresa, checkea `vercel.json` región vs. DB región
antes que cualquier otra cosa.

### Página oculta de estrategia de marketing

`app/panel-mkt-9f3e7ab2/page.tsx` es una ruta de lectura exclusiva del dueño del proyecto,
sin link desde ningún lado del sistema. El control de acceso es únicamente el slug aleatorio
de la URL más `robots: noindex` (no aparece en buscadores) — no requiere `getSessionUser()`
ni ningún login, a propósito, para poder abrirla desde el celular con solo el link guardado.
Renderiza (via `marked`) los `.md` que viven en `docs/marketing/` (plan de marketing,
prospección, precios, mensajes en frío), generados con las skills `/prospecting`,
`/marketing-plan`, `/pricing` y `/cold-email` a partir del contexto de
`.agents/product-marketing.md` (ese archivo está gitignoreado — vive solo local, no en el
repo). Si se agregan o renombran documentos en `docs/marketing/`, actualizar el array
`DOCUMENTS` en ese archivo.
