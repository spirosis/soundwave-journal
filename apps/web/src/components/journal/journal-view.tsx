"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Play,
  SkipForward,
  CheckCircle2,
  Heart,
  HeartOff,
} from "lucide-react";
import {
  getJournalInsights,
  getRecentJournalEvents,
  type JournalEventType,
  type RecentTrackEvent,
} from "../../lib/api/journal";
import styles from "./journal-view.module.css";

const EVENT_ICONS: Record<JournalEventType, React.ComponentType<{ size?: number }>> = {
  PLAY: Play,
  SKIP: SkipForward,
  COMPLETE: CheckCircle2,
  FAVORITE: Heart,
  UNFAVORITE: HeartOff,
};

const EVENT_LABELS: Record<JournalEventType, string> = {
  PLAY: "Played",
  SKIP: "Skipped",
  COMPLETE: "Completed",
  FAVORITE: "Favorited",
  UNFAVORITE: "Unfavorited",
};

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffSec = Math.max(Math.round(diffMs / 1000), 0);

  if (diffSec < 60) return "just now";

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d ago`;

  const diffMonth = Math.round(diffDay / 30);
  return `${diffMonth}mo ago`;
}

function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

function EventRow({ event }: { event: RecentTrackEvent }) {
  const Icon = EVENT_ICONS[event.eventType];

  return (
    <li className={styles.eventRow}>
      <span className={`${styles.eventIcon} ${styles[`icon_${event.eventType}`]}`}>
        <Icon size={15} />
      </span>

      <div className={styles.eventInfo}>
        <p className={styles.eventTrack}>{event.trackTitle}</p>
        <p className={styles.eventMeta}>
          {event.artistName} · {event.genre}
        </p>
      </div>

      <div className={styles.eventRight}>
        <span className={styles.eventType}>{EVENT_LABELS[event.eventType]}</span>
        <span className={styles.eventTime}>{formatRelativeTime(event.createdAt)}</span>
      </div>
    </li>
  );
}

export function JournalView() {
  const recentEventsQuery = useQuery({
    queryKey: ["journal", "recent"],
    queryFn: () => getRecentJournalEvents(12),
  });

  const insightsQuery = useQuery({
    queryKey: ["journal", "insights"],
    queryFn: getJournalInsights,
  });

  const summary = insightsQuery.data?.summary;
  const topGenres = insightsQuery.data?.topGenres ?? [];
  const topArtists = insightsQuery.data?.topArtists ?? [];
  const recentEvents = recentEventsQuery.data ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>YOUR JOURNAL</p>
        <h1>Listening history</h1>
        <p className={styles.introDescription}>
          Historial real construido desde tus eventos de escucha: cada play,
          skip, completado y favorito que registras en Search y Home.
        </p>
      </div>

      <section className={styles.summaryPanel}>
        <div className={styles.panelHeader}>
          <p className={styles.panelEyebrow}>LAST 30 DAYS</p>
          <h2>Summary</h2>
        </div>

        {insightsQuery.isLoading ? (
          <p className={styles.mutedText}>Loading summary...</p>
        ) : insightsQuery.error ? (
          <p className={styles.errorText}>{insightsQuery.error.message}</p>
        ) : summary ? (
          <div className={styles.summaryGrid}>
            <div className={styles.metric}>
              <strong>{summary.plays}</strong>
              <span>Plays</span>
            </div>
            <div className={styles.metric}>
              <strong>{summary.completes}</strong>
              <span>Completed</span>
            </div>
            <div className={styles.metric}>
              <strong>{summary.favorites}</strong>
              <span>Favorites</span>
            </div>
            <div className={styles.metric}>
              <strong>{summary.skips}</strong>
              <span>Skipped</span>
            </div>
          </div>
        ) : null}
      </section>

      <div className={styles.insightGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.panelEyebrow}>TOP GENRES</p>
            <h2>Last 30 days</h2>
          </div>

          {insightsQuery.isLoading ? (
            <p className={styles.mutedText}>Loading genres...</p>
          ) : insightsQuery.error ? (
            <p className={styles.errorText}>{insightsQuery.error.message}</p>
          ) : topGenres.length === 0 ? (
            <p className={styles.mutedText}>
              No hay suficiente historial todavía. Escucha o guarda tracks
              desde Search para construir tu perfil de géneros.
            </p>
          ) : (
            <ul className={styles.rankList}>
              {topGenres.map((genre, index) => (
                <li key={genre.genre} className={styles.rankRow}>
                  <span className={styles.rankIndex}>{index + 1}</span>
                  <div className={styles.rankInfo}>
                    <strong>{genre.genre}</strong>
                    <span>
                      {genre.plays} plays · {genre.completes} completed ·{" "}
                      {genre.favorites} favorited
                    </span>
                  </div>
                  <span className={styles.rankScore}>
                    {formatPercentage(genre.completionAvg)} avg
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.panelEyebrow}>TOP ARTISTS</p>
            <h2>Last 30 days</h2>
          </div>

          {insightsQuery.isLoading ? (
            <p className={styles.mutedText}>Loading artists...</p>
          ) : insightsQuery.error ? (
            <p className={styles.errorText}>{insightsQuery.error.message}</p>
          ) : topArtists.length === 0 ? (
            <p className={styles.mutedText}>
              No hay suficiente historial todavía. Escucha o guarda tracks
              desde Search para construir tu perfil de artistas.
            </p>
          ) : (
            <ul className={styles.rankList}>
              {topArtists.map((artist, index) => (
                <li key={artist.artistName} className={styles.rankRow}>
                  <span className={styles.rankIndex}>{index + 1}</span>
                  <div className={styles.rankInfo}>
                    <strong>{artist.artistName}</strong>
                    <span>
                      {artist.plays} plays · {artist.completes} completed
                    </span>
                  </div>
                  <span className={styles.rankScore}>{artist.favorites} ♥</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <p className={styles.panelEyebrow}>RECENT ACTIVITY</p>
          <h2>Latest events</h2>
        </div>

        {recentEventsQuery.isLoading ? (
          <p className={styles.mutedText}>Loading recent activity...</p>
        ) : recentEventsQuery.error ? (
          <p className={styles.errorText}>{recentEventsQuery.error.message}</p>
        ) : recentEvents.length === 0 ? (
          <p className={styles.mutedText}>
            Todavía no tienes eventos registrados. Reproduce un preview o
            marca un favorito desde Search para empezar tu historial.
          </p>
        ) : (
          <ul className={styles.eventList}>
            {recentEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
