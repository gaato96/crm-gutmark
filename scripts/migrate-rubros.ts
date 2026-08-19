// Pasa el `rubro` de texto libre a los códigos de lib/rubros.ts y define el
// `catalogMode` de cada negocio.
//
//   npm run db:migrate-rubros
//
// Antes el rubro era un campo de texto que cada uno escribía como quería
// ("Peluquería", "peluqueria y estetica", "General"). Ahora es un código de una
// lista, y de él sale el vocabulario de toda la interfaz.
//
// Lo que no se puede reconocer queda en "otro" con modo "ambos", que es el que
// no esconde nada: es preferible mostrarle "Productos y servicios" a un
// consultorio que esconderle los productos a un kiosco.
//
// Idempotente: los negocios que ya tienen un código válido no se tocan.

import { PrismaClient } from "@prisma/client";
import { RUBROS, isRubroCode, modeForRubro } from "../lib/rubros";

const db = new PrismaClient();

// Palabras sueltas → código de rubro. Se busca dentro del texto viejo, sin
// acentos ni mayúsculas.
const PISTAS: [RegExp, string][] = [
  [/barber|peluquer|corte de pelo/, "barberia"],
  [/estetic|spa|u[ñn]as|manicur|depilac/, "estetica"],
  [/veterinar/, "veterinaria"],
  [/taller|mecanic|service|gomeri/, "taller"],
  [/perfum|cosmetic|maquillaj/, "perfumeria"],
  [/indumentar|ropa|calzado|zapat|boutique/, "indumentaria"],
  [/kiosco|almacen|dietetic|autoservicio|mercado/, "kiosco"],
  [/pet\s?shop|forrajer|mascota/, "petshop"],
  [/gastronom|panader|restaurant|cafeter|pizzer|heladeri/, "gastronomia"],
  [/librer|regaler|papeler|jugueter/, "libreria"],
  [/gimnasio|gym|estudio|academia|pilates|yoga|danza/, "gimnasio"],
  [/salud|consultor|odontolog|kinesiolog|nutricion|psicolog|medic/, "salud"],
  [/profesional|contab|abogac|estudio juridico|arquitect|marketing|agencia/, "profesional"],
  [/reparac|oficio|plomer|electricist|cerrajer|herrer/, "reparaciones"],
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function adivinar(rubroViejo: string): string {
  const t = normalizar(rubroViejo);
  for (const [re, code] of PISTAS) {
    if (re.test(t)) return code;
  }
  return "otro";
}

async function main() {
  const negocios = await db.business.findMany({
    select: { id: true, name: true, rubro: true, catalogMode: true },
  });

  let migrados = 0;
  let saltados = 0;

  for (const b of negocios) {
    if (isRubroCode(b.rubro)) {
      saltados++;
      continue;
    }

    const code = adivinar(b.rubro);
    const mode = modeForRubro(code);
    await db.business.update({
      where: { id: b.id },
      data: { rubro: code, catalogMode: mode },
    });
    const label = RUBROS.find((r) => r.code === code)!.label;
    console.log(`  ${b.name}: "${b.rubro}" → ${label} (${mode})`);
    migrados++;
  }

  console.log(`\n✓ ${negocios.length} negocio(s) — ${migrados} migrado(s), ${saltados} ya estaban.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
