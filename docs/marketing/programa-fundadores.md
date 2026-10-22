# Programa Fundadores y mejoras para vender — Vuelvo CRM

Última actualización: 2026-10-22.

Este documento junta dos cosas: **qué mejorar del producto** para que se pueda
vender sin explicarlo en persona, y **cómo armar el programa de negocios
fundadores** (el primer mes sin cargo a cambio de uso real y devoluciones).
Se apoya en `precios.md` y `plan-marketing.md`; no los reemplaza.

---

## 1. Dónde está parado el producto hoy

**Lo fuerte (ya construido):**

- La promesa se entiende y el sistema la cumple: plan del día, campañas con
  mensaje listo, segmentos automáticos, recompra por servicio.
- Se mide el resultado: "Volvieron por tus mensajes" muestra la plata que trajo
  cada campaña. Casi ningún competidor chico tiene esto, y es el argumento de
  venta más fuerte.
- Cada rubro arranca con su catálogo, sus campañas y su vocabulario: nadie
  empieza con la pantalla en blanco.
- Caja y Reportes ya construidos, con comisiones del equipo.
- Desde ahora, un recorrido guiado al entrar por primera vez y otro en Caja.

**Lo que hoy frena la venta o el programa:**

| Problema | Por qué importa |
|---|---|
| No hay canal para reportar errores o ideas desde la app | Es justo lo que le vas a pedir a los fundadores. Si tienen que mandarte un audio por WhatsApp, el 80% de lo que encuentren no te llega. |
| No existe "Olvidé mi contraseña" | Un fundador que se olvida la clave queda afuera hasta que lo resetees a mano. Es la causa número uno de abandono en la primera semana. |
| No hay monitoreo de errores | Te enterás de un error cuando el cliente se queja, si es que se queja. |
| No ves quién usa el sistema y quién lo dejó | En `/admin` ves negocios y pagos, no actividad. No sabés a quién llamar antes de que se caiga. |
| El plan base figura en $0 en la plataforma | El MRR de `/admin` no dice nada, y el dueño no ve un precio de referencia. |
| Módulos no construidos figuran como disponibles | Un fundador puede pedir Stock o Turnos, que todavía no existen. |
| "Barberia demo" está como negocio real | Suma como cliente aunque no lo es. Marcarlo como demo o eximirlo de facturación. |

---

## 2. Mejoras recomendadas, por prioridad

### P0 — Antes de sumar el primer fundador (1 a 2 semanas)

1. **Botón "Reportar un problema o idea" dentro del panel.** Un botón fijo que
   abre un formulario corto (qué pasó, captura opcional) y guarda
   automáticamente la pantalla, el negocio, el dispositivo y la hora. Se lista
   en `/admin` con estado (nuevo / en curso / resuelto) y, al resolverlo, el
   fundador lo ve. Es la columna vertebral del programa.
2. **Recuperar contraseña por email.** El `.env.example` ya prevé Resend
   (`RESEND_API_KEY`); con eso alcanza para el link de recuperación.
3. **Checklist de activación en Inicio.** Cuatro tareas con progreso: cargar
   tu catálogo, importar o cargar 20 clientes, registrar tu primera venta,
   mandar tu primer mensaje. Desaparece al completarse. Complementa al
   recorrido: el recorrido muestra dónde está cada cosa y el checklist dice
   qué hacer primero.
4. **Monitoreo de errores** (Sentry tiene plan gratis y se integra con Next).
5. **Ordenar la plataforma:** cargar el precio del plan base, marcar como no
   disponibles los módulos sin construir y corregir "Barberia demo".

### P1 — Durante el mes de los fundadores

6. **Actividad por negocio en `/admin`:** última venta cargada, ventas por
   semana, mensajes enviados y clientes cargados, con un semáforo de "en
   riesgo" (más de 5 días sin cargar una venta). Así sabés a quién llamar.
7. **Resumen semanal para el dueño.** Un mensaje los lunes: "esta semana
   volvieron 6 clientes por tus mensajes y te dejaron $84.000; hoy tenés 12
   para contactar". Es lo que hace que el producto se sienta vivo aunque no
   lo abran todos los días, y lo que más baja la baja.
