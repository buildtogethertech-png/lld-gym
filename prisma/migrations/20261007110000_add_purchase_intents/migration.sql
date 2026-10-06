CREATE TABLE "purchase_intents" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "planSlug" TEXT NOT NULL,
  "amountInr" INTEGER NOT NULL,
  "offerName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "purchase_intents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "purchase_intents_createdAt_idx" ON "purchase_intents"("createdAt");
CREATE INDEX "purchase_intents_userId_idx" ON "purchase_intents"("userId");
