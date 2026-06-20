/*
  Warnings:

  - You are about to drop the `SharedSpot` table. If the table is not empty, all the data it contains will be lost.
  - The required column `id` was added to the `verification_tokens` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "catch_logs" ADD COLUMN     "tripId" TEXT;

-- AlterTable
ALTER TABLE "verification_tokens" ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "SharedSpot";

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_spots" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_spots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wa_notification_logs" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wa_notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FamilyContact_userId_idx" ON "FamilyContact"("userId");

-- CreateIndex
CREATE INDEX "wa_notification_logs_tripId_sentAt_idx" ON "wa_notification_logs"("tripId", "sentAt");

-- AddForeignKey
ALTER TABLE "catch_logs" ADD CONSTRAINT "catch_logs_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_spots" ADD CONSTRAINT "shared_spots_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_spots" ADD CONSTRAINT "shared_spots_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyContact" ADD CONSTRAINT "FamilyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wa_notification_logs" ADD CONSTRAINT "wa_notification_logs_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
