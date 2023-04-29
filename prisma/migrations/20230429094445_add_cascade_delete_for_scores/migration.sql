-- DropForeignKey
ALTER TABLE "Score" DROP CONSTRAINT "Score_gameName_fkey";

-- DropForeignKey
ALTER TABLE "Score" DROP CONSTRAINT "Score_userId_fkey";

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_gameName_fkey" FOREIGN KEY ("gameName") REFERENCES "Game"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
