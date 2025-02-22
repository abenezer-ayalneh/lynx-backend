/*
  Warnings:

  - You are about to drop the column `room_id` on the `scheduled_games` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "games" ADD COLUMN     "scheduled_game_id" INTEGER;

-- AlterTable
ALTER TABLE "scheduled_games" DROP COLUMN "room_id";

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_scheduled_game_id_fkey" FOREIGN KEY ("scheduled_game_id") REFERENCES "scheduled_games"("id") ON DELETE SET NULL ON UPDATE CASCADE;
