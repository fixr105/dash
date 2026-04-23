CREATE SCHEMA IF NOT EXISTS "shared";
ALTER TABLE "public"."User" SET SCHEMA "shared";
ALTER TABLE "public"."Nbfc" SET SCHEMA "shared";
ALTER TABLE "public"."UserMembership" SET SCHEMA "shared";
ALTER TABLE "public"."LoanApplication" SET SCHEMA "shared";
ALTER TABLE "public"."ApplicationStatusHistory" SET SCHEMA "shared";
ALTER TABLE "public"."Event" SET SCHEMA "shared";
ALTER TYPE "public"."NbfcStatus" SET SCHEMA "shared";
