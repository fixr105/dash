CREATE SCHEMA IF NOT EXISTS "lending";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'ToolJobType' AND n.nspname = 'lending'
  ) THEN
    CREATE TYPE "lending"."ToolJobType" AS ENUM ('RAAD', 'PAGER', 'QUERY_DRAFTER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'ToolJobStatus' AND n.nspname = 'lending'
  ) THEN
    CREATE TYPE "lending"."ToolJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "lending"."tool_jobs" (
  "id" TEXT NOT NULL,
  "nbfcId" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "tool" "lending"."ToolJobType" NOT NULL,
  "status" "lending"."ToolJobStatus" NOT NULL DEFAULT 'QUEUED',
  "loanApplicationId" TEXT,
  "input" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "output" JSONB,
  "error" TEXT,
  "n8nExecutionId" TEXT,
  "reportUrl" TEXT,
  "draftedQuery" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "tool_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "tool_jobs_nbfcId_createdAt_idx" ON "lending"."tool_jobs"("nbfcId", "createdAt");
CREATE INDEX IF NOT EXISTS "tool_jobs_status_idx" ON "lending"."tool_jobs"("status");