8. **Simplificar Caja con lo que digan los fundadores.** Ya se sumaron el
   recorrido, los tres pasos visibles con la caja cerrada y textos más claros.
   Lo próximo depende de dónde se traben de verdad.
9. **Exportar el reporte del mes** en PDF o imagen para compartir: el dueño se
   lo manda al contador o al socio, y cada envío es publicidad.

### P2 — Después del programa

10. **Turnos y reservas** (el número 2 del roadmap): para barbería, estética y
    veterinaria es la recompra calendarizada, y es lo que más van a pedir.
11. **Referidos:** el fundador que trae a otro negocio que paga recibe un mes
    sin cargo.
12. **Encuestas de satisfacción** después de la venta: alimentan reseñas de
    Google.

**Lo que no conviene hacer todavía:** envío automático por la API de WhatsApp
Business. Cuesta por mensaje, exige aprobar plantillas y cambia la promesa.
Hoy el envío manual uno por uno es una ventaja: el mensaje llega desde el
número del negocio, con su nombre, y no se lee como publicidad.

---

## 3. La oferta, en una frase

> **"Vuelvo te dice cada día a qué clientes escribirles, con el mensaje listo,
> y te muestra cuánta plata volvió por esos mensajes."**

Tres puntos de apoyo, en este orden:

1. **Nunca más un cumpleaños o una recompra olvidada.** El sistema arma la
   lista del día.
2. **El mensaje ya está escrito.** Tocás WhatsApp y se abre el chat con el
   texto listo.
3. **Ves el resultado en pesos.** "Este mes volvieron 14 clientes por tus
   mensajes y dejaron $210.000."

**Precio:** plan base $39.900/mes (ver `precios.md`). Caja y Reportes,
$26.900/mes. Puntos, $9.900/mes.

**Garantía propuesta (hipótesis, validar con los fundadores):** *"Si en el
primer mes pago los clientes que volvieron por tus mensajes no te dejaron al
menos lo que pagaste, el mes siguiente no lo pagás."* Se mide con un número que
el sistema ya calcula ("Volvieron por tus mensajes"), así que no hay discusión,
y no baja el precio de lista (coherente con §9 de `precios.md`).

---

## 4. Programa Fundadores

### Qué es

Entre **8 y 12 negocios** usan Vuelvo un mes sin cargo, con acompañamiento
cercano, a cambio de usarlo de verdad y de contar qué funciona, qué falla y qué
falta. Los que se quedan pasan a ser clientes con beneficios de fundador.

Es mejor pocos y bien acompañados que muchos sueltos: con 30 negocios no vas a
poder llamar a cada uno, y un fundador que no recibe atención no da devolución.

### A quién buscar

- **Rubros con clientela que vuelve sola:** barbería, peluquería, estética,
  veterinaria, pet shop, suplementos. Son los que mejor muestran resultados en
  30 días, porque la recompra es de 15 a 45 días.
- **Más de 100 clientes** y el dueño presente en el local.
- Que hoy **ya use WhatsApp con sus clientes**.
- Variedad: no más de 3 o 4 del mismo rubro, para que las devoluciones cubran
  distintos usos.
- Si es posible, al menos 3 con empleados, para probar Caja y comisiones.

### Qué recibe el fundador

- **El primer mes sin cargo**, con el plan base y Caja y Reportes incluidos.
- **Carga de su cartera hecha por ustedes**: le pedís el Excel, la libreta o
  la exportación de su sistema, y lo importás vos. Es el mayor obstáculo de
  arranque y vale más que cualquier descuento.
- **Precio de fundador congelado 12 meses**: paga el precio de lista, pero sin
  el ajuste semestral por inflación durante el primer año. Es un beneficio
  real que no rebaja la referencia de precio.
- **Línea directa** por WhatsApp y prioridad en lo que pida.
- **Su nombre en la lista de fundadores** (si quiere) y voz en qué se
  construye después.

