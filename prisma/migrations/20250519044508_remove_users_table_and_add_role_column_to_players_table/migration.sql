/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PLAYER');

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'PLAYER';

-- DropTable
DROP TABLE "users";
