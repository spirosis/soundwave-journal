import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { GenreSource } from "../generated/prisma/enums.js";
import { appEnv } from "../lib/env.js";

/**
 * Seeds a stable fixture user with track_metadata already resolved for the
 * Queen track used by favorites-flow.spec.ts. Run before Playwright (both in
 * CI and locally) so that POST /favorites never has to call Deezer to resolve
 * metadata for a track the fixture user has never interacted with before.
 */

export const FIXTURE_USER_EMAIL = "e2e-fixture@example.com";
export const FIXTURE_USER_PASSWORD = "FixtureUser123";

export const FIXTURE_TRACK = {
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
};

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for E2E fixtures");
  }

  const databaseName = new URL(databaseUrl).pathname.slice(1);

  if (appEnv !== "test" || databaseName !== "soundwave_journal_test") {
    throw new Error(
      "E2E fixtures may only run with NODE_ENV=test against soundwave_journal_test",
    );
  }

  const passwordHash = await bcrypt.hash(FIXTURE_USER_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: FIXTURE_USER_EMAIL },
    create: {
      email: FIXTURE_USER_EMAIL,
      passwordHash,
      displayName: "E2E Fixture",
    },
    update: {
      passwordHash,
    },
  });

  // Previous runs may have favorited/unfavorited this track; start each run
  // from a known state rather than assuming the last run's leftovers.
  await prisma.favorite.deleteMany({
    where: { userId: user.id },
  });

  await prisma.trackMetadata.upsert({
    where: {
      userId_deezerTrackId: {
        userId: user.id,
        deezerTrackId: FIXTURE_TRACK.deezerTrackId,
      },
    },
    create: {
      userId: user.id,
      deezerTrackId: FIXTURE_TRACK.deezerTrackId,
      trackTitle: FIXTURE_TRACK.trackTitle,
      artistName: FIXTURE_TRACK.artistName,
      albumTitle: FIXTURE_TRACK.albumTitle,
      albumCoverUrl: FIXTURE_TRACK.albumCoverUrl,
      previewUrl: FIXTURE_TRACK.previewUrl,
      deezerUrl: FIXTURE_TRACK.deezerUrl,
      genre: FIXTURE_TRACK.genre,
      genreSource: GenreSource.MANUAL,
    },
    update: {
      trackTitle: FIXTURE_TRACK.trackTitle,
      artistName: FIXTURE_TRACK.artistName,
      albumTitle: FIXTURE_TRACK.albumTitle,
      albumCoverUrl: FIXTURE_TRACK.albumCoverUrl,
      previewUrl: FIXTURE_TRACK.previewUrl,
      deezerUrl: FIXTURE_TRACK.deezerUrl,
      genre: FIXTURE_TRACK.genre,
      genreSource: GenreSource.MANUAL,
    },
  });

  console.log(
    `Seeded E2E fixture user ${FIXTURE_USER_EMAIL} (id=${user.id}) with local track_metadata for deezerTrackId=${FIXTURE_TRACK.deezerTrackId}.`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
