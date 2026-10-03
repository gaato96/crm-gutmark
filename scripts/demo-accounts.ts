// Crea las cuentas demo que falten (una por rubro) y regenera sus datos.
//
//   npm run demo:setup              → todas
//   npm run demo:setup -- barberia  → solo las de esos rubros
//
// Solo toca negocios marcados con isDemo (ver lib/demo-data.ts). Es lo mismo
// que el botón "Restaurar todas" de /admin, para correrlo desde la terminal.
import { db } from "../lib/db";
import { demoPresets, demoEmail } from "../lib/rubro-presets";
import { ensureDemoBusiness, resetDemoBusiness, DEMO_PASSWORD } from "../lib/demo-data";

async function main() {
  const only = process.argv.slice(2);
  const presets = demoPresets().filter((p) => only.length === 0 || only.includes(p.rubro));
  if (presets.length === 0) {
    console.error("Ningún rubro coincide. Disponibles:", demoPresets().map((p) => p.rubro).join(", "));
    process.exit(1);
  }

  for (const preset of presets) {
    const t = Date.now();
    const id = await ensureDemoBusiness(preset);
    const res = await resetDemoBusiness(id);
    console.log(
      `✔ ${preset.demo.businessName.padEnd(28)} ${demoEmail(preset.demo).padEnd(32)} ` +
        `${res.customers} clientes · ${res.purchases} ventas · ${((Date.now() - t) / 1000).toFixed(1)}s`
    );
  }
  console.log(`\nContraseña de todas las cuentas demo: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
