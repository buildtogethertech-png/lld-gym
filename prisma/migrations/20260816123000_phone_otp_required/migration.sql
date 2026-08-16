-- Phone is mandatory at the app layer (OTP-verified) but not unique.
-- Drop the optional-prompt columns and unique constraint from the first phone migration.

DROP INDEX IF EXISTS "users_phone_key";

ALTER TABLE "users" DROP COLUMN IF EXISTS "whatsappOptIn";
ALTER TABLE "users" DROP COLUMN IF EXISTS "phonePromptDismissedAt";
