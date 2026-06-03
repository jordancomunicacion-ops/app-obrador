-- ============================================================================
-- Migración SUPERADMIN (versión SQL pura) — alternativa al script TS.
--
-- Separa plataforma (gerencia -> SUPERADMIN) del tenant de negocio, reasignando
-- todos los datos (ownerId en 28 modelos + adminId de empleados) al nuevo tenant.
--
-- Ejecutar contra el contenedor de BD (PostgreSQL 15) en el VPS:
--
--   docker exec -i sotoobrador-db psql -U cocina_user -d obrador < migrate-superadmin.sql
--
-- (ajusta -U y -d a tus DB_USER/DB_NAME si difieren).
--
-- Idempotente: re-ejecutarlo reasigna 0 filas y solo confirma el rol SUPERADMIN.
-- Tolera tablas ausentes (drift de esquema) gracias a to_regclass.
-- Atómico: todo va en una transacción implícita (un único DO).
-- ============================================================================

-- Necesario para crypt()/gen_salt() (hash bcrypt) y gen_random_uuid().
-- cocina_user es superuser en prod, así que puede crear la extensión.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  -- >>> EDITA AQUÍ si quieres otros valores <<<
  platform_email text := 'gerencia@sotodelprior.com';
  tenant_email   text := 'obrador@sotodelprior.com';
  tenant_name    text := 'Soto del Prior (Obrador)';
  tenant_pass    text := 'Obrador2026!';   -- cámbiala tras el primer acceso
  default_perms  text[] := ARRAY[
    'dashboard','events','tasks','menu-planning','products','recipes',
    'purchasing','storage','mise-en-place','employees','settings'
  ];
  -- 28 tablas con columna "ownerId" (PascalCase = nombre de modelo Prisma).
  owner_tables text[] := ARRAY[
    'AppConfig','Ingredient','Customer','Supplier','Recipe','Event','Task',
    'ProductionRoutine','StorageLocation','MiseEnPlaceTask','MenuService',
    'ObradorConfig','ObradorRawMaterialEntry','ObradorProductionBatch',
    'ObradorTemperatureLog','ObradorIncident','ObradorSanitaryDocument',
    'Empresa','Location','ChecklistTemplate','ChecklistSchedule','Communication',
    'TaskDefinition','TaskSchedule','TaskInstance','PurchaseOrder','ProductLabel',
    'IntegrationApiKey'
  ];

  old_id   text;
  new_id   text;
  t        text;
  moved    bigint;
  total    bigint := 0;
BEGIN
  -- Plataforma (gerencia).
  SELECT id INTO old_id FROM "User" WHERE email = platform_email;
  IF old_id IS NULL THEN
    RAISE EXCEPTION 'No existe el usuario plataforma %', platform_email;
  END IF;
  RAISE NOTICE 'Plataforma: % (id=%)', platform_email, old_id;

  -- Tenant (find-or-create).
  SELECT id INTO new_id FROM "User" WHERE email = tenant_email;
  IF new_id IS NULL THEN
    new_id := gen_random_uuid()::text;
    INSERT INTO "User" (id, name, email, password, role, approved, permissions, "createdAt", "updatedAt")
    VALUES (
      new_id, tenant_name, tenant_email,
      crypt(tenant_pass, gen_salt('bf')),   -- hash bcrypt ($2a$) compatible con bcryptjs
      'ADMIN', true, default_perms, now(), now()
    );
    RAISE NOTICE 'Tenant CREADO: % <%> (id=%). Contraseña inicial: %', tenant_name, tenant_email, new_id, tenant_pass;
  ELSE
    RAISE NOTICE 'Tenant YA EXISTE: % (id=%) — se reutiliza.', tenant_email, new_id;
  END IF;

  IF new_id = old_id THEN
    RAISE NOTICE 'Plataforma y tenant son el mismo usuario. Nada que migrar.';
    RETURN;
  END IF;

  -- Reasignar ownerId OLD -> NEW en cada tabla existente.
  RAISE NOTICE '=== Reasignando ownerId ===';
  FOREACH t IN ARRAY owner_tables LOOP
    IF to_regclass('public.' || quote_ident(t)) IS NOT NULL THEN
      EXECUTE format('UPDATE %I SET "ownerId" = $1 WHERE "ownerId" = $2', t)
        USING new_id, old_id;
      GET DIAGNOSTICS moved = ROW_COUNT;
      IF moved > 0 THEN RAISE NOTICE '  %: %', t, moved; END IF;
      total := total + moved;
    ELSE
      RAISE NOTICE '  (tabla ausente, omitida: %)', t;
    END IF;
  END LOOP;
  RAISE NOTICE '  TOTAL filas con ownerId reasignadas: %', total;

  -- Reasignar empleados (adminId). No afecta a gerencia (su adminId es NULL).
  UPDATE "User" SET "adminId" = new_id WHERE "adminId" = old_id;
  GET DIAGNOSTICS moved = ROW_COUNT;
  RAISE NOTICE '=== Empleados reasignados (adminId): % ===', moved;

  -- Gerencia -> SUPERADMIN.
  UPDATE "User" SET role = 'SUPERADMIN', "adminId" = NULL WHERE id = old_id;
  RAISE NOTICE '=== gerencia -> SUPERADMIN ✔ ===';
  RAISE NOTICE 'MIGRACIÓN COMPLETADA.';
END $$;
