CREATE TABLE "MenuAccessConfig" (
    "id" TEXT NOT NULL,
    "lockedKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MenuAccessConfig_pkey" PRIMARY KEY ("id")
);

INSERT INTO "MenuAccessConfig" ("id", "lockedKeys", "updatedAt")
VALUES ('menu-access-config', ARRAY[]::TEXT[], NOW());
