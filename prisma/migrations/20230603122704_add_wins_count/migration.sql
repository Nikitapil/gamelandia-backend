-- CreateTable
CREATE TABLE "WinCount" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" INTEGER NOT NULL,
    "level" TEXT,
    "gameName" TEXT NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "WinCount_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WinCount" ADD CONSTRAINT "WinCount_gameName_fkey" FOREIGN KEY ("gameName") REFERENCES "Game"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WinCount" ADD CONSTRAINT "WinCount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
