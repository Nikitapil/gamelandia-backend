-- DropForeignKey
ALTER TABLE "QuizComment" DROP CONSTRAINT "QuizComment_replyToId_fkey";

-- AddForeignKey
ALTER TABLE "QuizComment" ADD CONSTRAINT "QuizComment_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "QuizComment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
