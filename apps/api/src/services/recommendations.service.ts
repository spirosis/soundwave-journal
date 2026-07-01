import { prisma } from "../lib/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

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


interface GenreScoreRow {
  genre: string;
  score: number;
}

interface GenreReasonRow {
  genre: string;
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

function buildReason(row: GenreReasonRow): string {
  if (row.recentFavorites > 0) {
    return `Porque has marcado ${row.genre} como favorito recientemente`;
  }

  if (row.recentCompletes > 0) {
    return `Porque completaste varias previews de ${row.genre} esta semana`;
  }

  if (row.nightPlays > 0) {
    return `Porque por las noches sueles escuchar ${row.genre}`;
  }

  if (row.recentPlays > 0 && row.recentSkips === 0) {
    return `Porque has escuchado ${row.genre} con buena continuidad recientemente`;
  }

  return `Porque muestra afinidad reciente con tu historial de escucha`;
}

export class RecommendationService {
  async getTopGenres(userId: string): Promise<RecommendationDto[]> {
    const genreScores = await prisma.$queryRaw<GenreScoreRow[]>`
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
      )
      SELECT genre, score
      FROM genre_scores
      WHERE score > 0
      ORDER BY score DESC
      LIMIT ${RECOMMENDATION_CONFIG.TOP_N};
    `;

    if (genreScores.length === 0) {
      return [];
    }

    const genres = genreScores.map((row) => row.genre);

    const reasonRows = await prisma.$queryRaw<GenreReasonRow[]>`
      SELECT
        genre,
        COUNT(*) FILTER (
          WHERE event_type = 'FAVORITE'
            AND created_at > NOW() - INTERVAL '7 days'
        )::int AS "recentFavorites",
        COUNT(*) FILTER (
          WHERE event_type = 'COMPLETE'
            AND created_at > NOW() - INTERVAL '7 days'
        )::int AS "recentCompletes",
        COUNT(*) FILTER (
          WHERE event_type = 'PLAY'
            AND created_at > NOW() - INTERVAL '7 days'
        )::int AS "recentPlays",
        COUNT(*) FILTER (
          WHERE event_type = 'SKIP'
            AND created_at > NOW() - INTERVAL '7 days'
        )::int AS "recentSkips",
        COUNT(*) FILTER (
          WHERE event_type = 'PLAY'
            AND hour_of_day >= 19
            AND hour_of_day <= 23
            AND created_at > NOW() - INTERVAL '30 days'
        )::int AS "nightPlays"
      FROM track_events
      WHERE user_id = ${userId}
        AND genre IN (${Prisma.join(genres)})
      GROUP BY genre;
    `;

    const reasonsByGenre = new Map(
      reasonRows.map((row) => [row.genre, buildReason(row)])
    );

    return genreScores.map((row) => ({
      genre: row.genre,
      score: row.score,
      reason:
        reasonsByGenre.get(row.genre) ??
        "Porque muestra afinidad reciente con tu historial de escucha",
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