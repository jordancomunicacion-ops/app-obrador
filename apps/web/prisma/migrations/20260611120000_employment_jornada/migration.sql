-- Jornada en el contrato (Employment): horas semanales, jornada parcial y horario semanal
ALTER TABLE "Employment"
  ADD COLUMN "weeklyHours" DECIMAL(5,2),
  ADD COLUMN "partTime" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "schedule" JSONB;
