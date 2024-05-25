/*
  Warnings:

  - Added the required column `owner_id` to the `games` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "games" ADD COLUMN     "owner_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
