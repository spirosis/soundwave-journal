import { Router } from "express";
import type { Request, Response } from "express";
import { requiresAuth } from "../middleware/auth.middleware.js";
import {
  getRateLimitStatusForSubject,
  RATE_LIMIT_POLICIES,
} from "../middleware/rate-limit.middleware.js";

const router = Router();

type ComparablePolicyName = "public" | "authWrite" | "refresh";

function isComparablePolicyName(value: string): value is ComparablePolicyName {
  return value === "public" || value === "authWrite" || value === "refresh";
}

function getComparePolicy(req: Request): ComparablePolicyName {
  const rawPolicy = req.query["policy"];

  if (typeof rawPolicy !== "string" || !rawPolicy.trim()) {
    return "public";
  }

  if (!isComparablePolicyName(rawPolicy)) {
    throw new Error("INVALID_RATE_LIMIT_POLICY");
  }

  return rawPolicy;
}

function buildFixedWindowTimeline(limit: number, windowMs: number) {
  return {
    requestPattern: [
      {
        atMs: windowMs - 1000,
        count: limit,
        note: "All allowed at the end of the current window",
      },
      {
        atMs: windowMs + 1000,
        count: limit,
        note: "All allowed again at the start of the next window",
      },
    ],
    totalAcceptedAcrossBoundary: limit * 2,
    burstRisk:
      "A client can send two bursts around the window boundary and still be accepted.",
  };
}

function buildSlidingWindowTimeline(limit: number, windowMs: number) {
  return {
    requestPattern: [
      {
        atMs: windowMs - 1000,
        count: limit,
        note: "The first burst fills the rolling window",
      },
      {
        atMs: windowMs + 1000,
        count: limit,
        note: "Most of the second burst would be rejected because the previous burst is still inside the last windowMs",
      },
    ],
    totalAcceptedAcrossBoundary: limit,
    burstRisk:
      "The previous burst still counts until each request naturally ages out of the rolling window.",
  };
}

router.get(
  "/rate-limit/status",
  requiresAuth,
  async (req: Request, res: Response) => {
    const snapshot = getRateLimitStatusForSubject(req.ip ?? "unknown");

    res.json({
      subject: {
        type: "ip",
        id: req.ip,
      },
      ...snapshot,
    });
  }
);

router.get(
  "/rate-limit/compare",
  requiresAuth,
  async (req: Request, res: Response) => {
    let policyName: ComparablePolicyName;

    try {
      policyName = getComparePolicy(req);
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_RATE_LIMIT_POLICY") {
        res.status(400).json({
          error: "Invalid policy. Use one of: public, authWrite, refresh",
        });
        return;
      }

      throw error;
    }

    const policy = RATE_LIMIT_POLICIES[policyName];

    res.json({
      generatedAt: new Date().toISOString(),
      comparedPolicy: {
        name: policyName,
        windowMs: policy.windowMs,
        limit: policy.limit,
      },
      currentImplementation: {
        algorithm: "fixed-window",
        runtime: "express-rate-limit",
        store: "in-memory",
        activeInProductionToday: true,
        strengths: [
          "Simple to implement",
          "Low runtime complexity for MVP",
          "Good enough for a single API instance",
        ],
        limitations: [
          "Allows burstiness near window boundaries",
          "State is not shared across multiple replicas",
          "Current diagnostics are per-process memory only",
        ],
      },
      conceptualComparison: {
        fixedWindow: {
          summary:
            "Counts requests inside discrete windows that reset all at once.",
          example: buildFixedWindowTimeline(policy.limit, policy.windowMs),
        },
        slidingWindow: {
          summary:
            "Counts requests over the last rolling windowMs interval at every request time.",
          example: buildSlidingWindowTimeline(policy.limit, policy.windowMs),
        },
      },
      portfolioPositioning: {
        today:
          "The project currently enforces fixed-window rate limiting and exposes live diagnostics for the active process.",
        nextStep:
          "Sliding window is the planned algorithm upgrade for stricter burst control without changing the public API contract.",
      },
    });
  }
);

export default router;