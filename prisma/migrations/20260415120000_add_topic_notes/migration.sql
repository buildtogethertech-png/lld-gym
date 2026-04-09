-- Topic learn notes (was in schema but missing from initial migration).

CREATE TABLE "public"."topic_notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_notes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "topic_notes_userId_topicId_key" ON "public"."topic_notes"("userId", "topicId");

ALTER TABLE "public"."topic_notes" ADD CONSTRAINT "topic_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
