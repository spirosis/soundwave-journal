import bcrypt from "bcryptjs";
import { EventType, GenreSource } from "../generated/prisma/enums.js";
import { appEnv } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";

const DEMO_USER_EMAIL = "demo@soundwave-journal.app";
const DEMO_USER_DISPLAY_NAME = "Soundwave Demo";

// Replace these two placeholders only after provisioning the production database.
// Host and database name are not secrets; they are an explicit safety allowlist.
const EXPECTED_DATABASE_HOST = "replace-with-production-database-host";
const EXPECTED_DATABASE_NAME = "replace-with-production-database-name";

const DEMO_TRACKS = [
  {
    deezerTrackId: 4091937401n,
    trackTitle: "Bohemian Rhapsody",
    artistName: "Queen",
    albumTitle: "A Night At The Opera",
    albumCoverUrl:
      "https://cdn-images.dzcdn.net/images/cover/0b56f4eee05fa1ea753c5654b2cdb70c/500x500-000000-80-0-0.jpg",
    previewUrl:
      "https://cdnt-preview.dzcdn.net/api/1/1/5/f/9/0/5f9a6a2ea1876e6d07c4b7feefa99951.mp3",
    deezerUrl: "https://www.deezer.com/track/4091937401",
    genre: "rock",
    durationSec: 354,
  },
  {
    deezerTrackId: 3135556n,
    trackTitle: "Get Lucky",
    artistName: "Daft Punk",
    albumTitle: "Random Access Memories",
    albumCoverUrl: null,
    previewUrl: null,
    deezerUrl: "https://www.deezer.com/track/3135556",
    genre: "electronic",
    durationSec: 248,
  },
  {
    deezerTrackId: 2215315187n,
    trackTitle: "Creep (Acoustic)",
    artistName: "Radiohead",
    albumTitle: "Acoustic Sessions",
    albumCoverUrl: null,
    previewUrl: null,
    deezerUrl: "https://www.deezer.com/track/2215315187",
    genre: "alternative",
    durationSec: 238,
  },
] as const;

