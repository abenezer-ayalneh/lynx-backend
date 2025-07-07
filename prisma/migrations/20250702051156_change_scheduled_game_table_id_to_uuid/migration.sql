/*
  Warnings:

  - The primary key for the `scheduled_games` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "games" DROP CONSTRAINT "games_scheduled_game_id_fkey";

-- AlterTable
ALTER TABLE "games" ALTER COLUMN "scheduled_game_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "scheduled_games" DROP CONSTRAINT "scheduled_games_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "scheduled_games_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "scheduled_games_id_seq";

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_scheduled_game_id_fkey" FOREIGN KEY ("scheduled_game_id") REFERENCES "scheduled_games"("id") ON DELETE SET NULL ON UPDATE CASCADE;
