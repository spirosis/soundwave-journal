import { prisma } from "../lib/prisma.js";
import { trackMetadataService } from "../services/track-metadata.service.js";

interface UserTrackPair {
  userId: string;
  deezerTrackId: number;
}

async function findMissingPairs(): Promise<UserTrackPair[]> {
  return prisma.$queryRaw<UserTrackPair[]>`
    SELECT DISTINCT combined."userId", combined."deezerTrackId"
    FROM (
      SELECT user_id AS "userId", deezer_track_id AS "deezerTrackId" FROM favorites
      UNION
      SELECT user_id AS "userId", deezer_track_id AS "deezerTrackId" FROM track_events
    ) combined
    LEFT JOIN track_metadata tm
      ON tm.user_id = combined."userId" AND tm.deezer_track_id = combined."deezerTrackId"
    WHERE tm.id IS NULL;
  `;
}

async function syncFavoritesGenre(): Promise<number> {
  const result = await prisma.$executeRaw`
    UPDATE favorites f
    SET genre = tm.genre
    FROM track_metadata tm
    WHERE f.user_id = tm.user_id
      AND f.deezer_track_id = tm.deezer_track_id
      AND f.genre IS DISTINCT FROM tm.genre;
  `;

  return result;
}

async function normalizeExistingTrackMetadataGenres(): Promise<number> {
  const result = await prisma.$executeRaw`
    UPDATE track_metadata
    SET genre = CASE
      WHEN BTRIM(genre) = '' then 'unknown'
      ELSE LOWER(BTRIM(genre))
    END;
  `;
  return result;
}


async function main() {
  const syncFavorites = process.argv.includes("--sync-favorites");

  const pairs = await findMissingPairs();
  console.log(`Encontradas ${pairs.length} combinaciones (userId, deezerTrackId) sin track_metadata.`);

  let created = 0;
  let notFound = 0;
  let failed = 0;

  for (const pair of pairs) {
    try {
      await trackMetadataService.resolveTrackMetadata(pair.userId, pair.deezerTrackId);
      created += 1;
    } catch (error) {
      if (error instanceof Error && error.message === "TRACK_NOT_FOUND") {
        notFound += 1;
        console.warn(`Track no encontrado en Deezer: deezerTrackId=${pair.deezerTrackId}`);
        continue;
      }

      failed += 1;
      console.error(
        `Error resolviendo userId=${pair.userId} deezerTrackId=${pair.deezerTrackId}:`,
        error,
      );
    }
  }

  // 1. crear faltantes
  // loop actual con resolveTrackMetadata()

  // 2. normalizar lo que ya existía
  const normalizedMetadata = await normalizeExistingTrackMetadataGenres();
  console.log(`Normalizados ${normalizedMetadata} registros existentes en track_metadata.` )

  console.log(`Backfill de track_metadata completo: ${created} creados, ${notFound} no encontrados en Deezer, ${failed} con error.`);

  // 3. sincronizar favorites desde la fuente canónica
  if (syncFavorites) {
    const updated = await syncFavoritesGenre();
    console.log(`Sincronizados ${updated} favoritos con genero "unknown" desde track_metadata.`);
  }
}

main()
  .catch((error) => {
    console.error("Backfill fallo:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
