-- AlterTable
ALTER TABLE "favorites" ALTER COLUMN "deezer_track_id" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "playlist_tracks" ALTER COLUMN "deezer_track_id" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "track_events" ALTER COLUMN "deezer_track_id" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "track_metadata" ALTER COLUMN "deezer_track_id" SET DATA TYPE BIGINT;
