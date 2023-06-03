/*
  Warnings:

  - A unique constraint covering the columns `[gameName,userId]` on the table `WinCount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WinCount_gameName_userId_key" ON "WinCount"("gameName", "userId");
