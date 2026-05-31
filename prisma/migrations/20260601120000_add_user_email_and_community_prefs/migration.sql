-- AlterTable
ALTER TABLE "users" ADD COLUMN "emailUnsubscribed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "hideSolutionFromCommunity" BOOLEAN NOT NULL DEFAULT false;
