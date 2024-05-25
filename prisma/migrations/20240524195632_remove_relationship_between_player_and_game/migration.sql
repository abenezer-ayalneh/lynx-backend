/*
  Warnings:

  - You are about to drop the `_GameToPlayer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_GameToPlayer" DROP CONSTRAINT "_GameToPlayer_A_fkey";

-- DropForeignKey
ALTER TABLE "_GameToPlayer" DROP CONSTRAINT "_GameToPlayer_B_fkey";

-- DropTable
DROP TABLE "_GameToPlayer";
