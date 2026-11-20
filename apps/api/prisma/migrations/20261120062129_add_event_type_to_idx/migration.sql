-- DropIndex
DROP INDEX "track_events_user_id_created_at_idx";

-- CreateIndex
CREATE INDEX "track_events_user_id_created_at_event_type_idx" ON "track_events"("user_id", "created_at", "event_type");
