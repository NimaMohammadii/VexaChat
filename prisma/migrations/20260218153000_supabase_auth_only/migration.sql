-- Drop legacy NextAuth tables
DROP TABLE IF EXISTS "Account";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "VerificationToken";

-- Align creator approval column naming
ALTER TABLE "CreatorProfile" RENAME COLUMN "isApproved" TO "approved";
