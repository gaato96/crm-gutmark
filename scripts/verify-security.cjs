const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const db = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

async function run() {
  const tables = await db.$queryRawUnsafe(
    `select tablename, rowsecurity from pg_tables where schemaname='public' order by tablename`
  );
  console.log("--- RLS por tabla ---");
  console.table(tables);

  const grants = await db.$queryRawUnsafe(
    `select grantee, table_name, privilege_type from information_schema.role_table_grants
     where table_schema='public' and grantee in ('anon','authenticated')`
  );
  console.log("--- Grants restantes para anon/authenticated (debe ser 0 filas) ---");
  console.table(grants);

  const role = await db.$queryRawUnsafe(
    `select current_user, rolbypassrls from pg_roles where rolname = current_user`
  );
  console.log("--- Rol actual (debe tener rolbypassrls = true, por eso la app sigue andando) ---");
  console.table(role);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
