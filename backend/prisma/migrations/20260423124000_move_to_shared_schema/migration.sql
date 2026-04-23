CREATE SCHEMA IF NOT EXISTS "shared";

DO $$
BEGIN
  IF to_regclass('public."User"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "public"."User" SET SCHEMA "shared"';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."Nbfc"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "public"."Nbfc" SET SCHEMA "shared"';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."UserMembership"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "public"."UserMembership" SET SCHEMA "shared"';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."LoanApplication"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "public"."LoanApplication" SET SCHEMA "shared"';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."ApplicationStatusHistory"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "public"."ApplicationStatusHistory" SET SCHEMA "shared"';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."Event"') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "public"."Event" SET SCHEMA "shared"';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regtype('public."NbfcStatus"') IS NOT NULL THEN
    EXECUTE 'ALTER TYPE "public"."NbfcStatus" SET SCHEMA "shared"';
  END IF;
END $$;
