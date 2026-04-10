-- RazorpayOrder: created when order is generated, lets webhook identify user+plan
CREATE TABLE "public"."razorpay_orders" (
    "id"          TEXT NOT NULL,
    "razorpayId"  TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "planSlug"    TEXT NOT NULL,
    "amountInr"   INTEGER NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "razorpay_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "razorpay_orders_razorpayId_key" ON "public"."razorpay_orders"("razorpayId");

-- WebhookLog: every raw webhook hit, regardless of signature validity
CREATE TABLE "public"."webhook_logs" (
    "id"        TEXT NOT NULL,
    "source"    TEXT NOT NULL DEFAULT 'razorpay',
    "event"     TEXT,
    "payload"   TEXT NOT NULL,
    "sigValid"  BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);
