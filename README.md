# GUTMARK Fideliza

> Plataforma de fidelización post-venta para PYMES.
> **"Vendé más sin conseguir un solo cliente nuevo."**

CRM centrado en el cliente existente: base de datos, segmentación automática, recordatorios de cumpleaños y recompra, y campañas por email + WhatsApp manual.

---

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS** (diseño móvil-primero, en español)
- **Prisma + SQLite** (base local; migrable a Postgres/Supabase)
- **Server Actions** para toda la escritura (sin API REST intermedia)
- **Auth propia** (email + contraseña con bcrypt, sesiones en cookie httpOnly)
- **Multi-tenant**: cada negocio ve solo sus datos, aislados por `businessId`
- **Modo claro/oscuro** con tokens de tema (persistente, sin parpadeo al cargar)

## Requisitos

- Node.js 18+ (probado con Node 24)

## Puesta en marcha

```bash
npm install          # instala dependencias y genera el cliente Prisma
npm run db:reset     # crea la base y carga datos demo (20 clientes)
npm run dev          # levanta el servidor en http://localhost:3000
```

> Si el puerto 3000 está ocupado: `PORT=3001 npm run dev`.

**Cuenta demo** (creada por el seed): `demo@perfumeriabella.com` / `demo1234`.
También podés crear un negocio nuevo desde **Registrarse**.

### Scripts útiles

| Script            | Qué hace                                            |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo                              |
| `npm run build`   | Build de producción (genera Prisma + compila Next)  |
| `npm run db:push` | Aplica el esquema Prisma a la base                  |
| `npm run db:seed` | Carga los datos demo                                |
| `npm run db:reset`| Reinicia la base y vuelve a sembrar                 |

## Estructura

```
app/
  (auth)/               Login y registro (layout con panel de marca, sin sesión)
  (app)/                Rutas protegidas (guard de sesión + shell)
    page.tsx            Dashboard (KPIs + oportunidades del día)
    clientes/           Lista, alta, edición, ficha, importar y exportar CSV
    segmentos/          Clientes agrupados automáticamente
    recordatorios/      "Hoy tenés que…" (cumpleaños / recompra / reactivar)
    campanas/           Generador de envíos + plantillas editables
    configuracion/      Datos del negocio y reglas de segmentación
  actions.ts            Server Actions (crear/editar/compras/config/import)
  auth-actions.ts       register / login / logout
components/             UI reutilizable (shell, tarjetas, formularios)
lib/
  auth.ts               Hash de contraseña + sesiones en cookie
  segmentation.ts       Reglas de VIP / frecuente / inactivo / recompra
  queries.ts            Acceso a datos por negocio (aislado por sesión)
  csv.ts                Parser CSV + mapeo de columnas + fechas flexibles
  build-message.ts      Render de plantillas con variables {nombre} {negocio}
  messages.ts           Links wa.me y mailto
prisma/
  schema.prisma         Modelo de datos (Business, User, Session, Customer…)
  seed.ts               Datos demo + usuario demo
```

## Módulos del MVP

- ✅ **Acciones rápidas** — botón "Nueva venta" (atajo de teclado `N`) accesible desde
  cualquier pantalla: buscá un cliente o cargá uno nuevo y registrá la venta en el
  mínimo de clics, sin salir de donde estás. En mobile, un FAB con speed-dial (Nueva
  venta / Nuevo cliente / Importar) siempre a mano.
- ✅ **Base de clientes** — alta/edición/baja, notas, etiquetas, búsqueda y filtros.
- ✅ **Importación CSV** — carga masiva desde Excel/Google Sheets con mapeo de columnas
  auto-detectado, vista previa y descarte de duplicados (por teléfono o email).
- ✅ **Registro de compras** — actualiza automáticamente la última compra.
- ✅ **Segmentación automática** — VIP, frecuente, ocasional, nuevo, inactivo.
- ✅ **Recordatorios** — cumpleaños de la semana + recompra vencida + inactivos.
- ✅ **Campañas** — audiencias predefinidas; WhatsApp manual (link `wa.me` con
  mensaje listo) + email (`mailto`). Plantillas editables por el negocio.
- ✅ **Estadísticas** — ticket promedio, frecuencia, activos vs inactivos, ventas 30 días.
- ✅ **Exportación CSV** — descarga de toda la cartera (con segmento y totales), lista para Excel.
- ✅ **Cuentas y multi-negocio** — registro/login por email, sesión en cookie, datos
  aislados por negocio.

## Notas de arquitectura y próximos pasos

Este MVP usa **SQLite local** para poder correr y ver la interfaz sin configuración
externa. La capa de datos está aislada en `lib/`, por lo que migrar a
**Supabase/PostgreSQL** implica cambiar el `datasource` de Prisma y las credenciales.

El aislamiento entre negocios se aplica hoy **a nivel de aplicación** (toda consulta
filtra por el `businessId` de la sesión). Al migrar a Postgres/Supabase conviene
reforzarlo con **Row Level Security** a nivel de base de datos.

Pendiente para siguientes iteraciones:

- Row Level Security en base de datos (al pasar a Postgres/Supabase).
- Envío automático/masivo de emails (integrar Resend con `RESEND_API_KEY`).
- API de WhatsApp Business para envíos automáticos.
- Programa de puntos/beneficios y estadísticas avanzadas.
