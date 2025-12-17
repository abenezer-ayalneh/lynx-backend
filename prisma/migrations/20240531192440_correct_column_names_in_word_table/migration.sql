/*
  Warnings:

  - You are about to drop the column `cue` on the `words` table. All the data in the column will be lost.
  - You are about to drop the column `word_1` on the `words` table. All the data in the column will be lost.
  - You are about to drop the column `word_2` on the `words` table. All the data in the column will be lost.
  - You are about to drop the column `word_3` on the `words` table. All the data in the column will be lost.
  - You are about to drop the column `word_4` on the `words` table. All the data in the column will be lost.
  - You are about to drop the column `word_5` on the `words` table. All the data in the column will be lost.
  - Added the required column `cueWord1` to the `words` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cueWord2` to the `words` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cueWord3` to the `words` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cueWord4` to the `words` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cueWord5` to the `words` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `words` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "words" DROP COLUMN "cue",
DROP COLUMN "word_1",
DROP COLUMN "word_2",
DROP COLUMN "word_3",
DROP COLUMN "word_4",
DROP COLUMN "word_5",
ADD COLUMN     "cueWord1" TEXT NOT NULL,
ADD COLUMN     "cueWord2" TEXT NOT NULL,
ADD COLUMN     "cueWord3" TEXT NOT NULL,
ADD COLUMN     "cueWord4" TEXT NOT NULL,
ADD COLUMN     "cueWord5" TEXT NOT NULL,
ADD COLUMN     "key" TEXT NOT NULL;
