-- AlterTable
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Backfill username unik dari data user lama (bagian lokal email, dinormalisasi).
-- Prioritas 1: local-part email (uppercase, karakter A-Z0-9 saja).
-- Jika bentrok, tambahkan sufiks angka (mis. JOKOSLAMET, JOKOSLAMET_2).
WITH ranked AS (
  SELECT id,
         regexp_replace(translate(upper(split_part(email, '@', 1)), '.,_-()', '       '), '\s+', '', 'g') AS base,
         row_number() OVER (PARTITION BY lower(split_part(email, '@', 1)) ORDER BY "createdAt", id) AS rn
  FROM users
  WHERE email IS NOT NULL AND email <> ''
)
UPDATE users u
SET username = CASE
  WHEN r.base <> '' AND r.rn = 1 THEN r.base
  WHEN r.base <> '' THEN r.base || '_' || r.rn
  ELSE u.username
END
FROM ranked r
WHERE u.id = r.id;

-- Amankan user yang tidak punya email valid / hasil kosong.
UPDATE users SET username = 'USER' || upper(substr(md5(id), 1, 6)) WHERE username IS NULL OR username = '';

-- CreateUniqueIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateTable
CREATE TABLE "family_view_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "frequencyPerHour" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "family_view_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_logs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "areaName" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sendSuccess" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "location_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missing_report_audits" (
    "id" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reporterName" TEXT NOT NULL,
    "reporterPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "missing_report_audits_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "family_view_sessions_code_key" ON "family_view_sessions"("code");

-- CreateIndex
CREATE INDEX "family_view_sessions_userId_idx" ON "family_view_sessions"("userId");

-- CreateIndex
CREATE INDEX "location_logs_sessionId_sentAt_idx" ON "location_logs"("sessionId", "sentAt");

-- CreateIndex
CREATE INDEX "missing_report_audits_reportedUserId_createdAt_idx" ON "missing_report_audits"("reportedUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "family_view_sessions" ADD CONSTRAINT "family_view_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_logs" ADD CONSTRAINT "location_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_logs" ADD CONSTRAINT "location_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "family_view_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;