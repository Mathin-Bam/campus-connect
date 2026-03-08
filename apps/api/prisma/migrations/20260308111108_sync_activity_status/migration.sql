/*
  Warnings:

  - You are about to drop the column `activity_type` on the `activity_statuses` table. All the data in the column will be lost.

*/

-- DropIndex
DROP INDEX "activity_statuses_activity_type_expires_at_idx";

-- AlterTable
ALTER TABLE "activity_statuses" 
ADD COLUMN     "activity_id" TEXT NOT NULL DEFAULT 'other',
ADD COLUMN     "emoji" TEXT,
ADD COLUMN     "label" TEXT NOT NULL DEFAULT 'Other Activity';

-- Update existing records to copy activity_type to activity_id and set appropriate labels
UPDATE "activity_statuses" 
SET "activity_id" = "activity_type",
    "label" = CASE 
      WHEN "activity_type" = 'study' THEN 'Study'
      WHEN "activity_type" = 'gym' THEN 'Gym'
      WHEN "activity_type" = 'food' THEN 'Food'
      WHEN "activity_type" = 'sports' THEN 'Sports'
      WHEN "activity_type" = 'gaming' THEN 'Gaming'
      WHEN "activity_type" = 'social' THEN 'Social'
      ELSE 'Other Activity'
    END;

-- Now drop the old column
ALTER TABLE "activity_statuses" DROP COLUMN "activity_type";

-- CreateIndex
CREATE INDEX "activity_statuses_activity_id_expires_at_idx" ON "activity_statuses"("activity_id", "expires_at");
