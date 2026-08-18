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

## Comandos

```bash
npm install          # instala deps + ejecuta `prisma generate` (postinstall)
npm run dev          # servidor dev, http://localhost:3000
npm run build        # prisma generate && next build (lo que ejecuta Vercel)
npm run db:push      # pushea prisma/schema.prisma a la base de datos (sin archivos de migración — schema-driven)
npm run db:seed      # borra + reseed datos demo (ver nota de peligro abajo)
npm run db:reset     # db push --force-reset + db:seed
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

`app/actions.ts` (customer/purchase/template/business CRUD + CSV import + venta rápida),
`app/auth-actions.ts` (register/login/logout), `app/admin-actions.ts` (solo superadmin). No hay
capa REST/API para mutaciones — solo `app/(app)/clientes/export/route.ts` existe como
Route Handler plain, porque descarga de CSV necesita headers `Response` raw en lugar de
server action.

### Segmentación es computada, no guardada

`lib/segmentation.ts` deriva el segmento de un customer (`vip` / `frecuente` / `ocasional` /
`nuevo` / `inactivo`) en cada lectura de `Business.inactivityDays` / `recompraDays` /
`vipMinSpend` más historial de compras del customer — no hay columna `segment` en ningún lado.
`getEnrichedCustomers()` de `lib/queries.ts` es el único lugar que joinea Customer + Purchase y
corre esta clasificación; reúsalo en lugar de re-derivar segmentos en otros lados.

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
