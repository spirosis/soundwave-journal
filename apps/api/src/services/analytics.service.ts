import { prisma } from "../lib/prisma.js";

export interface WeeklySummaryDto {
  plays: number;
  completes: number;
  skips: number;
  favorites: number;
}

export interface WeeklyTopGenreDto {
  genre: string;
  plays: number;
  completes: number;
  favorites: number;
}

export interface WeeklyTopArtistDto {
  artistName: string;
  plays: number;
  completes: number;
  favorites: number;
}

export interface WeeklyAnalyticsDto {
  weekStart: Date;
  weekEnd: Date;
  summary: WeeklySummaryDto;
  topGenres: WeeklyTopGenreDto[];
  topArtists: WeeklyTopArtistDto[];
}

function getWeekRange(now = new Date()): { weekStart: Date; weekEnd: Date } {
  const current = new Date(now);
  const day = current.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const weekStart = new Date(current);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(current.getDate() + diffToMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return { weekStart, weekEnd };
}

export class AnalyticsService {
  async getWeeklyAnalytics(userId: string): Promise<WeeklyAnalyticsDto> {
    const { weekStart, weekEnd } = getWeekRange();

    const [summaryRows, topGenreRows, topArtistRows] = await Promise.all([
      prisma.$queryRaw<
        Array<{
          plays: number;
          completes: number;
          skips: number;
          favorites: number;
        }>
      >`
        SELECT
          COUNT(*) FILTER (WHERE event_type = 'PLAY')::int AS "plays",
          COUNT(*) FILTER (WHERE event_type = 'COMPLETE')::int AS "completes",
          COUNT(*) FILTER (WHERE event_type = 'SKIP')::int AS "skips",
          COUNT(*) FILTER (WHERE event_type = 'FAVORITE')::int AS "favorites"
        FROM track_events
        WHERE user_id = ${userId}
          AND created_at >= ${weekStart}
          AND created_at < ${weekEnd};
      `,
      prisma.$queryRaw<WeeklyTopGenreDto[]>`
        SELECT
          genre,
          COUNT(*) FILTER (WHERE event_type = 'PLAY')::int AS "plays",
          COUNT(*) FILTER (WHERE event_type = 'COMPLETE')::int AS "completes",
          COUNT(*) FILTER (WHERE event_type = 'FAVORITE')::int AS "favorites"
        FROM track_events
        WHERE user_id = ${userId}
          AND created_at >= ${weekStart}
          AND created_at < ${weekEnd}
        GROUP BY genre
        ORDER BY "favorites" DESC, "completes" DESC, "plays" DESC
        LIMIT 5;
      `,
      prisma.$queryRaw<WeeklyTopArtistDto[]>`
        SELECT
          artist_name AS "artistName",
          COUNT(*) FILTER (WHERE event_type = 'PLAY')::int AS "plays",
          COUNT(*) FILTER (WHERE event_type = 'COMPLETE')::int AS "completes",
          COUNT(*) FILTER (WHERE event_type = 'FAVORITE')::int AS "favorites"
        FROM track_events
        WHERE user_id = ${userId}
          AND created_at >= ${weekStart}
          AND created_at < ${weekEnd}
        GROUP BY artist_name
        ORDER BY "favorites" DESC, "completes" DESC, "plays" DESC
        LIMIT 5;
      `,
    ]);

    const summary =
      summaryRows[0] ?? {
        plays: 0,
        completes: 0,
        skips: 0,
        favorites: 0,
      };

    return {
      weekStart,
      weekEnd,
      summary,
      topGenres: topGenreRows,
      topArtists: topArtistRows,
    };
  }
}

export const analyticsService = new AnalyticsService();