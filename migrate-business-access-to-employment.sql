-- Migración: BusinessAccess existentes → Employment.
--
-- Para cada fila de BusinessAccess: crea/reutiliza una Empresa por business y
-- un Employment activo del User correspondiente con los mismos flags. Si el
-- email no tiene User, se omite (no podemos vincular). Idempotente.
--
-- Se ejecuta una sola vez antes de borrar BusinessAccess del esquema.

DO $$
DECLARE
  rec record;
  v_user_id text;
  v_empresa_id text;
  v_business_name text;
  v_existing_employment_id text;
BEGIN
  FOR rec IN SELECT * FROM "BusinessAccess" LOOP
    -- Buscar User por email
    SELECT id INTO v_user_id FROM "User" WHERE LOWER(email) = LOWER(rec.email) LIMIT 1;
    IF v_user_id IS NULL THEN
      RAISE NOTICE 'omitido (sin User): %', rec.email;
      CONTINUE;
    END IF;

    -- Buscar Empresa del business; crearla si no hay.
    SELECT id INTO v_empresa_id
    FROM "Empresa" WHERE "businessId" = rec."businessId" AND "isActive" = true
    ORDER BY "createdAt" ASC LIMIT 1;

    IF v_empresa_id IS NULL THEN
      SELECT name INTO v_business_name FROM "Business" WHERE id = rec."businessId";
      v_empresa_id := gen_random_uuid()::text;
      INSERT INTO "Empresa" (id, "razonSocial", "businessId", "isActive", "createdAt", "updatedAt")
      VALUES (v_empresa_id, COALESCE(v_business_name, 'Empresa principal'), rec."businessId", true, now(), now());
      RAISE NOTICE 'Empresa creada para business=% (id=%)', rec."businessId", v_empresa_id;
    END IF;

    -- ¿Ya hay un Employment activo para este User en alguna Empresa del business?
    SELECT e.id INTO v_existing_employment_id
    FROM "Employment" e
    JOIN "Empresa" emp ON emp.id = e."empresaId"
    WHERE e."userId" = v_user_id
      AND e."isActive" = true
      AND emp."businessId" = rec."businessId"
    LIMIT 1;

    IF v_existing_employment_id IS NOT NULL THEN
      -- Actualizar flags
      UPDATE "Employment" SET
        "canViewDashboard" = rec."canViewDashboard",
        "canViewEvents" = rec."canViewEvents",
        "canViewTasks" = rec."canViewTasks",
        "canViewCommunications" = rec."canViewCommunications",
        "canViewCatalog" = rec."canViewCatalog",
        "canViewOperations" = rec."canViewOperations",
        "canViewObrador" = rec."canViewObrador",
        "canViewEmployees" = rec."canViewEmployees",
        "canManageDirectory" = rec."canManageDirectory",
        "canEditSettings" = rec."canEditSettings",
        "updatedAt" = now()
      WHERE id = v_existing_employment_id;
      RAISE NOTICE 'actualizado employment %, user %', v_existing_employment_id, rec.email;
    ELSE
      INSERT INTO "Employment" (
        id, "userId", "empresaId", "isActive",
        "canViewDashboard", "canViewEvents", "canViewTasks", "canViewCommunications",
        "canViewCatalog", "canViewOperations", "canViewObrador",
        "canViewEmployees", "canManageDirectory", "canEditSettings",
        "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid()::text, v_user_id, v_empresa_id, true,
        rec."canViewDashboard", rec."canViewEvents", rec."canViewTasks", rec."canViewCommunications",
        rec."canViewCatalog", rec."canViewOperations", rec."canViewObrador",
        rec."canViewEmployees", rec."canManageDirectory", rec."canEditSettings",
        now(), now()
      );
      RAISE NOTICE 'employment creado para user % en empresa %', rec.email, v_empresa_id;
    END IF;

    v_existing_employment_id := NULL;
    v_empresa_id := NULL;
  END LOOP;
END $$;

SELECT 'employments_activos' AS k, count(*) v FROM "Employment" WHERE "isActive" = true
UNION ALL SELECT 'empresas', count(*) FROM "Empresa"
UNION ALL SELECT 'business_access_restantes', count(*) FROM "BusinessAccess";
