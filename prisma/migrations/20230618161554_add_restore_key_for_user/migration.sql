/*
  Warnings:

  - A unique constraint covering the columns `[restoreKey]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "restoreKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_restoreKey_key" ON "User"("restoreKey");
