import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { prisma } from "./lib/prisma.js";
import authRouter from "./routes/auth.routes.js";
import searchRouter from "./routes/search.routes.js";
import favoritesRouter from "./routes/favorites.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import playlistsRouter from "./routes/playlists.routes.js";
import journalRouter from "./routes/journal.routes.js";
import recommendationsRouter from "./routes/recommendations.routes.js";
dotenv.config({ override: true});

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api", searchRouter);
app.use("/api", favoritesRouter);
app.use("/api", playlistsRouter);
app.use("/api", journalRouter);
app.use("/api", recommendationsRouter);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "soundwave-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/db-check", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`SoundWave API running on http://localhost:${PORT}`);
});