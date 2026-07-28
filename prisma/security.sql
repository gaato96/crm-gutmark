-- Cierra el acceso externo a la base vía la API REST pública de Supabase
-- (PostgREST expone /rest/v1/<Tabla> a los roles anon/authenticated por
-- defecto). La app NO usa supabase-js, solo Prisma con la connection string,
-- así que este acceso no tiene ningún uso legítimo hoy.
--
-- Re-ejecutar DESPUÉS DE CADA `prisma db push` que cree tablas nuevas
-- (ver script "db:secure" en package.json, ya encadenado a "db:push").
-- Idempotente: correrlo de nuevo no rompe nada.

-- 1) Cortar los grants por defecto para tablas/objetos FUTUROS creados por
--    el rol "postgres" (el que usa Prisma vía la connection string).
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on functions from anon, authenticated;

-- 2) Revocar lo que Supabase ya había otorgado sobre lo existente.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- 3) Habilitar RLS en todas las tablas de public. Sin políticas definidas,
--    esto es deny-all para cualquier rol que no sea dueño de la tabla.
--    IMPORTANTE: no usar FORCE ROW LEVEL SECURITY — el rol "postgres" es
--    dueño de las tablas y por eso bypassa RLS; con FORCE dejaría de
--    bypassarlo y la app (Prisma) se quedaría sin poder leer/escribir nada.
do $$
declare t record;
begin
  for t in select schemaname, tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table %I.%I enable row level security', t.schemaname, t.tablename);
  end loop;
end $$;
