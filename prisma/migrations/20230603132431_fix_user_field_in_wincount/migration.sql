/*
  Warnings:

  - Made the column `userId` on table `WinCount` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "WinCount" ALTER COLUMN "userId" SET NOT NULL;
