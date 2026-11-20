import { prisma } from "../lib/prisma.js";

const RECOMMENDATION_CONFIG = {
  SIGNAL_WEIGHTS: {
    FAVORITE: 5.0,
    COMPLETE: 3.0,
    PLAY: 1.0,
    SKIP: -2.0,
    UNFAVORITE: -4.0,
  },
  HALF_LIFE_DAYS: 7,
  CUTOFF_DAYS: 90,
  TOP_N: 5,
} as const;

const LAMBDA = Math.LN2 / RECOMMENDATION_CONFIG.HALF_LIFE_DAYS;
const NEGATIVE_LAMBDA = -LAMBDA;


interface CombinedGenreRow {
  genre: string;
  score: number;
  recentFavorites: number;
  recentCompletes: number;
  recentPlays: number;
  recentSkips: number;
  nightPlays: number;
}

export interface RecommendationDto {
  genre: string;
  score: number;
  reason: string;
}

const DEFAULT_REASON = "Because it matches your recent listening history";

function buildReason(row: CombinedGenreRow): string {
  if (row.recentFavorites > 0) {
    return `Because you recently favorited ${row.genre} tracks`;
  }

  if (row.recentCompletes > 0) {
    return `Because you finished ${row.genre} previews this week`;
  }

  if (row.nightPlays > 0) {
    return `Because you tend to play ${row.genre} at night`;
  }

  if (row.recentPlays > 0 && row.recentSkips === 0) {
    return `Because you've been playing ${row.genre} lately without skipping`;
  }

  return DEFAULT_REASON;
}

export class RecommendationService {
  async getTopGenres(userId: string): Promise<RecommendationDto[]> {
    const rows = await prisma.$queryRaw<CombinedGenreRow[]>`
      WITH genre_scores AS (
        SELECT
          genre,
          SUM(
            CASE event_type
              WHEN 'FAVORITE'   THEN ${RECOMMENDATION_CONFIG.SIGNAL_WEIGHTS.FAVORITE}
              WHEN 'COMPLETE'   THEN ${RECOMMENDATION_CONFIG.SIGNAL_WEIGHTS.COMPLETE}
              WHEN 'PLAY'       THEN ${RECOMMENDATION_CONFIG.SIGNAL_WEIGHTS.PLAY}
              WHEN 'SKIP'       THEN ${RECOMMENDATION_CONFIG.SIGNAL_WEIGHTS.SKIP}
              WHEN 'UNFAVORITE' THEN ${RECOMMENDATION_CONFIG.SIGNAL_WEIGHTS.UNFAVORITE}
              ELSE 0
            END
            * EXP(
                ${NEGATIVE_LAMBDA} * EXTRACT(epoch FROM (NOW() - created_at)) / 86400.0
              )
          )::float8 AS score
        FROM track_events
        WHERE user_id = ${userId}
          AND created_at > NOW() - (${RECOMMENDATION_CONFIG.CUTOFF_DAYS} * INTERVAL '1 day')
        GROUP BY genre
      ),
      top_genres AS (
        SELECT genre, score
        FROM genre_scores
        WHERE score > 0
        ORDER BY score DESC
        LIMIT ${RECOMMENDATION_CONFIG.TOP_N}
      ),
      reason_signals AS (
        SELECT
          te.genre,
          COUNT(*) FILTER (
            WHERE te.event_type = 'FAVORITE'
              AND te.created_at > NOW() - INTERVAL '7 days'
          )::int AS "recentFavorites",
          COUNT(*) FILTER (
            WHERE te.event_type = 'COMPLETE'
              AND te.created_at > NOW() - INTERVAL '7 days'
          )::int AS "recentCompletes",
          COUNT(*) FILTER (
            WHERE te.event_type = 'PLAY'
              AND te.created_at > NOW() - INTERVAL '7 days'
          )::int AS "recentPlays",
          COUNT(*) FILTER (
            WHERE te.event_type = 'SKIP'
              AND te.created_at > NOW() - INTERVAL '7 days'
          )::int AS "recentSkips",
          COUNT(*) FILTER (
            WHERE te.event_type = 'PLAY'
              AND te.hour_of_day >= 19
              AND te.hour_of_day <= 23
              AND te.created_at > NOW() - INTERVAL '30 days'
          )::int AS "nightPlays"
        FROM track_events te
        INNER JOIN top_genres tg ON te.genre = tg.genre
        WHERE te.user_id = ${userId}
        GROUP BY te.genre
      )
      SELECT
        tg.genre,
        tg.score,
        COALESCE(rs."recentFavorites", 0) AS "recentFavorites",
        COALESCE(rs."recentCompletes", 0) AS "recentCompletes",
        COALESCE(rs."recentPlays",     0) AS "recentPlays",
        COALESCE(rs."recentSkips",     0) AS "recentSkips",
        COALESCE(rs."nightPlays",      0) AS "nightPlays"
      FROM top_genres tg
      LEFT JOIN reason_signals rs ON tg.genre = rs.genre
      ORDER BY tg.score DESC;
    `;

    if (rows.length === 0) {
      return [];
    }

    return rows.map((row) => ({
      genre: row.genre,
      score: row.score,
      reason: buildReason(row),
    }));
  }

  async getRecommendationMetrics(userId: string): Promise<{
    recommendationFavoriteRate: number | null;
    recommendationCompleteRate: number | null;
    recommendationSkipRate: number | null;
    recommendationPlayCount: number;
  }> {
    const rows = await prisma.$queryRaw<
      Array<{
        recommendationFavoriteRate: number | null;
        recommendationCompleteRate: number | null;
        recommendationSkipRate: number | null;
        recommendationPlayCount: number;
      }>
    >`
      SELECT
        (
          COUNT(*) FILTER (
            WHERE source = 'recommendation' AND event_type = 'FAVORITE'
          )::float8
          / NULLIF(
              COUNT(*) FILTER (
                WHERE source = 'recommendation' AND event_type = 'PLAY'
              ),
              0
            )
        ) AS "recommendationFavoriteRate",
        (
          COUNT(*) FILTER (
            WHERE source = 'recommendation' AND event_type = 'COMPLETE'
          )::float8
          / NULLIF(
              COUNT(*) FILTER (
                WHERE source = 'recommendation' AND event_type = 'PLAY'
              ),
              0
            )
        ) AS "recommendationCompleteRate",
        (
          COUNT(*) FILTER (
            WHERE source = 'recommendation' AND event_type = 'SKIP'
          )::float8
          / NULLIF(
              COUNT(*) FILTER (
                WHERE source = 'recommendation' AND event_type = 'PLAY'
              ),
              0
            )
        ) AS "recommendationSkipRate",
        COUNT(*) FILTER (
          WHERE source = 'recommendation' AND event_type = 'PLAY'
        )::int AS "recommendationPlayCount"
      FROM track_events
      WHERE user_id = ${userId}
        AND created_at > NOW() - (${RECOMMENDATION_CONFIG.CUTOFF_DAYS} * INTERVAL '1 day');
    `;  
        // Metrics use the same recent lookback window as the recommendation engine
        // so effectiveness reflects current behavior rather than all-time history.

    return (
      rows[0] ?? {
        recommendationFavoriteRate: null,
        recommendationCompleteRate: null,
        recommendationSkipRate: null,
        recommendationPlayCount: 0,
      }
    );
  }
}

export const recommendationService = new RecommendationService();