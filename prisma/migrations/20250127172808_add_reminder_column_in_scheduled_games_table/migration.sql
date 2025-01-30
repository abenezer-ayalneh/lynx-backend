/*
  Warnings:

  - You are about to drop the column `room_id` on the `games` table. All the data in the column will be lost.
  - You are about to drop the `rooms` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ScheduledGameStatus" AS ENUM ('PENDING', 'ACTIVE', 'DONE');

-- CreateEnum
CREATE TYPE "ScheduledGameReminder" AS ENUM ('PENDING', 'SENT');

-- DropForeignKey
ALTER TABLE "games" DROP CONSTRAINT "games_room_id_fkey";

-- DropForeignKey
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_created_by_fkey";

-- AlterTable
ALTER TABLE "games" DROP COLUMN "room_id";

-- DropTable
DROP TABLE "rooms";

-- CreateTable
CREATE TABLE "scheduled_games" (
    "id" SERIAL NOT NULL,
    "invitation_text" TEXT NOT NULL,
    "emails" TEXT[],
    "start_time" TIMESTAMP(3) NOT NULL,
    "max_players" INTEGER NOT NULL DEFAULT 8,
    "rounds" INTEGER NOT NULL DEFAULT 5,
    "room_id" INTEGER,
    "status" "ScheduledGameStatus" NOT NULL DEFAULT 'PENDING',
    "created_by" INTEGER NOT NULL,
    "reminder" "ScheduledGameReminder" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "scheduled_games_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scheduled_games" ADD CONSTRAINT "scheduled_games_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
