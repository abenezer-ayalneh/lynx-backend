-- Data Migration: Player -> User (Better Auth)
-- Run this BEFORE running `prisma migrate deploy` on production.
-- This script migrates existing data while the old schema is still in place.
-- After running this, run `prisma migrate deploy` to apply the schema changes.
--
-- Prerequisites: Back up the database first!
--   docker exec lynx-postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > ~/lynx_backup_$(date +%Y%m%d).sql

BEGIN;

-- 1. Create the new Better Auth tables (user, session, account, verification)
--    These don't conflict with existing tables.
CREATE TABLE IF NOT EXISTS "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT,
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_email_key" ON "user"("email");

CREATE TABLE IF NOT EXISTS "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,
    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "session_token_key" ON "session"("token");
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");

CREATE TABLE IF NOT EXISTS "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");

CREATE TABLE IF NOT EXISTS "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"("identifier");

-- 2. Migrate players -> user table
--    Generate UUIDs for the new string IDs.
--    Passwords are NOT migrated (bcrypt -> scrypt incompatible). Users must reset passwords.
INSERT INTO "user" ("id", "name", "email", "score", "role", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::TEXT,
    p.name,
    p.email,
    p.score,
    CASE WHEN p.role = 'ADMIN' THEN 'admin' ELSE 'user' END,
    p.created_at,
    COALESCE(p.updated_at, p.created_at)
FROM players p
WHERE p.deleted_at IS NULL
ON CONFLICT ("email") DO NOTHING;

-- 3. Create "credential" accounts for migrated users (no password — forces reset)
INSERT INTO "account" ("id", "accountId", "providerId", "userId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::TEXT,
    u.id,
    'credential',
    u.id,
    u."createdAt",
    u."updatedAt"
FROM "user" u
WHERE NOT EXISTS (
    SELECT 1 FROM "account" a WHERE a."userId" = u.id AND a."providerId" = 'credential'
);

-- 4. Rename columns in games table (snake_case -> camelCase) and update FK type
--    First, drop old foreign keys
ALTER TABLE "games" DROP CONSTRAINT IF EXISTS "games_owner_id_fkey";
ALTER TABLE "games" DROP CONSTRAINT IF EXISTS "games_scheduled_game_id_fkey";

--    Add new camelCase columns
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "scheduledGameId" TEXT;
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

--    Populate new columns from old data
UPDATE "games" g SET
    "ownerId" = u.id,
    "scheduledGameId" = g.scheduled_game_id,
    "createdAt" = g.created_at,
    "updatedAt" = g.updated_at,
    "deletedAt" = g.deleted_at
FROM "players" p
JOIN "user" u ON u.email = p.email
WHERE g.owner_id = p.id;

--    Drop old columns
ALTER TABLE "games" DROP COLUMN IF EXISTS "owner_id";
ALTER TABLE "games" DROP COLUMN IF EXISTS "scheduled_game_id";
ALTER TABLE "games" DROP COLUMN IF EXISTS "created_at";
ALTER TABLE "games" DROP COLUMN IF EXISTS "updated_at";
ALTER TABLE "games" DROP COLUMN IF EXISTS "deleted_at";

--    Make ownerId NOT NULL (after data is populated)
ALTER TABLE "games" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "games" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "games" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- 5. Rename columns in scheduled_games table
ALTER TABLE "scheduled_games" DROP CONSTRAINT IF EXISTS "scheduled_games_created_by_fkey";
DROP INDEX IF EXISTS "scheduled_games_room_id_key";

ALTER TABLE "scheduled_games" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "scheduled_games" ADD COLUMN IF NOT EXISTS "invitationText" TEXT;
ALTER TABLE "scheduled_games" ADD COLUMN IF NOT EXISTS "invitedEmails" TEXT[];
ALTER TABLE "scheduled_games" ADD COLUMN IF NOT EXISTS "roomId" TEXT;
ALTER TABLE "scheduled_games" ADD COLUMN IF NOT EXISTS "startTime" TIMESTAMP(3);
ALTER TABLE "scheduled_games" ADD COLUMN IF NOT EXISTS "maxUsers" INTEGER DEFAULT 8;
ALTER TABLE "scheduled_games" ADD COLUMN IF NOT EXISTS "createdAt_new" TIMESTAMP(3);
ALTER TABLE "scheduled_games" ADD COLUMN IF NOT EXISTS "updatedAt_new" TIMESTAMP(3);
ALTER TABLE "scheduled_games" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

UPDATE "scheduled_games" sg SET
    "createdBy" = u.id,
    "invitationText" = sg.invitation_text,
    "invitedEmails" = sg.invited_emails,
    "roomId" = sg.room_id,
    "startTime" = sg.start_time,
    "maxUsers" = sg.max_players,
    "createdAt_new" = sg.created_at,
    "updatedAt_new" = sg.updated_at,
    "deletedAt" = sg.deleted_at
FROM "players" p
JOIN "user" u ON u.email = p.email
WHERE sg.created_by = p.id;

ALTER TABLE "scheduled_games" DROP COLUMN IF EXISTS "created_by";
ALTER TABLE "scheduled_games" DROP COLUMN IF EXISTS "invitation_text";
ALTER TABLE "scheduled_games" DROP COLUMN IF EXISTS "invited_emails";
ALTER TABLE "scheduled_games" DROP COLUMN IF EXISTS "room_id";
ALTER TABLE "scheduled_games" DROP COLUMN IF EXISTS "start_time";
ALTER TABLE "scheduled_games" DROP COLUMN IF EXISTS "max_players";
ALTER TABLE "scheduled_games" DROP COLUMN IF EXISTS "created_at";
ALTER TABLE "scheduled_games" DROP COLUMN IF EXISTS "updated_at";

ALTER TABLE "scheduled_games" RENAME COLUMN "createdAt_new" TO "createdAt";
ALTER TABLE "scheduled_games" RENAME COLUMN "updatedAt_new" TO "updatedAt";

ALTER TABLE "scheduled_games" ALTER COLUMN "createdBy" SET NOT NULL;
ALTER TABLE "scheduled_games" ALTER COLUMN "invitationText" SET NOT NULL;
ALTER TABLE "scheduled_games" ALTER COLUMN "roomId" SET NOT NULL;
ALTER TABLE "scheduled_games" ALTER COLUMN "startTime" SET NOT NULL;
ALTER TABLE "scheduled_games" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "scheduled_games" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "scheduled_games_roomId_key" ON "scheduled_games"("roomId");

-- 6. Rename columns in words table
ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);
ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
ALTER TABLE "words" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

UPDATE "words" SET
    "createdAt" = created_at,
    "updatedAt" = updated_at,
    "deletedAt" = deleted_at;

ALTER TABLE "words" DROP COLUMN IF EXISTS "created_at";
ALTER TABLE "words" DROP COLUMN IF EXISTS "updated_at";
ALTER TABLE "words" DROP COLUMN IF EXISTS "deleted_at";

ALTER TABLE "words" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "words" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- 7. Add foreign keys for new schema
ALTER TABLE "games" ADD CONSTRAINT "games_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "games" ADD CONSTRAINT "games_scheduledGameId_fkey"
    FOREIGN KEY ("scheduledGameId") REFERENCES "scheduled_games"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "scheduled_games" ADD CONSTRAINT "scheduled_games_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Drop old players table and Role enum
DROP TABLE IF EXISTS "players";
DROP TYPE IF EXISTS "Role";

-- 9. Mark the Prisma migration as already applied so `prisma migrate deploy` skips it
INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
VALUES (
    gen_random_uuid()::TEXT,
    '0000000000000000_manual_data_migration',
    '20251216124539_implement_better_auth',
    NOW(),
    1
) ON CONFLICT DO NOTHING;

COMMIT;
