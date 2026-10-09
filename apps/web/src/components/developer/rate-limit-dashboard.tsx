"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getRateLimitComparison,
  getRateLimitStatus,
  type RateLimitPolicyName,
  type RateLimitPolicyStatus,
} from "../../lib/api/rate-limit";

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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function PolicyCard({ policy }: { policy: RateLimitPolicyStatus }) {
  const usagePercent =
    policy.limit === 0
      ? 0
      : Math.min((policy.used / policy.limit) * 100, 100);

  return (
    <article className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-stone-950">
            {policyLabels[policy.name]}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {policy.limit} requests / {formatWindow(policy.windowMs)}
          </p>
        </div>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-700">
          {policy.remaining} left
        </span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width]"
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-stone-600">
        <span>{policy.used} used</span>
        <span>Resets {formatDate(policy.resetAt)}</span>
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

  function refreshDiagnostics() {
    void statusQuery.refetch();
    void comparisonQuery.refetch();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Observed diagnostics
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Rate limit activity (approximate)
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
              Estos números vienen de un contador en memoria que corre en
              paralelo al limiter real de express-rate-limit, para tu IP en
              este proceso. Es un diagnóstico aproximado, no el estado
              autoritativo que decide si una request se bloquea — puede
              divergir levemente del enforcement real.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshDiagnostics}
            disabled={statusQuery.isFetching || comparisonQuery.isFetching}
            className="rounded-xl bg-stone-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {statusQuery.isFetching || comparisonQuery.isFetching
              ? "Refreshing..."
              : "Refresh diagnostics"}
          </button>
        </div>

        {statusQuery.isLoading ? (
          <p className="mt-6 text-sm text-stone-600">Loading status...</p>
        ) : statusQuery.error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {statusQuery.error.message}
          </div>
        ) : (
          <>
            <p className="mt-6 text-xs text-stone-500">
              Subject: {statusQuery.data?.subject.id ?? "unknown IP"} · Updated{" "}
              {statusQuery.data
                ? formatDate(statusQuery.data.generatedAt)
                : "unknown"}
            </p>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {statusQuery.data?.policies.map((policy) => (
                <PolicyCard key={policy.name} policy={policy} />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              Conceptual comparison
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Fixed window vs sliding window
            </h3>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">
            Policy
            <select
              value={selectedPolicy}
              onChange={(event) =>
                setSelectedPolicy(event.target.value as RateLimitPolicyName)
              }
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-950"
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
          <p className="mt-6 text-sm text-stone-600">
            Loading comparison...
          </p>
        ) : comparisonQuery.error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {comparisonQuery.error.message}
          </div>
        ) : comparison ? (
          <>
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-950">
                Current runtime: {comparison.currentImplementation.algorithm}
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-900">
                {comparison.portfolioPositioning.today}
              </p>

              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-emerald-900/80">
                {comparison.currentImplementation.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-stone-200 p-5">
                <p className="text-sm font-semibold text-stone-950">
                  Fixed window: active now
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {comparison.conceptualComparison.fixedWindow.summary}
                </p>
                <p className="mt-4 text-sm font-medium text-stone-800">
                  Accepted around boundary:{" "}
                  {
                    comparison.conceptualComparison.fixedWindow.example
                      .totalAcceptedAcrossBoundary
                  }
                </p>
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  {
                    comparison.conceptualComparison.fixedWindow.example
                      .burstRisk
                  }
                </p>
              </article>

              <article className="rounded-2xl border border-stone-200 p-5">
                <p className="text-sm font-semibold text-stone-950">
                  Sliding window: planned upgrade
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {comparison.conceptualComparison.slidingWindow.summary}
                </p>
                <p className="mt-4 text-sm font-medium text-stone-800">
                  Accepted around boundary:{" "}
                  {
                    comparison.conceptualComparison.slidingWindow.example
                      .totalAcceptedAcrossBoundary
                  }
                </p>
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  {
                    comparison.conceptualComparison.slidingWindow.example
                      .burstRisk
                  }
                </p>
              </article>
            </div>

            <p className="mt-6 text-sm leading-6 text-stone-600">
              Next technical step: {comparison.portfolioPositioning.nextStep}
            </p>
          </>
        ) : null}
      </section>
    </div>
  );
}