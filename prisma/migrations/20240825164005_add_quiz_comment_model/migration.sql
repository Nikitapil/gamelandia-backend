-- CreateTable
CREATE TABLE "QuizComment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "text" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "replyToId" TEXT,

    CONSTRAINT "QuizComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuizComment" ADD CONSTRAINT "QuizComment_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizComment" ADD CONSTRAINT "QuizComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizComment" ADD CONSTRAINT "QuizComment_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "QuizComment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
