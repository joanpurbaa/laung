/*
  Warnings:

  - You are about to drop the column `otpCode` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `otpExpires` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "otpCode",
DROP COLUMN "otpExpires",
ALTER COLUMN "isVerified" SET DEFAULT true;
