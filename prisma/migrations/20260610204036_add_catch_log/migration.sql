-- CreateTable
CREATE TABLE "catch_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fishType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "location" TEXT NOT NULL,
    "caughtAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catch_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "catch_logs" ADD CONSTRAINT "catch_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
