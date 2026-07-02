-- CreateEnum
CREATE TYPE "GenreSource" AS ENUM ('MANUAL', 'FAVORITE_INFERRED', 'EVENT_INFERRED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "track_metadata" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deezer_track_id" INTEGER NOT NULL,
    "track_title" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "album_title" TEXT NOT NULL,
    "album_cover_url" TEXT,
    "preview_url" TEXT,
    "deezer_url" TEXT,
    "genre" TEXT NOT NULL DEFAULT 'unknown',
    "genre_source" "GenreSource" NOT NULL DEFAULT 'UNKNOWN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "track_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "track_metadata_user_id_idx" ON "track_metadata"("user_id");

-- CreateIndex
CREATE INDEX "track_metadata_user_id_genre_idx" ON "track_metadata"("user_id", "genre");

-- CreateIndex
CREATE UNIQUE INDEX "track_metadata_user_id_deezer_track_id_key" ON "track_metadata"("user_id", "deezer_track_id");

-- AddForeignKey
ALTER TABLE "track_metadata" ADD CONSTRAINT "track_metadata_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
