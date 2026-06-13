ALTER TABLE "League"
  ADD COLUMN IF NOT EXISTS "ownerEditUsedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "ownerEditUsedById" TEXT;

DO $$
BEGIN
  ALTER TABLE "League"
    ADD CONSTRAINT "League_ownerEditUsedById_fkey"
    FOREIGN KEY ("ownerEditUsedById")
    REFERENCES "User"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "League_ownerEditUsedById_idx"
  ON "League"("ownerEditUsedById");
