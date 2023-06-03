/*
  Warnings:

  - A unique constraint covering the columns `[gameName,userId,level]` on the table `WinCount` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "WinCount_gameName_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "WinCount_gameName_userId_level_key" ON "WinCount"("gameName", "userId", "level");
