import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";

/**
 * MVP note:
 * This uses the default in-memory store from express-rate-limit.
 * It is acceptable for local development and a single API instance.
 *
 * If the app scales to multiple instances, this must move to a shared store
 * such as Redis so rate limits remain consistent across replicas.
 */

export const RATE_LIMIT_POLICIES = {
  authWrite: {
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: { error: "Too many attempts, please try again later" },
  },
  refresh: {
    windowMs: 15 * 60 * 1000,
    limit: 30,
    message: { error: "Too many refresh attempts, please try again later" },
  },
  public: {
    windowMs: 60 * 1000,
    limit: 60,
    message: { error: "Too many requests, please try again later" },
  },
} as const;

type PolicyName = keyof typeof RATE_LIMIT_POLICIES;

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitStatusSnapshot {
  name: PolicyName;
  windowMs: number;
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
}

const diagnosticsStore = new Map<string, RateLimitEntry>();

function buildDiagnosticsKey(policyName: PolicyName, subject: string): string {
  return `${policyName}:${subject}`;
}

function pruneExpiredTimestamps(
  timestamps: number[],
  windowMs: number,
  now: number
): number[] {
  return timestamps.filter((timestamp) => now - timestamp < windowMs);
}

function recordRateLimitHit(
  policyName: PolicyName,
  subject: string,
  now = Date.now()
): void {
  const policy = RATE_LIMIT_POLICIES[policyName];
  const key = buildDiagnosticsKey(policyName, subject);
  const current = diagnosticsStore.get(key);

  const activeTimestamps = pruneExpiredTimestamps(
    current?.timestamps ?? [],
    policy.windowMs,
    now
  );

  activeTimestamps.push(now);

  diagnosticsStore.set(key, {
    timestamps: activeTimestamps,
  });
}

function getPolicyStatus(
  policyName: PolicyName,
  subject: string,
  now = Date.now()
): RateLimitStatusSnapshot {
  const policy = RATE_LIMIT_POLICIES[policyName];
  const key = buildDiagnosticsKey(policyName, subject);
  const current = diagnosticsStore.get(key);

  const activeTimestamps = pruneExpiredTimestamps(
    current?.timestamps ?? [],
    policy.windowMs,
    now
  );

  diagnosticsStore.set(key, {
    timestamps: activeTimestamps,
  });

  const used = activeTimestamps.length;
  const remaining = Math.max(policy.limit - used, 0);
  const oldestTimestamp = activeTimestamps[0] ?? now;
  const resetAt = new Date(oldestTimestamp + policy.windowMs).toISOString();

  return {
    name: policyName,
    windowMs: policy.windowMs,
    limit: policy.limit,
    used,
    remaining,
    resetAt,
  };
}

export function getRateLimitStatusForSubject(subject: string) {
  const policyNames = Object.keys(RATE_LIMIT_POLICIES) as PolicyName[];

  return {
    generatedAt: new Date().toISOString(),
    policies: policyNames.map((policyName) =>
      getPolicyStatus(policyName, subject)
    ),
  };
}

function createRateLimitDiagnosticsMiddleware(policyName: PolicyName) {
  return (req: Request, _res: Response, next: NextFunction) => {
    recordRateLimitHit(policyName, req.ip ?? "unknown");
    next();
  };
}

export const authWriteDiagnostics =
  createRateLimitDiagnosticsMiddleware("authWrite");

export const refreshDiagnostics =
  createRateLimitDiagnosticsMiddleware("refresh");

export const publicDiagnostics =
  createRateLimitDiagnosticsMiddleware("public");

export const authWriteLimiter = rateLimit({
  windowMs: RATE_LIMIT_POLICIES.authWrite.windowMs,
  limit: RATE_LIMIT_POLICIES.authWrite.limit,
  standardHeaders: true,
  legacyHeaders: false,
  message: RATE_LIMIT_POLICIES.authWrite.message,
});

export const refreshLimiter = rateLimit({
  windowMs: RATE_LIMIT_POLICIES.refresh.windowMs,
  limit: RATE_LIMIT_POLICIES.refresh.limit,
  standardHeaders: true,
  legacyHeaders: false,
  message: RATE_LIMIT_POLICIES.refresh.message,
});

export const publicLimiter = rateLimit({
  windowMs: RATE_LIMIT_POLICIES.public.windowMs,
  limit: RATE_LIMIT_POLICIES.public.limit,
  standardHeaders: true,
  legacyHeaders: false,
  message: RATE_LIMIT_POLICIES.public.message,
});