/*
  Warnings:

  - A unique constraint covering the columns `[room_id]` on the table `rooms` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "rooms_room_id_key" ON "rooms"("room_id");
