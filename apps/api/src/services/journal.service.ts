import { prisma } from "../lib/prisma.js";
import { EventType } from "../generated/prisma/enums.js";

export interface LogTrackEventDto {
  sessionId?: string;
  deezerTrackId: number;
  trackTitle: string;
  artistName: string;
  genre?: string;
  eventType: EventType;
  completionPct?: number;
  source: string;
}

export interface TrackEventDto {
  id: string;
  sessionId: string | null;
  deezerTrackId: number;
  trackTitle: string;
  artistName: string;
  genre: string;
  eventType: EventType;
  completionPct: number;
  source: string;
  hourOfDay: number;
  dayOfWeek: number;
  createdAt: Date;
}

export interface StartListeningSessionDto {
  label?: string;
}

export interface ListeningSessionDto {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  trackCount: number;
  label: string | null;
}

export interface RecentTrackEventDto extends TrackEventDto {
  sessionLabel: string | null;
}

export interface JournalSummaryDto {
  plays: number;
  completes: number;
  skips: number;
  favorites: number;
}

export interface TopGenreInsightDto {
  genre: string;
  plays: number;
  favorites: number;
  completes: number;
  skips: number;
  completionAvg: number;
  engagementScore: number;
}

export interface TopArtistInsightDto {
  artistName: string;
  plays: number;
  completes: number;
  favorites: number;
}

export interface JournalInsightsDto {
  summary: JournalSummaryDto;
  topGenres: TopGenreInsightDto[];
  topArtists: TopArtistInsightDto[];
}

export interface HourPatternDto {
  hourOfDay: number;
  plays: number;
  completes: number;
  skips: number;
}

export interface DayPatternDto {
  dayOfWeek: number;
  plays: number;
  completes: number;
  skips: number;
}

export interface GenreTimePatternDto {
  genre: string;
  hourOfDay: number;
  plays: number;
}

export interface JournalTimePatternsDto {
  byHour: HourPatternDto[];
  byDay: DayPatternDto[];
  topGenreHours: GenreTimePatternDto[];
}

export interface JournalStreakDto {
  currentStreakDays: number;
  longestStreakDays: number;
  totalActiveDays: number;
  lastActiveDate: string | null;
}


const STREAK_LOOKBACK_DAYS = 365;



function toTrackEventDto(row: {
  id: string;
  sessionId: string | null;
  deezerTrackId: number;
  trackTitle: string;
  artistName: string;
  genre: string;
  eventType: EventType;
  completionPct: number;
  source: string;
  hourOfDay: number;
  dayOfWeek: number;
  createdAt: Date;
}): TrackEventDto {
  return {
    id: row.id,
    sessionId: row.sessionId,
    deezerTrackId: row.deezerTrackId,
    trackTitle: row.trackTitle,
    artistName: row.artistName,
    genre: row.genre,
    eventType: row.eventType,
    completionPct: row.completionPct,
    source: row.source,
    hourOfDay: row.hourOfDay,
    dayOfWeek: row.dayOfWeek,
    createdAt: row.createdAt,
  };
}

function toListeningSessionDto(row: {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  trackCount: number;
  label: string | null;
}): ListeningSessionDto {
  return {
    id: row.id,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    trackCount: row.trackCount,
    label: row.label,
  };
}

function toRecentTrackEventDto(row: {
  id: string;
  sessionId: string | null;
  deezerTrackId: number;
  trackTitle: string;
  artistName: string;
  genre: string;
  eventType: EventType;
  completionPct: number;
  source: string;
  hourOfDay: number;
  dayOfWeek: number;
  createdAt: Date;
  session: { label: string | null } | null;
}): RecentTrackEventDto {
  return {
    id: row.id,
    sessionId: row.sessionId,
    deezerTrackId: row.deezerTrackId,
    trackTitle: row.trackTitle,
    artistName: row.artistName,
    genre: row.genre,
    eventType: row.eventType,
    completionPct: row.completionPct,
    source: row.source,
    hourOfDay: row.hourOfDay,
    dayOfWeek: row.dayOfWeek,
    createdAt: row.createdAt,
    sessionLabel: row.session?.label ?? null,
  };
}


export class JournalService {

  private async ensureOwnedSession(userId: string, sessionId: string) {
    const session = await prisma.listeningSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },

