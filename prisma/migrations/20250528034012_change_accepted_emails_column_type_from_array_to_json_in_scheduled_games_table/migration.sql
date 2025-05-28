/*
  Warnings:

  - Changed the type of `accepted_emails` on the `scheduled_games` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "scheduled_games" DROP COLUMN "accepted_emails",
ADD COLUMN     "accepted_emails" JSONB NOT NULL;
