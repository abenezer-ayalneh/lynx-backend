/*
  Warnings:

  - You are about to drop the column `invite_text` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `rooms` table. All the data in the column will be lost.
  - Added the required column `invitation_text` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `rooms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "invite_text",
DROP COLUMN "name",
DROP COLUMN "status",
ADD COLUMN     "emails" TEXT[],
ADD COLUMN     "invitation_text" TEXT NOT NULL,
ADD COLUMN     "start_time" TIMESTAMP(3) NOT NULL;
