"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import {
  getRateLimitComparison,
  getRateLimitStatus,
  type RateLimitPolicyName,
  type RateLimitPolicyStatus,
} from "../../lib/api/rate-limit";
import { formatClockTime } from "../../lib/format";
import styles from "./rate-limit-dashboard.module.css";

const policyLabels: Record<RateLimitPolicyName, string> = {
  public: "Public requests",
  authWrite: "Auth writes",
  refresh: "Refresh requests",
};

function formatWindow(windowMs: number): string {
  const minutes = windowMs / 60_000;

  if (Number.isInteger(minutes) && minutes >= 1) {
    return `${minutes} min`;
  }

  return `${windowMs / 1_000} sec`;
}

function PolicyCard({ policy }: { policy: RateLimitPolicyStatus }) {
  const usagePercent =
    policy.limit === 0
      ? 0
      : Math.min((policy.used / policy.limit) * 100, 100);
  const isHot = usagePercent >= 80;

  return (
    <article className={styles.policyCard}>
      <div className={styles.policyHeader}>
        <div>
          <p className={styles.policyName}>{policyLabels[policy.name]}</p>
          <p className={styles.policyLimit}>
            {policy.limit} requests / {formatWindow(policy.windowMs)}
          </p>
        </div>

        <span className={`${styles.remaining} ${isHot ? styles.remainingHot : ""}`}>
          {policy.remaining} left
        </span>
      </div>

      <div
        className={styles.meter}
        role="meter"
        aria-label={`${policyLabels[policy.name]} usage`}
        aria-valuemin={0}
        aria-valuemax={policy.limit}
        aria-valuenow={policy.used}
      >
        <div
          className={`${styles.meterFill} ${isHot ? styles.meterFillHot : ""}`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      <div className={styles.policyFooter}>
        <span>{policy.used} used</span>
        <span>Resets {formatClockTime(policy.resetAt)}</span>
      </div>
    </article>
  );
}

export function RateLimitDashboard() {
  const [selectedPolicy, setSelectedPolicy] =
    useState<RateLimitPolicyName>("public");

  const statusQuery = useQuery({
    queryKey: ["rate-limit", "status"],
    queryFn: getRateLimitStatus,
  });

  const comparisonQuery = useQuery({
    queryKey: ["rate-limit", "comparison", selectedPolicy],
    queryFn: () => getRateLimitComparison(selectedPolicy),
  });

  const comparison = comparisonQuery.data;
  const isRefreshing = statusQuery.isFetching || comparisonQuery.isFetching;

  function refreshDiagnostics() {
    void statusQuery.refetch();
    void comparisonQuery.refetch();
  }

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Observed diagnostics</p>
            <h3 className={styles.panelTitle}>Rate limit activity (approximate)</h3>
            <p className={styles.lead}>
              These numbers come from an in-memory counter that runs alongside
              the real <code>express-rate-limit</code> enforcement, for your IP
              in this process. It is an approximate mirror, not the
              authoritative state that decides whether a request is blocked, and
              it can drift slightly from the real enforcement.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshDiagnostics}
            disabled={isRefreshing}
            className={styles.refreshButton}
          >
            <RefreshCw size={14} className={isRefreshing ? styles.spinning : undefined} />
            {isRefreshing ? "Refreshing..." : "Refresh diagnostics"}
          </button>
        </div>

        {statusQuery.isLoading ? (
          <p className={styles.muted}>Loading status...</p>
        ) : statusQuery.error ? (
          <div className={styles.errorBanner} role="alert">
            {statusQuery.error.message}
          </div>
        ) : (
          <>
            <p className={styles.subject}>
              Subject: <code>{statusQuery.data?.subject.id ?? "unknown IP"}</code> ·
              Updated{" "}
              {statusQuery.data
                ? formatClockTime(statusQuery.data.generatedAt)
                : "unknown"}
            </p>

            <div className={styles.policyGrid}>
              {statusQuery.data?.policies.map((policy) => (
                <PolicyCard key={policy.name} policy={policy} />
              ))}
            </div>
          </>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Conceptual comparison</p>
            <h3 className={styles.panelTitle}>Fixed window vs sliding window</h3>
          </div>

          <label className={styles.selectLabel}>
            Policy
            <select
              value={selectedPolicy}
              onChange={(event) =>
                setSelectedPolicy(event.target.value as RateLimitPolicyName)
              }
              className={styles.select}
            >
              {Object.entries(policyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {comparisonQuery.isLoading ? (
          <p className={styles.muted}>Loading comparison...</p>
        ) : comparisonQuery.error ? (
          <div className={styles.errorBanner} role="alert">
            {comparisonQuery.error.message}
          </div>
        ) : comparison ? (
          <>
            <div className={styles.runtimeCard}>
              <p className={styles.runtimeTitle}>
                Current runtime: {comparison.currentImplementation.algorithm}
              </p>
              <p className={styles.runtimeText}>
                {comparison.portfolioPositioning.today}
              </p>

              <ul className={styles.limitations}>
                {comparison.currentImplementation.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>

            <div className={styles.compareGrid}>
              <article className={`${styles.compareCard} ${styles.compareCardActive}`}>
                <p className={styles.compareTitle}>
                  <span className={styles.statusDot} aria-hidden="true" />
                  Fixed window · active now
                </p>
                <p className={styles.compareText}>
                  {comparison.conceptualComparison.fixedWindow.summary}
                </p>
                <p className={styles.compareFigure}>
                  Accepted around boundary:{" "}
                  <strong>
                    {comparison.conceptualComparison.fixedWindow.example.totalAcceptedAcrossBoundary}
                  </strong>
                </p>
                <p className={styles.compareNote}>
                  {comparison.conceptualComparison.fixedWindow.example.burstRisk}
                </p>
              </article>

              <article className={styles.compareCard}>
                <p className={styles.compareTitle}>Sliding window · planned upgrade</p>
                <p className={styles.compareText}>
                  {comparison.conceptualComparison.slidingWindow.summary}
                </p>
                <p className={styles.compareFigure}>
                  Accepted around boundary:{" "}
                  <strong>
                    {comparison.conceptualComparison.slidingWindow.example.totalAcceptedAcrossBoundary}
                  </strong>
                </p>
                <p className={styles.compareNote}>
                  {comparison.conceptualComparison.slidingWindow.example.burstRisk}
                </p>
              </article>
            </div>

            <p className={styles.nextStep}>
              Next technical step: {comparison.portfolioPositioning.nextStep}
            </p>
          </>
        ) : null}
      </section>
    </div>
  );
}