### Qué se compromete a hacer

- **Cargar las ventas** al menos 4 días por semana durante el mes.
- **Mandar al menos una campaña** por semana desde Campañas.
- **Dos charlas de 20 minutos**: al final de la semana 1 y al final del mes.
- **Reportar desde el botón** cada cosa que no entienda, falle o le falte.
- **Si el resultado es bueno**, dar un testimonio corto (texto o video) con su
  número de "Volvieron por tus mensajes".

Conviene ponerlo por escrito en un mensaje simple, no en un contrato: ayuda a
que se lo tomen en serio.

### Calendario del mes

| Cuándo | Qué pasa | Quién |
|---|---|---|
| Día 0 | Alta del negocio con su rubro, importación de la cartera y 15 minutos juntos para hacer el recorrido guiado | Vos |
| Días 1–7 | Carga ventas todos los días. Al día 3, un mensaje para preguntar cómo va | Fundador / vos |
| Fin semana 1 | Charla 1: qué no se entendió, qué falló. Revisar juntos su plan del día | Ambos |
| Semana 2 | Primera campaña de recompra o reactivación. Se le ayuda a ajustar el texto | Fundador |
| Semana 3 | Revisar actividad en `/admin`. A quien no cargó en 5 días, se lo llama | Vos |
| Fin del mes | Charla 2 con sus números: clientes contactados, cuántos volvieron, cuánta plata. Propuesta de pasar a pago | Ambos |

### Cómo se mide si el programa funcionó

| Métrica | Meta |
|---|---|
| Activación: más de 50 clientes cargados en los primeros 7 días | 80% de los fundadores |
| Uso: ventas cargadas al menos 4 días por semana | 70% |
| Campañas: al menos 1 por semana | 70% |
| Resultado: algún peso en "Volvieron por tus mensajes" al día 30 | 70% |
| Conversión a pago al terminar el mes | 50% o más |
| Devoluciones: reportes enviados desde el botón | Al menos 3 por fundador |

Si la conversión queda por debajo del 30%, el problema no es el precio: es
activación o resultado. Mirar primero esas filas.

### Preguntas para la charla de cierre

1. ¿Qué fue lo más útil del mes? ¿Y lo que nunca usaste?
2. ¿Hubo algo que no entendiste o que te hizo perder tiempo?
3. Si mañana Vuelvo desapareciera, ¿qué extrañarías?
4. ¿Cuánto te parece razonable pagar por esto por mes? ¿A partir de qué
   precio te parecería caro? (Van Westendorp exprés, ver §7 de `precios.md`.)
5. ¿A qué otro negocio se lo recomendarías?

---

## 5. Mensaje de invitación (WhatsApp)

> Hola {nombre}, ¿cómo va? Soy {tu nombre}, de Vuelvo. Estamos eligiendo
> **10 negocios fundadores** para usar nuestro sistema un mes sin cargo.
>
> Vuelvo te dice cada día a qué clientes escribirles (cumpleaños, los que ya
> deberían haber vuelto, los que hace mucho que no vienen), con el mensaje
> listo para mandar por WhatsApp, y te muestra cuánta plata volvió por esos
> mensajes.
>
> La carga de tus clientes la hacemos nosotros. A cambio te pedimos usarlo de
> verdad durante el mes y contarnos qué mejorarías. ¿Te muestro en 10 minutos
> cómo se vería con tu negocio?

Para la demo, entrar con la cuenta demo de su mismo rubro (ver `docs/demos.md`):
ve su vocabulario, su catálogo y campañas como las que usaría.

---

## 6. Orden sugerido de trabajo

1. P0 del producto (botón de reportes, recuperar contraseña, checklist,
   monitoreo y orden de la plataforma).
2. Definir la lista de 15 a 20 candidatos y mandar invitaciones hasta cerrar
   entre 8 y 12.
3. Correr el mes con el calendario de arriba, construyendo P1 en paralelo.
4. Con los números del mes, actualizar `precios.md` y armar los primeros
   casos de éxito para la landing.
