/*
  Warnings:

  - You are about to drop the column `emails` on the `scheduled_games` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "scheduled_games" DROP COLUMN "emails",
ADD COLUMN     "accepted_emails" TEXT[],
ADD COLUMN     "invited_emails" TEXT[];
