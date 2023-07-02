-- DropForeignKey
ALTER TABLE "FavoritesQuizesOnUser" DROP CONSTRAINT "FavoritesQuizesOnUser_quizId_fkey";

-- DropForeignKey
ALTER TABLE "FavoritesQuizesOnUser" DROP CONSTRAINT "FavoritesQuizesOnUser_userId_fkey";

-- AddForeignKey
ALTER TABLE "FavoritesQuizesOnUser" ADD CONSTRAINT "FavoritesQuizesOnUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoritesQuizesOnUser" ADD CONSTRAINT "FavoritesQuizesOnUser_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
