/*
  Warnings:

  - Made the column `quizId` on table `QuizQuestion` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "QuizQuestion" ALTER COLUMN "quizId" SET NOT NULL;