type DemoTrack = (typeof DEMO_TRACKS)[number];

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for the demo seed`);
  }

  return value;
}

function getDemoEvent(
  track: DemoTrack,
  daysAgo: number,
  hour: number,
  eventType: EventType,
  completionPct: number,
) {
  const createdAt = new Date();

  createdAt.setDate(createdAt.getDate() - daysAgo);
  createdAt.setHours(hour, 0, 0, 0);

  return {
    deezerTrackId: track.deezerTrackId,
    trackTitle: track.trackTitle,
    artistName: track.artistName,
    genre: track.genre,
    eventType,
    completionPct,
    source: "search",
    hourOfDay: createdAt.getHours(),
    dayOfWeek: createdAt.getDay(),
    createdAt,
  };
}

function assertSafeEnvironment(): void {
  const databaseUrl = getRequiredEnv("DATABASE_URL");
  const parsedUrl = new URL(databaseUrl);

  if (process.env.CI) {
    throw new Error("Demo seed must never run in CI");
  }

  if (appEnv !== "production") {
    throw new Error("Demo seed may only run with NODE_ENV=production");
  }

  if (
    EXPECTED_DATABASE_HOST.startsWith("replace-") ||
    EXPECTED_DATABASE_NAME.startsWith("replace-")
  ) {
    throw new Error(
      "Set EXPECTED_DATABASE_HOST and EXPECTED_DATABASE_NAME before running the demo seed",
    );
  }

  if (
    parsedUrl.hostname !== EXPECTED_DATABASE_HOST ||
    parsedUrl.pathname.slice(1) !== EXPECTED_DATABASE_NAME
  ) {
    throw new Error(
      "DATABASE_URL does not match the explicitly allowed demo database target",
    );
  }

  if (process.env.RUN_DEMO_SEED !== "confirm-soundwave-demo") {
    throw new Error(
      "Set RUN_DEMO_SEED=confirm-soundwave-demo to run the demo seed",
    );
  }
}

async function main(): Promise<void> {
  assertSafeEnvironment();

  const password = getRequiredEnv("DEMO_USER_PASSWORD");
  const passwordHash = await bcrypt.hash(password, 10);

  const demoUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email: DEMO_USER_EMAIL },
      create: {
        email: DEMO_USER_EMAIL,
        passwordHash,
        displayName: DEMO_USER_DISPLAY_NAME,
        isPublic: false,
      },
      update: {
        passwordHash,
        displayName: DEMO_USER_DISPLAY_NAME,
        isPublic: false,
      },
    });

    // Reset only this account. No other user or global catalog data is touched.
    await tx.trackEvent.deleteMany({ where: { userId: user.id } });
    await tx.listeningSession.deleteMany({ where: { userId: user.id } });
    await tx.favorite.deleteMany({ where: { userId: user.id } });
    await tx.playlist.deleteMany({ where: { userId: user.id } });
    await tx.trackMetadata.deleteMany({ where: { userId: user.id } });
    await tx.refreshSession.deleteMany({ where: { userId: user.id } });

    await tx.trackMetadata.createMany({
      data: DEMO_TRACKS.map((track) => ({
        userId: user.id,
        deezerTrackId: track.deezerTrackId,
        trackTitle: track.trackTitle,
        artistName: track.artistName,
        albumTitle: track.albumTitle,
        albumCoverUrl: track.albumCoverUrl,
        previewUrl: track.previewUrl,
        deezerUrl: track.deezerUrl,
        genre: track.genre,
        genreSource: GenreSource.MANUAL,
      })),
    });

    await tx.favorite.createMany({
      data: DEMO_TRACKS.map((track) => ({
        userId: user.id,
        deezerTrackId: track.deezerTrackId,
        trackTitle: track.trackTitle,
        artistName: track.artistName,
        albumCoverUrl: track.albumCoverUrl,
        previewUrl: track.previewUrl,
        genre: track.genre,
      })),
    });

    await tx.playlist.create({
      data: {
        userId: user.id,
        name: "Interview highlights",
        tracks: {
          create: [DEMO_TRACKS[0], DEMO_TRACKS[1]].map((track, index) => ({
            deezerTrackId: track.deezerTrackId,
            trackTitle: track.trackTitle,
            artistName: track.artistName,
            albumCoverUrl: track.albumCoverUrl,
            previewUrl: track.previewUrl,
            durationSec: track.durationSec,
            position: index + 1,
          })),
        },
      },
    });

    await tx.playlist.create({
      data: {
        userId: user.id,
        name: "Late-night rotation",
        tracks: {
          create: [DEMO_TRACKS[2], DEMO_TRACKS[0]].map((track, index) => ({
            deezerTrackId: track.deezerTrackId,
            trackTitle: track.trackTitle,
            artistName: track.artistName,
            albumCoverUrl: track.albumCoverUrl,
            previewUrl: track.previewUrl,
            durationSec: track.durationSec,
            position: index + 1,
          })),
        },
      },
    });

    const events = [
      getDemoEvent(DEMO_TRACKS[0], 0, 21, EventType.PLAY, 100),
      getDemoEvent(DEMO_TRACKS[0], 0, 21, EventType.COMPLETE, 100),
      getDemoEvent(DEMO_TRACKS[1], 1, 21, EventType.PLAY, 92),
      getDemoEvent(DEMO_TRACKS[1], 1, 21, EventType.COMPLETE, 100),
      getDemoEvent(DEMO_TRACKS[2], 2, 22, EventType.PLAY, 65),
      getDemoEvent(DEMO_TRACKS[2], 2, 22, EventType.SKIP, 65),
      getDemoEvent(DEMO_TRACKS[0], 3, 21, EventType.PLAY, 100),
      getDemoEvent(DEMO_TRACKS[0], 3, 21, EventType.COMPLETE, 100),
      getDemoEvent(DEMO_TRACKS[1], 6, 20, EventType.PLAY, 100),
      getDemoEvent(DEMO_TRACKS[1], 6, 20, EventType.COMPLETE, 100),
      getDemoEvent(DEMO_TRACKS[0], 9, 21, EventType.FAVORITE, 0),
      getDemoEvent(DEMO_TRACKS[2], 12, 22, EventType.FAVORITE, 0),
    ];

    await tx.trackEvent.createMany({
      data: events.map((event) => ({
        userId: user.id,
        ...event,
      })),
    });

    return user;
  });

  console.log(
    `Demo account seeded: ${DEMO_USER_EMAIL} (id=${demoUser.id}).`,
  );
}

main()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
