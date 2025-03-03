-- AlterTable
ALTER TABLE "_GameToWord" ADD CONSTRAINT "_GameToWord_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_GameToWord_AB_unique";
