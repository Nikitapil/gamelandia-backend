CREATE TABLE "_StarfallGamePlayers" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

CREATE UNIQUE INDEX "_StarfallGamePlayers_AB_unique"
ON "_StarfallGamePlayers"("A", "B");

CREATE INDEX "_StarfallGamePlayers_B_index"
ON "_StarfallGamePlayers"("B");

ALTER TABLE "_StarfallGamePlayers"
ADD CONSTRAINT "_StarfallGamePlayers_A_fkey"
FOREIGN KEY ("A") REFERENCES "StarfallGame"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_StarfallGamePlayers"
ADD CONSTRAINT "_StarfallGamePlayers_B_fkey"
FOREIGN KEY ("B") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
