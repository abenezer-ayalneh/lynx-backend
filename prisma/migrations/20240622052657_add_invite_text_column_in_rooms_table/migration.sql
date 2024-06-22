/*
  Warnings:

  - Added the required column `invite_text` to the `rooms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "invite_text" TEXT NOT NULL;
