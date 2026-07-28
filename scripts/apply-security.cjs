// Aplica prisma/security.sql contra la base usando DIRECT_URL (conexión de
// sesión, no el pooler de transacciones) porque no hay `psql` disponible en
// esta máquina. Ejecuta cada sentencia top-level por separado (el bloque
// DO $$ ... $$ cuenta como una sola sentencia).
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const db = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

const statements = [
  `alter default privileges for role postgres in schema public
     revoke all on tables from anon, authenticated`,
  `alter default privileges for role postgres in schema public
     revoke all on sequences from anon, authenticated`,
  `alter default privileges for role postgres in schema public
     revoke all on functions from anon, authenticated`,
  `revoke all on all tables    in schema public from anon, authenticated`,
  `revoke all on all sequences in schema public from anon, authenticated`,
  `revoke all on all functions in schema public from anon, authenticated`,
  `do $$
   declare t record;
   begin
     for t in select schemaname, tablename from pg_tables where schemaname = 'public'
     loop
       execute format('alter table %I.%I enable row level security', t.schemaname, t.tablename);
     end loop;
   end $$`,
];

async function run() {
  for (const [i, sql] of statements.entries()) {
    await db.$executeRawUnsafe(sql);
    console.log(`✓ [${i + 1}/${statements.length}] ejecutado`);
  }
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
