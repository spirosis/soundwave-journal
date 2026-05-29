-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PLAY', 'SKIP', 'COMPLETE', 'FAVORITE', 'UNFAVORITE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "share_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_tracks" (
    "id" TEXT NOT NULL,
    "playlist_id" TEXT NOT NULL,
    "deezer_track_id" INTEGER NOT NULL,
    "track_title" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "album_cover_url" TEXT,
    "preview_url" TEXT,
    "duration_sec" INTEGER NOT NULL DEFAULT 30,
    "position" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deezer_track_id" INTEGER NOT NULL,
    "track_title" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "album_cover_url" TEXT,
    "preview_url" TEXT,
    "genre" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "track_count" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,

    CONSTRAINT "listening_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT,
    "deezer_track_id" INTEGER NOT NULL,
    "track_title" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "completion_pct" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL,
    "hour_of_day" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "playlists_share_token_key" ON "playlists"("share_token");

-- CreateIndex
CREATE INDEX "playlists_user_id_idx" ON "playlists"("user_id");

-- CreateIndex
CREATE INDEX "playlist_tracks_playlist_id_idx" ON "playlist_tracks"("playlist_id");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_tracks_playlist_id_deezer_track_id_key" ON "playlist_tracks"("playlist_id", "deezer_track_id");

-- CreateIndex
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_deezer_track_id_key" ON "favorites"("user_id", "deezer_track_id");

-- CreateIndex
CREATE INDEX "listening_sessions_user_id_started_at_idx" ON "listening_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "track_events_user_id_created_at_idx" ON "track_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "track_events_user_id_genre_idx" ON "track_events"("user_id", "genre");

-- CreateIndex
CREATE INDEX "track_events_user_id_artist_name_idx" ON "track_events"("user_id", "artist_name");

-- CreateIndex
CREATE INDEX "track_events_user_id_event_type_idx" ON "track_events"("user_id", "event_type");

-- CreateIndex
CREATE INDEX "track_events_user_id_hour_of_day_idx" ON "track_events"("user_id", "hour_of_day");

-- CreateIndex
CREATE INDEX "rate_limit_log_user_id_endpoint_requested_at_idx" ON "rate_limit_log"("user_id", "endpoint", "requested_at");

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_sessions" ADD CONSTRAINT "listening_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_events" ADD CONSTRAINT "track_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_events" ADD CONSTRAINT "track_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "listening_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_limit_log" ADD CONSTRAINT "rate_limit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
