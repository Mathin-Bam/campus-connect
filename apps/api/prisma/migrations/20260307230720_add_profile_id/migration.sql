/*
  Warnings:

  - You are adding a unique constraint covering the columns `[profileId]` on the table `users`. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profileId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_profileId_key" ON "users"("profileId");

-- Populate existing users with profileId
UPDATE "users" SET "profileId" = SUBSTRING(REPLACE(CAST(id AS TEXT), '-', ''), 9, 8) WHERE "profileId" IS NULL;
