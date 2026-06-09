/*
  Warnings:

  - You are about to drop the column `created_at` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `scheduled_game_id` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `scheduled_games` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `scheduled_games` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `scheduled_games` table. All the data in the column will be lost.
  - You are about to drop the column `invitation_text` on the `scheduled_games` table. All the data in the column will be lost.
  - You are about to drop the column `invited_emails` on the `scheduled_games` table. All the data in the column will be lost.
  - You are about to drop the column `max_players` on the `scheduled_games` table. All the data in the column will be lost.
  - You are about to drop the column `room_id` on the `scheduled_games` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `scheduled_games` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `scheduled_games` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `words` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `words` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `words` table. All the data in the column will be lost.
  - You are about to drop the `players` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[roomId]` on the table `scheduled_games` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerId` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `scheduled_games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invitationText` to the `scheduled_games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomId` to the `scheduled_games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `scheduled_games` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "games" DROP CONSTRAINT "games_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "games" DROP CONSTRAINT "games_scheduled_game_id_fkey";

-- DropForeignKey
ALTER TABLE "scheduled_games" DROP CONSTRAINT "scheduled_games_created_by_fkey";

-- DropIndex
DROP INDEX "scheduled_games_room_id_key";

-- AlterTable
ALTER TABLE "games" DROP COLUMN "created_at",
DROP COLUMN "deleted_at",
DROP COLUMN "owner_id",
DROP COLUMN "scheduled_game_id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "scheduledGameId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "scheduled_games" DROP COLUMN "created_at",
DROP COLUMN "created_by",
DROP COLUMN "deleted_at",
DROP COLUMN "invitation_text",
DROP COLUMN "invited_emails",
DROP COLUMN "max_players",
DROP COLUMN "room_id",
DROP COLUMN "start_time",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "invitationText" TEXT NOT NULL,
ADD COLUMN     "invitedEmails" TEXT[],
ADD COLUMN     "maxUsers" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "roomId" TEXT NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "words" DROP COLUMN "created_at",
DROP COLUMN "deleted_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "players";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT,
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_games_roomId_key" ON "scheduled_games"("roomId");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_scheduledGameId_fkey" FOREIGN KEY ("scheduledGameId") REFERENCES "scheduled_games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_games" ADD CONSTRAINT "scheduled_games_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
