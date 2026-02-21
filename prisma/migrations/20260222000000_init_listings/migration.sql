CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "listings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "supabase_user_id" UUID,
  "name" TEXT NOT NULL,
  "age" INTEGER,
  "city" TEXT NOT NULL,
  "price" INTEGER,
  "description" TEXT NOT NULL,
  "image_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "is_published" BOOLEAN NOT NULL DEFAULT FALSE,
  "height" TEXT,
  "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "availability" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_top" BOOLEAN NOT NULL DEFAULT FALSE,
  "experience_years" INTEGER,
  "rating" DECIMAL(3,2),
  "services" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "listings_is_published_idx" ON "listings"("is_published");
CREATE INDEX IF NOT EXISTS "listings_city_idx" ON "listings"("city");
