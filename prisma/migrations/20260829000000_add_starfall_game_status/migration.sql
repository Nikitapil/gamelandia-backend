CREATE TYPE "StarfallGameStatus" AS ENUM ('waiting', 'active', 'finished');

ALTER TABLE "StarfallGame"
ADD COLUMN "status" "StarfallGameStatus";

UPDATE "StarfallGame"
SET "status" = ("state"->>'status')::"StarfallGameStatus";

ALTER TABLE "StarfallGame"
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'waiting';

CREATE INDEX "StarfallGame_status_createdAt_idx"
ON "StarfallGame"("status", "createdAt");
