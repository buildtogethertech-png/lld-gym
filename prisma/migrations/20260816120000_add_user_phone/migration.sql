-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "phonePromptDismissedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
