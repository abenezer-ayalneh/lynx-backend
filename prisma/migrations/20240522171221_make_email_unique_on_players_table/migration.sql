/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `players` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "players_email_key" ON "players"("email");
