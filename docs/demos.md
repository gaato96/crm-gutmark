# Cuentas demo — Vuelvo CRM

Diez negocios de ejemplo, uno por rubro, para mostrar el sistema a potenciales
clientes. Cada uno tiene entre 200 y 260 clientes y más de un año de historia:
ventas todos los días del último mes, cumpleaños hoy y durante la semana,
recompras vencidas, clientes inactivos, comisiones del equipo, cajas cerradas,
puntos y mensajes ya enviados.

**Contraseña de todas:** `demo1234`

| Rubro | Negocio | Email | Módulos |
|---|---|---|---|
| Barbería | Barbería El Faro | `barberia@demo.vuelvo.app` | Caja, Puntos |
| Estética | Estética Lumière | `estetica@demo.vuelvo.app` | Caja, Puntos |
| Indumentaria | Urbana Indumentaria | `indumentaria@demo.vuelvo.app` | Puntos, Caja |
| Suplementos | Nutri Fuerza Suplementos | `suplementos@demo.vuelvo.app` | Puntos, Caja |
| Gimnasio | Gimnasio Titán | `gimnasio@demo.vuelvo.app` | Caja |
| Veterinaria | Veterinaria Patitas | `veterinaria@demo.vuelvo.app` | Caja, Puntos |
| Perfumería | Perfumería Bella | `demo@perfumeriabella.com` | Puntos, Caja |
| Óptica | Óptica Visión Clara | `optica@demo.vuelvo.app` | Caja |
| Lavadero | Lavadero Brillo | `lavadero@demo.vuelvo.app` | Puntos, Caja |
| Taller mecánico | Taller Rueda Libre | `taller@demo.vuelvo.app` | Caja |

También se puede entrar desde `/admin` → **Cuentas demo** → **Entrar**, sin
tipear la contraseña.

## Siempre "en hoy"

No hace falta restaurarlas todos los días. Cada vez que alguien entra a una
cuenta demo y cambió el día desde la última visita, el sistema corre todas las
fechas hacia adelante (ventas, cumpleaños, cajas, mensajes), así que siempre se
ve como un negocio que se usó hasta ayer. Ver `refreshDemoDates` en
`lib/demo-data.ts`.

Lo que cargues durante una demo (una venta, un mensaje marcado como enviado)
queda guardado. Para volver a dejarla limpia:

- `/admin` → **Cuentas demo** → **Restaurar datos** (una) o **Restaurar todas**.
- O desde la terminal: `npm run demo:setup` (todas) o `npm run demo:setup -- barberia`.

Restaurar **borra todos los clientes y ventas** de esa cuenta y genera todo de
nuevo. Solo funciona sobre negocios marcados como demo (`Business.isDemo`): no
hay forma de que borre un negocio real.

## Recorrido sugerido para una demo (10 minutos)

1. **Inicio** — "Tu plan de hoy": cuántos clientes hay para contactar hoy y
   cuántos ya se contactaron. Abajo, las tres cifras que venden el sistema:
   - *Volvieron por tus mensajes*: plata que entró de clientes que compraron
     dentro de las dos semanas de recibir un mensaje.
   - *Recompra pendiente*: lo que entra si vuelven los que ya deberían haber
     vuelto.
   - *Lo que se llevó la competencia*: lo que gastaban por año los clientes que
     se fueron.
2. **Campañas** — mostrar las campañas del rubro (ej. en la barbería "Hora del
   corte", que avisa a cada cliente según el servicio que se hizo). Tocar
   **WhatsApp** en un cliente: se abre el chat con el mensaje escrito y el
   cliente pasa a **Enviados**. Mostrar el avance "X de Y enviados".
3. **Cliente** — abrir uno VIP: historial, total gastado, segmento, puntos.
4. **Nueva venta** (tecla `N` o el botón verde): buscar un cliente escribiendo
   su nombre en minúscula, elegir servicios, cobrar. El cliente sale de las
   campañas de recompra solo.
5. **Reportes** — facturación de la semana, nuevos vs. los que volvieron, y
   **por día y por hora**: en qué momento conviene tener más gente.
6. **Caja** — arqueo a ciegas y comisiones pendientes por empleado.

## Qué rubro mostrar a quién

Si el prospecto no es de ninguno de estos rubros, usar el más parecido por
ritmo de recompra: un spa → Estética; una dietética → Suplementos; un pet shop
→ Veterinaria; una zapatería → Indumentaria.
