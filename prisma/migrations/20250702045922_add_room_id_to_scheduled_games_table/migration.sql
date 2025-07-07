/*
  Warnings:

  - You are about to drop the column `accepted_emails` on the `scheduled_games` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[room_id]` on the table `scheduled_games` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `room_id` to the `scheduled_games` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "scheduled_games" DROP COLUMN "accepted_emails",
ADD COLUMN     "room_id" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ScheduledGameReminder";

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_games_room_id_key" ON "scheduled_games"("room_id");
