import { Router } from "express";
import type { Request, Response } from "express";
import { EventType } from "../generated/prisma/enums.js";
import { requiresAuth } from "../middleware/auth.middleware.js";
import { journalService } from "../services/journal.service.js";
import { getUserId } from "../lib/route-helpers.js";
import { trackMetadataService } from "../services/track-metadata.service.js";

const router = Router();
const ALLOWED_SOURCES = ["search", "recommendation", "playlist", "favorite"] as const;



router.post("/journal/events", requiresAuth, async (req: Request, res: Response) => {
  const userId = getUserId(res);
    const { sessionId, deezerTrackId, genre, eventType, completionPct, source } =
    req.body as Record<string, unknown>;

  const normalizedGenre = typeof genre === "string" ? genre.trim() : "";
  const normalizedSource = typeof source === "string" ? source.trim().toLowerCase() : "";

  const isValidSource = ALLOWED_SOURCES.includes(
    normalizedSource as (typeof ALLOWED_SOURCES)[number]
  );

    if (
       typeof deezerTrackId !== "number" ||
    !Number.isInteger(deezerTrackId) ||
    deezerTrackId <= 0 ||
    !isValidSource ||
    !Object.values(EventType).includes(eventType as EventType)
  ) {
    res.status(400).json({ error: "Invalid journal event payload" });
    return;
  }

  if (
    typeof completionPct !== "undefined" &&
    (typeof completionPct !== "number" ||
      !Number.isInteger(completionPct) ||
      completionPct < 0 ||
      completionPct > 100)
  ) {
    res.status(400).json({ error: "completionPct must be an integer between 0 and 100" });
    return;
  } try {

       const metadata = await trackMetadataService.resolveTrackMetadata(
      userId,
      deezerTrackId,
      normalizedGenre || undefined,
    );
    
    const event = await journalService.logTrackEvent(userId, {
      ...(typeof sessionId === "string" && sessionId.trim() ? { sessionId: sessionId.trim() } : {}),
      deezerTrackId,
      trackTitle: metadata.trackTitle,
      artistName: metadata.artistName,
      genre: metadata.genre,
      eventType: eventType as EventType,
      ...(typeof completionPct === "number" ? { completionPct } : {}),
      source: normalizedSource,
    });

    res.status(201).json(event);
  } catch (error) {
    if (error instanceof Error && error.message === "SESSION_NOT_FOUND") {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (error instanceof Error && error.message === "SESSION_ALREADY_ENDED") {
      res.status(409).json({ error: "Session already ended" });
      return;
    }

    throw error;
  }

});


router.post("/journal/sessions", requiresAuth, async (req: Request, res: Response) => {
  const userId = getUserId(res);
  const { label } = req.body as Record<string, unknown>;

  const normalizedLabel = typeof label === "string" && label.trim() ? label.trim() : undefined;

  const session = await journalService.startListeningSession(userId, {
    ...(normalizedLabel ? { label: normalizedLabel } : {}),
  });

  res.status(201).json(session);
});

router.patch("/journal/sessions/:id/end", requiresAuth, async (req: Request, res: Response) => {
  const userId = getUserId(res);
  const sessionId = req.params.id;

  if (typeof sessionId !== "string" || !sessionId.trim()) {
    res.status(400).json({ error: "Session id is required" });
    return;
  }

  try {
    const session = await journalService.endListeningSession(userId, sessionId);
    res.json(session);
  } catch (error) {
    if (error instanceof Error && error.message === "SESSION_NOT_FOUND") {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (error instanceof Error && error.message === "SESSION_ALREADY_ENDED") {
      res.status(409).json({ error: "Session already ended" });
      return;
    }
    throw error;
  }
});

router.get("/journal/recent", requiresAuth, async(req: Request, res: Response)=>{
  const userId = getUserId(res);
  const limitParam = req.query.limit;
  const limit = 
  typeof limitParam === "string" && Number.isInteger(Number(limitParam)) && Number(limitParam) > 0 ? Number(limitParam) : 20;

  const events = await journalService.getRecentEvents(userId, limit);
  res.json({ events });
});

router.get("/journal/insights", requiresAuth, async (_req: Request, res: Response) =>{
  const userId = getUserId(res);
  const insights = await journalService.getJournalInsights(userId);
  res.json(insights);
});

router.get("/journal/time-patterns", requiresAuth, async(_req: Request, res: Response)=>{
  const userId = getUserId(res);
  const patterns = await journalService.getTimePatterns(userId);
  res.json(patterns);
});

router.get("/journal/streaks", requiresAuth, async (_req: Request, res: Response) => {
  const userId = getUserId(res);
  const streaks = await journalService.getStreaks(userId);
  res.json(streaks);
});





export default router;