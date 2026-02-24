-- CreateTable
CREATE TABLE "ChatMedia" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,

    CONSTRAINT "ChatMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatMedia_messageId_key" ON "ChatMedia"("messageId");

-- CreateIndex
CREATE INDEX "ChatMedia_conversationId_idx" ON "ChatMedia"("conversationId");

-- CreateIndex
CREATE INDEX "ChatMedia_expiresAt_idx" ON "ChatMedia"("expiresAt");

-- AddForeignKey
ALTER TABLE "ChatMedia" ADD CONSTRAINT "ChatMedia_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMedia" ADD CONSTRAINT "ChatMedia_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
