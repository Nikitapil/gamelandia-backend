/*
  Warnings:

  - Made the column `gameName` on table `Score` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Score" DROP CONSTRAINT "Score_gameName_fkey";

-- AlterTable
ALTER TABLE "Score" ADD COLUMN     "level" TEXT,
ALTER COLUMN "gameName" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_gameName_fkey" FOREIGN KEY ("gameName") REFERENCES "Game"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