      select: {
        id: true,
        endedAt: true,
      },
    });

    if (!session) {
      throw new Error("SESSION_NOT_FOUND");
    }
    return session;
  }

    private async resolveGenre(
    userId: string,
    deezerTrackId: number,
    providedGenre?: string,
  ): Promise<string> {
    const normalizedProvidedGenre =
      typeof providedGenre === "string" ? providedGenre.trim() : "";

    if (normalizedProvidedGenre) {
      return normalizedProvidedGenre;
    }

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        deezerTrackId,
        genre: {
          not: "unknown",
        },
      },
      select: {
        genre: true,
      },
    });

    if (favorite?.genre.trim()) {
      return favorite.genre;
    }

    const previousEvent = await prisma.trackEvent.findFirst({
      where: {
        userId,
        deezerTrackId,
        genre: {
          not: "unknown",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        genre: true,
      },
    });

    if (previousEvent?.genre.trim()) {
      return previousEvent.genre;
    }

    return "unknown";
  }

  async startListeningSession(
    userId: string,
    data: StartListeningSessionDto
  ): Promise<ListeningSessionDto> {
    const row = await prisma.listeningSession.create({
      data: {
        userId,
        ...(data.label ? { label: data.label } : {})
      },
    });
    return toListeningSessionDto(row);
  }

  async endListeningSession(userId: string, sessionId: string): Promise<ListeningSessionDto> {
    const session = await this.ensureOwnedSession(userId, sessionId);

    if (session.endedAt) {
      throw new Error("SESSION_ALREADY_ENDED");
    }

    const row = await prisma.listeningSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
      }
    });

    return toListeningSessionDto(row);
  }

  async logTrackEvent(userId: string, data: LogTrackEventDto): Promise<TrackEventDto> {

    const now = new Date();
    const resolvedGenre = await this.resolveGenre(
      userId,
      data.deezerTrackId,
      data.genre,
    );

    if (data.sessionId) {
      const session = await this.ensureOwnedSession(userId, data.sessionId);

      if (session.endedAt) {
        throw new Error("SESSION_ALREADY_ENDED")
      }
    }

        const row = await prisma.$transaction(async (tx) => {
      const createdEvent = await tx.trackEvent.create({
        data: {
          userId,
          sessionId: data.sessionId ?? null,
          deezerTrackId: data.deezerTrackId,
          trackTitle: data.trackTitle,
          artistName: data.artistName,
          genre: resolvedGenre,
          eventType: data.eventType,
          completionPct: data.completionPct ?? 0,
          source: data.source,
          hourOfDay: now.getHours(),
          dayOfWeek: now.getDay(),
        },
      });

      if (data.sessionId && data.eventType === EventType.PLAY) {
        await tx.listeningSession.update({
          where: { id: data.sessionId },
          data: {
            trackCount: {
              increment: 1,
            },
          },
        });
      }

      return createdEvent;
    });

    return toTrackEventDto(row);
  }

  async getRecentEvents(userId: string, limit = 20): Promise<RecentTrackEventDto[]> {
    const rows = await prisma.trackEvent.findMany({
      where: {
        userId
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        session: {
          select: {
            label: true,
          },
        },
      },
    });

    return rows.map(toRecentTrackEventDto);

  }

  async getJournalInsights(userId: string): Promise<JournalInsightsDto> {
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
          AND created_at > NOW() - INTERVAL '30 days';
      `,
      prisma.$queryRaw<TopGenreInsightDto[]>`
        SELECT
        genre,
        COUNT(*) FILTER (WHERE event_type = 'PLAY')::int AS "plays",
        COUNT(*) FILTER (WHERE event_type = 'FAVORITE')::int AS "favorites",
        COUNT(*) FILTER (WHERE event_type = 'COMPLETE')::int AS "completes",
        COUNT(*) FILTER (WHERE event_type = 'SKIP')::int AS "skips",
        COALESCE(
          AVG(completion_pct) FILTER (WHERE event_type = 'PLAY'),
          0
        )::float8 AS "completionAvg",
        (
          COALESCE(
            AVG(completion_pct) FILTER (WHERE event_type = 'PLAY'),
            0
          )
          * (
            1 - COALESCE(
              (
                COUNT(*) FILTER (WHERE event_type = 'SKIP')::float8
                / NULLIF(COUNT(*) FILTER (WHERE event_type = 'PLAY'), 0)
              ),
              0
            )
          )
        )::float8 AS "engagementScore"
      FROM track_events
      WHERE user_id = ${userId}
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY genre
      ORDER BY "engagementScore" DESC, "favorites" DESC, "plays" DESC
      LIMIT 5;
      
      `,

      prisma.$queryRaw<TopArtistInsightDto[]>`
        SELECT
          artist_name AS "artistName",
          COUNT(*) FILTER (WHERE event_type = 'PLAY')::int AS "plays",
          COUNT(*) FILTER (WHERE event_type = 'COMPLETE')::int AS "completes",
          COUNT(*) FILTER (WHERE event_type = 'FAVORITE')::int AS "favorites"
        FROM track_events
        WHERE user_id = ${userId}
          AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY artist_name
        ORDER BY "favorites" DESC, "completes" DESC, "plays" DESC
        LIMIT 5;
      `,
    ]);

    const summary = summaryRows[0] ?? {
      plays: 0,
      completes: 0,
      skips: 0,
      favorites: 0,
    };

    return {
      summary,
      topGenres: topGenreRows,
      topArtists: topArtistRows,
    };
  }




  // MVP tradeoff:
  // streaks are computed over a bounded recent window to keep the query predictable.
  // Exact all-time longest streak would require precomputation or a dedicated aggregate table.
  async getStreaks(userId: string): Promise<JournalStreakDto> {
    const rows = await prisma.$queryRaw<JournalStreakDto[]>`
      WITH active_days AS (
        SELECT DISTINCT DATE(created_at) AS active_date
        FROM track_events
        WHERE user_id = ${userId}
          AND created_at >= NOW() - (${STREAK_LOOKBACK_DAYS} * INTERVAL '1 day')
      ),
      numbered_days AS (
        SELECT
          active_date,
          active_date - (ROW_NUMBER() OVER (ORDER BY active_date))::int AS streak_group
        FROM active_days
      ),
      streaks AS (
        SELECT
          MIN(active_date) AS start_date,
          MAX(active_date) AS end_date,
          COUNT(*)::int AS length
        FROM numbered_days
        GROUP BY streak_group
      ),
      summary AS (
        SELECT
          COUNT(*)::int AS total_active_days,
          MAX(active_date) AS last_active_date
        FROM active_days
      )
      SELECT
        CASE
          WHEN summary.last_active_date = CURRENT_DATE THEN COALESCE((
            SELECT length
            FROM streaks
            WHERE end_date = CURRENT_DATE
            ORDER BY length DESC
            LIMIT 1
          ), 0)
          ELSE 0
        END::int AS "currentStreakDays",
        COALESCE((
          SELECT MAX(length)
          FROM streaks
        ), 0)::int AS "longestStreakDays",
        COALESCE(summary.total_active_days, 0)::int AS "totalActiveDays",
        summary.last_active_date::text AS "lastActiveDate"
      FROM summary;
    `;

    return (
      rows[0] ?? {
        currentStreakDays: 0,
        longestStreakDays: 0,
        totalActiveDays: 0,
        lastActiveDate: null,
      }
    );
  }


  async getTimePatterns(userId: string): Promise<JournalTimePatternsDto> {
    const [byHour, byDay, topGenreHours] = await Promise.all([
      prisma.$queryRaw<HourPatternDto[]>`
      SELECT
        hour_of_day AS "hourOfDay",
        COUNT(*) FILTER (WHERE event_type = 'PLAY')::int AS "plays",
        COUNT(*) FILTER (WHERE event_type = 'COMPLETE')::int AS "completes",
        COUNT(*) FILTER (WHERE event_type = 'SKIP')::int AS "skips"
      FROM track_events
      WHERE user_id = ${userId}
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY hour_of_day
      ORDER BY hour_of_day ASC;
    `,
      prisma.$queryRaw<DayPatternDto[]>`
      SELECT
        day_of_week AS "dayOfWeek",
        COUNT(*) FILTER (WHERE event_type = 'PLAY')::int AS "plays",
        COUNT(*) FILTER (WHERE event_type = 'COMPLETE')::int AS "completes",
        COUNT(*) FILTER (WHERE event_type = 'SKIP')::int AS "skips"
      FROM track_events
      WHERE user_id = ${userId}
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY day_of_week
      ORDER BY day_of_week ASC;
    `,
      prisma.$queryRaw<GenreTimePatternDto[]>`
      SELECT
        genre,
        hour_of_day AS "hourOfDay",
        COUNT(*) FILTER (WHERE event_type = 'PLAY')::int AS "plays"
      FROM track_events
      WHERE user_id = ${userId}
        AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY genre, hour_of_day
      ORDER BY "plays" DESC
      LIMIT 10;
    `,
    ]);

    return {
      byHour,
      byDay,
      topGenreHours,
    };
  }

}

export const journalService = new JournalService();