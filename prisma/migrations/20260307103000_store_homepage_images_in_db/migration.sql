ALTER TABLE "HomepageImage"
ADD COLUMN     "contentType" TEXT NOT NULL DEFAULT 'image/jpeg',
ADD COLUMN     "data" BYTEA,
ALTER COLUMN   "url" SET DEFAULT '',
ALTER COLUMN   "storagePath" SET DEFAULT '';
