import rateLimit from "express-rate-limit";

/**
 * MVP note:
 * This uses the default in-memory store from express-rate-limit.
 * It is acceptable for local development and a single API instance.
 * *
 * If the app scales to multiple instances, this must move to a shared store
 * such as Redis so rate limits remain consistent across replicas.
 */

export const authWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many refresh attempts, please try again later"}

})

export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});