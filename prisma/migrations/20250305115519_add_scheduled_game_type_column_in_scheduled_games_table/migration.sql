-- CreateEnum
CREATE TYPE "ScheduledGameType" AS ENUM ('INSTANT', 'FUTURE');

-- AlterTable
ALTER TABLE "scheduled_games" ADD COLUMN     "type" "ScheduledGameType" NOT NULL DEFAULT 'FUTURE';
