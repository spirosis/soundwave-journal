"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getRecommendationMetrics,
  getRecommendations,
} from "../../lib/api/recommendations";
import { getWeeklyAnalytics } from "../../lib/api/analytics";
import styles from "./home-insights.module.css";

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);

  // weekEnd is exclusive in the backend, so show Sunday as the final day.
  end.setDate(end.getDate() - 1);

  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function formatPercentage(rate: number | null): string {
  if (rate === null) {
    return "No data";
  }

  return `${Math.round(rate * 100)}%`;
}

export function HomeInsights() {
  const recommendationsQuery = useQuery({
    queryKey: ["recommendations"],
    queryFn: getRecommendations,
  });

  const weeklyAnalyticsQuery = useQuery({
    queryKey: ["analytics", "weekly"],
    queryFn: getWeeklyAnalytics,
  });

  const recommendationMetricsQuery = useQuery({
    queryKey: ["recommendations", "metrics"],
    queryFn: getRecommendationMetrics,
  });

  const weeklyAnalytics = weeklyAnalyticsQuery.data;
  const recommendationMetrics = recommendationMetricsQuery.data;

  return (
    <section className={styles.insights} aria-label="Listening insights">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>YOUR LISTENING SIGNAL</p>
          <h2>Built from your real activity</h2>
        </div>
      </div>

      <div className={styles.insightGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>THIS WEEK</p>
              <h3>Listening activity</h3>
            </div>

            {weeklyAnalytics ? (
              <span className={styles.period}>
                {formatWeekRange(
                  weeklyAnalytics.weekStart,
                  weeklyAnalytics.weekEnd
                )}
              </span>
            ) : null}
          </div>

          {weeklyAnalyticsQuery.isLoading ? (
            <p className={styles.mutedText}>Loading weekly activity...</p>
          ) : weeklyAnalyticsQuery.error ? (
            <p className={styles.errorText}>
              {weeklyAnalyticsQuery.error.message}
            </p>
          ) : weeklyAnalytics ? (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.metric}>
                  <strong>{weeklyAnalytics.summary.plays}</strong>
                  <span>Plays</span>
                </div>

                <div className={styles.metric}>
                  <strong>{weeklyAnalytics.summary.completes}</strong>
                  <span>Completed</span>
                </div>

                <div className={styles.metric}>
                  <strong>{weeklyAnalytics.summary.favorites}</strong>
                  <span>Favorites</span>
                </div>

                <div className={styles.metric}>
                  <strong>{weeklyAnalytics.summary.skips}</strong>
                  <span>Skipped</span>
                </div>
              </div>

              {weeklyAnalytics.topGenres.length > 0 ? (
                <div className={styles.topSignal}>
                  <span>Top genre</span>
                  <strong>{weeklyAnalytics.topGenres[0].genre}</strong>
                </div>
              ) : (
                <p className={styles.mutedText}>
                  Start listening to build your weekly profile.
                </p>
              )}
            </>
          ) : null}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>RECOMMENDATIONS</p>
              <h3>Genres for you</h3>
            </div>
          </div>

          {recommendationsQuery.isLoading ? (
            <p className={styles.mutedText}>Reading your listening signals...</p>
          ) : recommendationsQuery.error ? (
            <p className={styles.errorText}>
              {recommendationsQuery.error.message}
            </p>
          ) : recommendationsQuery.data?.length ? (
            <div className={styles.recommendationList}>
              {recommendationsQuery.data.map((recommendation) => (
                <article
                  key={recommendation.genre}
                  className={styles.recommendation}
                >
                  <strong>{recommendation.genre}</strong>
                  <p>{recommendation.reason}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.mutedText}>
              No recommendation signals yet. Favorite tracks and listen to
              previews to start building your profile.
            </p>
          )}
        </article>
      </div>

      <article className={styles.feedbackPanel}>
        <div>
          <p className={styles.panelEyebrow}>RECOMMENDATION FEEDBACK</p>
          <h3>How recommendations perform</h3>
        </div>

        {recommendationMetricsQuery.isLoading ? (
          <p className={styles.mutedText}>Loading recommendation metrics...</p>
        ) : recommendationMetricsQuery.error ? (
          <p className={styles.errorText}>
            {recommendationMetricsQuery.error.message}
          </p>
        ) : recommendationMetrics &&
          recommendationMetrics.recommendationPlayCount > 0 ? (
          <div className={styles.feedbackGrid}>
            <div className={styles.feedbackMetric}>
              <span>Recommendation plays</span>
              <strong>{recommendationMetrics.recommendationPlayCount}</strong>
            </div>

            <div className={styles.feedbackMetric}>
              <span>Favorite rate</span>
              <strong>
                {formatPercentage(
                  recommendationMetrics.recommendationFavoriteRate
                )}
              </strong>
            </div>

            <div className={styles.feedbackMetric}>
              <span>Completion rate</span>
              <strong>
                {formatPercentage(
                  recommendationMetrics.recommendationCompleteRate
                )}
              </strong>
            </div>

            <div className={styles.feedbackMetric}>
              <span>Skip rate</span>
              <strong>
                {formatPercentage(recommendationMetrics.recommendationSkipRate)}
              </strong>
            </div>
          </div>
        ) : (
          <p className={styles.mutedText}>
            No recommendation interactions recorded yet. This metric becomes
            available when tracks are played with source: recommendation.
          </p>
        )}
      </article>
    </section>
  );
}
