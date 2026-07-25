import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DAY = 1000 * 60 * 60 * 24;
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);

// Cumpleaños relativo a hoy (mismo mes/día ajustado), con un año de nacimiento dado
function birthdayInDays(offsetDays: number, birthYear: number): Date {
  const target = new Date(now.getTime() + offsetDays * DAY);
  return new Date(birthYear, target.getMonth(), target.getDate());
}
function birthdayFixed(month: number, day: number, birthYear: number): Date {
  return new Date(birthYear, month - 1, day);
}

async function main() {
  console.log("🌱 Limpiando datos anteriores...");
  await db.session.deleteMany();
  await db.user.deleteMany();
  await db.contactLog.deleteMany();
  await db.purchase.deleteMany();
  await db.template.deleteMany();
  await db.customer.deleteMany();
  await db.business.deleteMany();

  console.log("🏪 Creando negocio demo...");
  const biz = await db.business.create({
    data: {
      name: "Perfumería Bella",
      rubro: "Perfumería y cosmética",
      inactivityDays: 60,
      recompraDays: 45,
      vipMinSpend: 150000,
    },
  });

  // [nombre, teléfono, email, cumple(Date), diasDesdeUltimaCompra|null, compras:[dias,monto][], notas, tags]
  type Seed = {
    name: string;
    phone: string;
    email: string;
    birthdate: Date;
    purchases: [number, number][]; // [díasAtrás, monto]
    notes?: string;
    tags?: string;
  };

  const seeds: Seed[] = [
    {
      name: "María González",
      phone: "5493815551201",
      email: "maria.gonzalez@gmail.com",
      birthdate: birthdayInDays(0, 1988), // cumple HOY
      purchases: [[5, 18000], [40, 32000], [95, 25000], [160, 40000]],
      notes: "Prefiere fragancias florales.",
      tags: "fidelizada",
    },
    {
      name: "Lucía Fernández",
      phone: "5493815551202",
      email: "lucia.fdez@gmail.com",
      birthdate: birthdayInDays(3, 1995), // cumple en 3 días
      purchases: [[12, 22000], [70, 28000]],
    },
    {
      name: "Sofía Ramírez",
      phone: "5493815551203",
      email: "sofia.ramirez@hotmail.com",
      birthdate: birthdayInDays(6, 1990),
      purchases: [[8, 15000]],
      tags: "nueva",
    },
    {
      name: "Valentina López",
      phone: "5493815551204",
      email: "valen.lopez@gmail.com",
      birthdate: birthdayFixed(now.getMonth() + 1, 22, 1985), // cumple este mes
      purchases: [[2, 55000], [30, 48000], [65, 60000], [110, 52000], [180, 45000]],
      notes: "Cliente VIP, compra líneas premium.",
      tags: "vip,premium",
    },
    {
      name: "Camila Díaz",
      phone: "5493815551205",
      email: "camila.diaz@gmail.com",
      birthdate: birthdayFixed(3, 14, 1992),
      purchases: [[50, 30000], [58, 26000], [66, 22000]],
    },
    {
      name: "Martina Sosa",
      phone: "5493815551206",
      email: "martina.sosa@gmail.com",
      birthdate: birthdayFixed(9, 2, 1998),
      purchases: [[75, 19000]], // recompra vencida (>45d, <60d)
      notes: "Consultó por set de regalo.",
    },
    {
      name: "Julieta Romero",
      phone: "5493815551207",
      email: "juli.romero@gmail.com",
      birthdate: birthdayFixed(11, 30, 1983),
      purchases: [[120, 21000], [200, 33000]], // inactiva
      tags: "reactivar",
    },
    {
      name: "Florencia Torres",
      phone: "5493815551208",
      email: "flor.torres@gmail.com",
      birthdate: birthdayFixed(1, 18, 1996),
      purchases: [], // registrada sin compras aún
      tags: "nueva",
    },
    {
      name: "Agustina Ruiz",
      phone: "5493815551209",
      email: "agus.ruiz@gmail.com",
      birthdate: birthdayInDays(15, 1991),
      purchases: [[18, 42000], [55, 38000], [100, 41000], [150, 39000]],
      notes: "Compra para toda la familia.",
      tags: "premium",
    },
    {
      name: "Paula Herrera",
      phone: "5493815551210",
      email: "paula.herrera@gmail.com",
      birthdate: birthdayFixed(6, 9, 1987),
      purchases: [[220, 17000]], // muy inactiva
    },
    {
      name: "Antonella Castro",
      phone: "5493815551211",
      email: "anto.castro@gmail.com",
      birthdate: birthdayFixed(now.getMonth() + 1, 5, 1994),
      purchases: [[10, 27000], [48, 24000]],
    },
    {
      name: "Rocío Morales",
      phone: "5493815551212",
      email: "rocio.morales@gmail.com",
      birthdate: birthdayFixed(4, 27, 1989),
      purchases: [[3, 62000], [35, 58000], [80, 71000]],
      notes: "Siempre elige lo nuevo de temporada.",
      tags: "vip",
    },
    {
      name: "Brenda Vega",
      phone: "5493815551213",
      email: "brenda.vega@gmail.com",
      birthdate: birthdayFixed(8, 11, 1993),
      purchases: [[52, 20000]], // recompra vencida
    },
    {
      name: "Carla Núñez",
      phone: "5493815551214",
      email: "carla.nunez@gmail.com",
      birthdate: birthdayInDays(1, 1997), // cumple mañana
      purchases: [[25, 16000], [90, 23000]],
    },
    {
      name: "Daniela Ortiz",
      phone: "5493815551215",
      email: "dani.ortiz@gmail.com",
      birthdate: birthdayFixed(2, 3, 1986),
      purchases: [[6, 35000], [42, 31000], [78, 29000], [130, 34000], [190, 30000]],
      tags: "fidelizada",
    },
    {
      name: "Micaela Flores",
      phone: "5493815551216",
      email: "mica.flores@gmail.com",
      birthdate: birthdayFixed(10, 21, 1999),
      purchases: [[14, 14000]],
      tags: "nueva",
    },
    {
      name: "Gabriela Silva",
      phone: "5493815551217",
      email: "gaby.silva@gmail.com",
      birthdate: birthdayFixed(5, 16, 1984),
      purchases: [[160, 26000], [240, 28000]], // inactiva
    },
    {
      name: "Ana Medina",
      phone: "5493815551218",
      email: "ana.medina@gmail.com",
      birthdate: birthdayInDays(9, 1990),
      purchases: [[20, 48000], [62, 52000]],
      tags: "premium",
    },
    {
      name: "Josefina Ríos",
      phone: "5493815551219",
      email: "jose.rios@gmail.com",
      birthdate: birthdayFixed(7, 7, 1995),
      purchases: [[46, 22000]], // recompra vencida
    },
    {
      name: "Emilia Aguirre",
      phone: "5493815551220",
      email: "emi.aguirre@gmail.com",
      birthdate: birthdayFixed(12, 24, 1988),
      purchases: [[4, 33000], [38, 37000], [88, 35000]],
      notes: "Recomienda el local a sus amigas.",
      tags: "fidelizada",
    },
  ];

  console.log(`👥 Creando ${seeds.length} clientes con historial...`);
  for (const s of seeds) {
    const sorted = [...s.purchases].sort((a, b) => a[0] - b[0]); // más reciente primero
    const lastPurchaseAt = sorted.length ? daysAgo(sorted[0][0]) : null;
    await db.customer.create({
      data: {
        businessId: biz.id,
        name: s.name,
        phone: s.phone,
        email: s.email,
        birthdate: s.birthdate,
        notes: s.notes ?? null,
        tags: s.tags ?? "",
        lastPurchaseAt,
        createdAt: sorted.length ? daysAgo(sorted[sorted.length - 1][0] + 5) : daysAgo(10),
        purchases: {
          create: s.purchases.map(([d, amount]) => ({
            businessId: biz.id,
            date: daysAgo(d),
            amount,
            description: null,
          })),
        },
      },
    });
  }

  console.log("✉️  Creando plantillas por defecto...");
  await db.template.createMany({
    data: [
      {
        businessId: biz.id,
        type: "birthday",
        channel: "whatsapp",
        subject: "",
        body: "¡Hola {nombre}! 🎂 De parte de todo el equipo de {negocio} te deseamos un muy feliz cumpleaños. Como regalo, tenés un 15% de descuento en tu próxima compra esta semana. ¡Te esperamos! 💚",
      },
      {
        businessId: biz.id,
        type: "birthday",
        channel: "email",
        subject: "🎂 ¡Feliz cumpleaños, {nombre}!",
        body: "¡Hola {nombre}!\n\nEn {negocio} queremos desearte un muy feliz cumpleaños. Para celebrarlo, te regalamos un 15% de descuento en tu próxima compra durante esta semana.\n\n¡Te esperamos!\nEquipo de {negocio}",
      },
      {
        businessId: biz.id,
        type: "winback",
        channel: "whatsapp",
        subject: "",
        body: "¡Hola {nombre}! 👋 Hace un tiempo que no te vemos por {negocio} y te extrañamos. Preparamos novedades que te van a encantar. Si venís esta semana, tenés un beneficio especial esperándote. 😊",
      },
      {
        businessId: biz.id,
        type: "winback",
        channel: "email",
        subject: "Te extrañamos en {negocio} 💚",
        body: "¡Hola {nombre}!\n\nHace un tiempo que no pasás por {negocio}. Tenemos novedades y un beneficio especial reservado para vos si volvés esta semana.\n\n¡Nos encantaría verte de nuevo!\nEquipo de {negocio}",
      },
    ],
  });

  console.log("🔐 Creando usuario demo...");
  await db.user.create({
    data: {
      businessId: biz.id,
      email: "demo@perfumeriabella.com",
      name: "Dueña de Perfumería Bella",
      passwordHash: await bcrypt.hash("demo1234", 10),
    },
  });

  console.log("✅ Seed completado.");
  console.log("   Login demo: demo@perfumeriabella.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
