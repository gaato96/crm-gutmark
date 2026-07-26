import { db } from "./db";

export async function createDefaultTemplates(businessId: string) {
  await db.template.createMany({
    data: [
      {
        businessId,
        type: "birthday",
        channel: "whatsapp",
        subject: "",
        body: "¡Hola {nombre}! 🎂 De parte de {negocio} te deseamos un muy feliz cumpleaños. Como regalo, tenés un beneficio especial en tu próxima compra esta semana. ¡Te esperamos! 💚",
      },
      {
        businessId,
        type: "birthday",
        channel: "email",
        subject: "🎂 ¡Feliz cumpleaños, {nombre}!",
        body: "¡Hola {nombre}!\n\nEn {negocio} queremos desearte un muy feliz cumpleaños. Para celebrarlo, te regalamos un beneficio especial en tu próxima compra durante esta semana.\n\n¡Te esperamos!\nEquipo de {negocio}",
      },
      {
        businessId,
        type: "winback",
        channel: "whatsapp",
        subject: "",
        body: "¡Hola {nombre}! 👋 Hace un tiempo que no te vemos por {negocio} y te extrañamos. Si venís esta semana, tenés un beneficio especial esperándote. 😊",
      },
      {
        businessId,
        type: "winback",
        channel: "email",
        subject: "Te extrañamos en {negocio} 💚",
        body: "¡Hola {nombre}!\n\nHace un tiempo que no pasás por {negocio}. Tenemos un beneficio especial reservado para vos si volvés esta semana.\n\n¡Nos encantaría verte de nuevo!\nEquipo de {negocio}",
      },
    ],
  });
}
