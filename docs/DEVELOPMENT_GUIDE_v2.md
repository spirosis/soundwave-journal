# SoundWave Journal - Development Guide v2

> Music discovery + listening analytics con recomendaciones explicables.
> No es un player generico. Es una app que te muestra que escuchas, cuando lo escuchas y por que te gusta, y usa esas senales para descubrirte musica nueva con razones claras.

---

## Veredicto de revision

Si, este documento **cumple en gran parte con lo propuesto**, pero necesitaba ajustes para quedar realmente alineado:

- El enfoque ya estaba bien orientado a `discovery + analytics`.
- La arquitectura era mejor que la guia original.
- El documento tenia problemas de encoding y lectura.
- Mezclaba `SoundWave Discover` con `SoundWave Journal`, cuando la historia fusionada funciona mejor bajo una sola identidad.
- Faltaba dejar mas clara la narrativa de producto y la priorizacion del MVP.

Esta version corrige eso en el mismo archivo.

---

## Changelog vs guia original

| Aspecto | Guia original | v2 ajustada |
|---------|---------------|-------------|
| Producto | Music player generico | Music discovery journal |
| Valor principal | Reproducir previews | Descubrir musica + entender habitos |
| Historial | Solo plays | Plays, skips, completes, favorites, sessions |
| Recomendaciones | `GROUP BY genre` | Scoring por multiples senales |
| Auth | JWT + refresh en localStorage | Access token en memoria + refresh token en httpOnly cookie |
| Cache | `Map` en memoria acoplado | `CacheProvider` intercambiable |
| Rate limiting | Middleware invisible | Middleware + panel visible + comparacion de algoritmos |
| UX | Referencia Apple Music | Identidad propia orientada a datos |
| Entrevista | CRUD + player | Sistema con producto, criterio tecnico y narrativa |

---

## 1. Product definition

### Identidad

**SoundWave Journal** es una plataforma de music discovery y listening analytics.

El usuario puede:

- buscar musica real con Deezer,
- reproducir previews de 30 segundos,
- guardar tracks en playlists y favoritos,
- recibir recomendaciones explicables,
- entender sus patrones de escucha con un dashboard personal.

### Problema que resuelve

La mayoria de music players de portafolio son clones genericos: reproducen canciones, guardan playlists y ya.

SoundWave Journal se diferencia porque combina:

- descubrimiento musical,
- comportamiento del usuario,
- recomendaciones con razones visibles,
- y analitica personal que convierte eventos en insights.

### Core user stories

1. Quiero buscar y escuchar previews de musica real.
2. Quiero guardar canciones que me gusten en favoritos o playlists.
3. Quiero descubrir musica nueva basada en mi comportamiento.
4. Quiero entender mis patrones de escucha.
5. Quiero compartir playlists publicas o mi perfil musical.

### Que hace que esto no sea otro clon de Spotify

| Player generico | SoundWave Journal |
|-----------------|-------------------|
| Recomendaciones opacas | "Porque completas previews de R&B por la noche" |
| Solo reproduce | Registra play, skip, complete, favorite y sesion |
| Sin capa de insight | Dashboard de habitos y resumen semanal |
| Infraestructura oculta | Rate limiter visible con metricas |
| UI derivativa | Identidad propia enfocada en discovery + datos |

---

## 2. Project story for interviews

Esta es la historia que debe contar el proyecto:

> Tome la idea de un music player, pero en lugar de clonar una interfaz conocida, la converti en una aplicacion web full-stack orientada a music discovery y listening analytics. Integre Deezer para datos reales, modele eventos de comportamiento, implemente rate limiting con sliding window y construi recomendaciones explicables usando SQL y senales de usuario en lugar de machine learning.

Esta historia funciona mejor que "hice un reproductor".

---

## 3. Architecture overview

### Frontend

- `Next.js 14+` con App Router
- `TanStack Query v5`
- `Tailwind CSS`
- `HTML5 <audio>` para previews de 30 segundos

### Backend

- `Node.js + Express + TypeScript`
- `Prisma ORM`
- `PostgreSQL`
- `JWT auth`
- `Sliding window rate limiting`

### Servicios clave

- `Deezer proxy service`
- `Recommendation scoring service`
- `Track events service`
- `Analytics service`
- `Rate limit diagnostics service`

### Despliegue sugerido

- `Vercel` para frontend
- `Railway` o `Render` para API y PostgreSQL

---

## 4. MVP scope

El MVP debe ser pequeno, demostrable y defendible.

### Incluir en MVP

- Registro e inicio de sesion
- Busqueda con Deezer via backend proxy
- Preview de 30 segundos
- Favoritos
- Playlists
- Registro de eventos de escucha
- Dashboard basico con top genres, top artists y actividad reciente
- Endpoint de recomendaciones explicables

### No incluir al inicio

- Chat
- Comentarios
- Sistema complejo de amistad
- Colaboracion en tiempo real
- WebSockets
- Audio completo

### Prioridad tecnica del MVP

1. Auth
2. Search + player preview
3. Favorites + playlists
4. Track events
5. Recommendations
6. Journal dashboard

---

## 5. Data model

### Principio de modelado

La guia original tenia `listening_history`, pero para este proyecto eso se queda corto.

La version correcta debe modelar **eventos**, no solo reproducciones.

### Entidades recomendadas

```text
users
- id
- email
- password_hash
- display_name
- avatar_url
- is_public
- created_at
- updated_at

playlists
- id
- user_id
- name
- is_public
- share_token
- created_at
- updated_at

playlist_tracks
- id
- playlist_id
- deezer_track_id
- track_title
- artist_name
- album_cover_url
- preview_url
- duration_sec
- position
- added_at

favorites
- id
- user_id
- deezer_track_id
- track_title
- artist_name
- album_cover_url
- preview_url
- genre
- created_at

listening_sessions
- id
- user_id
- started_at
- ended_at
- track_count
- label

track_events
- id
- user_id
- session_id
- deezer_track_id
- track_title
- artist_name
- genre
- event_type
- completion_pct
- source
- hour_of_day
- day_of_week
- created_at

rate_limit_log
- id
- user_id
- endpoint
- requested_at
```

### Por que este schema si cumple con la propuesta

- `track_events` permite usar multiples senales.
- `favorites` separa preferencia explicita de reproduccion pasiva.
- `listening_sessions` ayuda a detectar contexto y habitos.
- `source` permite medir si las recomendaciones sirven.

---

## 6. Prisma schema base

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  displayName   String?  @map("display_name")
  avatarUrl     String?  @map("avatar_url")
  isPublic      Boolean  @default(false) @map("is_public")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  playlists     Playlist[]
  favorites     Favorite[]
  sessions      ListeningSession[]
  trackEvents   TrackEvent[]
  rateLimitLogs RateLimitLog[]

  @@map("users")
}

model Playlist {
  id         String   @id @default(cuid())
  userId     String   @map("user_id")
  name       String
  isPublic   Boolean  @default(false) @map("is_public")
  shareToken String?  @unique @map("share_token")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user   User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  tracks PlaylistTrack[]

  @@index([userId])
  @@map("playlists")
}

model PlaylistTrack {
  id            String   @id @default(cuid())
  playlistId    String   @map("playlist_id")
  deezerTrackId Int      @map("deezer_track_id")
  trackTitle    String   @map("track_title")
  artistName    String   @map("artist_name")
  albumCoverUrl String?  @map("album_cover_url")
  previewUrl    String?  @map("preview_url")
  durationSec   Int      @default(30) @map("duration_sec")
  position      Int
  addedAt       DateTime @default(now()) @map("added_at")

  playlist Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)

  @@unique([playlistId, deezerTrackId])
  @@index([playlistId])
  @@map("playlist_tracks")
}

model Favorite {
  id            String   @id @default(cuid())
  userId        String   @map("user_id")
  deezerTrackId Int      @map("deezer_track_id")
  trackTitle    String   @map("track_title")
  artistName    String   @map("artist_name")
  albumCoverUrl String?  @map("album_cover_url")
  previewUrl    String?  @map("preview_url")
  genre         String
  createdAt     DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, deezerTrackId])
  @@index([userId])
  @@map("favorites")
}

model ListeningSession {
  id         String    @id @default(cuid())
  userId     String    @map("user_id")
  startedAt  DateTime  @default(now()) @map("started_at")
  endedAt    DateTime? @map("ended_at")
  trackCount Int       @default(0) @map("track_count")
  label      String?

  user   User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  events TrackEvent[]

  @@index([userId, startedAt])
  @@map("listening_sessions")
}

enum EventType {
  PLAY
  SKIP
  COMPLETE
  FAVORITE
  UNFAVORITE
}

model TrackEvent {
  id            String     @id @default(cuid())
  userId        String     @map("user_id")
  sessionId     String?    @map("session_id")
  deezerTrackId Int        @map("deezer_track_id")
  trackTitle    String     @map("track_title")
  artistName    String     @map("artist_name")
  genre         String
  eventType     EventType  @map("event_type")
  completionPct Int        @default(0) @map("completion_pct")
  source        String
  hourOfDay     Int        @map("hour_of_day")
  dayOfWeek     Int        @map("day_of_week")
  createdAt     DateTime   @default(now()) @map("created_at")

  user    User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  session ListeningSession? @relation(fields: [sessionId], references: [id])

  @@index([userId, createdAt])
  @@index([userId, genre])
  @@index([userId, artistName])
  @@index([userId, eventType])
  @@index([userId, hourOfDay])
  @@map("track_events")
}

model RateLimitLog {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  endpoint    String
  requestedAt DateTime @default(now()) @map("requested_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, endpoint, requestedAt])
  @@map("rate_limit_log")
}
```

---

## 7. Auth strategy

### Decision

- Access token en memoria
- Refresh token en cookie `httpOnly`
- Expiracion corta para access token
- Rotacion de refresh token

### Por que es mejor

Guardar refresh token en `localStorage` es util para tutoriales, pero peor para portafolio serio.

Con `httpOnly` cookie:

- reduces vector de robo por XSS,
- demuestras criterio de seguridad,
- y mejoras la historia tecnica en entrevista.

### Requisitos tecnicos

- `cookie-parser`
- `cors({ origin, credentials: true })`
- `axios` con `withCredentials: true`

---

## 8. Cache strategy

### Decision

No acoples el cache a un `Map` directamente dentro del servicio de Deezer.

Usa una interfaz:

```ts
interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
  stats(): Promise<{ hits: number; misses: number; size: number }>;
}
```

### Implementaciones

- `MemoryCacheProvider` para MVP
- `RedisCacheProvider` para escalado futuro

### Beneficio

Puedes defender una decision de arquitectura real:

> El servicio no depende de la tecnologia de cache, sino del contrato.

---

## 9. Event logging model

### Esta es una pieza central

No registres solo que una cancion se reprodujo. Registra comportamiento.

### Eventos minimos

- `PLAY`
- `SKIP`
- `COMPLETE`
- `FAVORITE`
- `UNFAVORITE`

### Campos importantes

- `genre`
- `source`
- `completion_pct`
- `hour_of_day`
- `day_of_week`
- `session_id`

### Resultado

Esto permite responder preguntas mas interesantes:

- Que genero escuchas mas por la noche
- Que artistas completas mas seguido
- Si las recomendaciones acaban en favoritos
- Si un track se reproduce mucho pero siempre se salta

---

## 10. Recommendations engine

### La guia original se quedaba corta aqui

Usar solo `GROUP BY genre` sirve como demo inicial, pero no como diferenciador final.

### Enfoque correcto

Usa scoring por multiples senales.

### Signals sugeridas

- favorites recientes
- completes recientes
- plays recientes
- skips recientes
- coincidencia por hora del dia
- afinidad por artista
- afinidad por genero

### Pesos base

```ts
const SIGNAL_WEIGHTS = {
  FAVORITE: 5.0,
  COMPLETE: 3.0,
  PLAY: 1.0,
  SKIP: -2.0,
  TIME_MATCH: 1.5,
};
```

### Idea del scoring

```sql
SELECT
  genre,
  COUNT(*) FILTER (WHERE event_type = 'FAVORITE') AS favorites,
  COUNT(*) FILTER (WHERE event_type = 'COMPLETE') AS completes,
  COUNT(*) FILTER (WHERE event_type = 'PLAY') AS plays,
  COUNT(*) FILTER (WHERE event_type = 'SKIP') AS skips
FROM track_events
WHERE user_id = $1
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY genre
ORDER BY (
  COUNT(*) FILTER (WHERE event_type = 'FAVORITE') * 5.0 +
  COUNT(*) FILTER (WHERE event_type = 'COMPLETE') * 3.0 +
  COUNT(*) FILTER (WHERE event_type = 'PLAY') * 1.0 +
  COUNT(*) FILTER (WHERE event_type = 'SKIP') * -2.0
) DESC
LIMIT 5;
```

### Explainable recommendations

Cada recomendacion debe venir con una razon:

- "Porque completaste 12 previews de R&B"
- "Porque favoritas Pop con frecuencia"
- "Porque por la noche sueles escuchar Indie"

Esto es clave. No basta con recomendar. Hay que **explicar**.

---

## 11. Rate limiting as product feature

### Mantener la idea tecnica

El `sliding window rate limiter` sigue siendo una excelente idea porque conecta directo con tu experiencia en Java.

### Mejora importante

No lo dejes invisible.

Agrega:

- manejo claro de errores `429`,
- exposicion de headers `Retry-After` y `X-RateLimit-*`,
- vista de diagnostico para ver consumo por endpoint,
- comparacion visual conceptual entre fixed window y sliding window.

### Valor para entrevista

> No solo implemente rate limiting. Tambien construi una vista para observar su comportamiento y explicar por que sliding window evita bursts en los limites de ventana.

---

## 12. Recommended endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Search and discovery

- `GET /api/search?q=...`
- `GET /api/tracks/:id`
- `GET /api/recommendations`
- `GET /api/discovery/genres`

### Playlists and favorites

- `GET /api/playlists`
- `POST /api/playlists`
- `GET /api/playlists/:id`
- `POST /api/playlists/:id/tracks`
- `PATCH /api/playlists/:id/tracks/reorder`
- `DELETE /api/playlists/:id/tracks/:trackId`
- `GET /api/favorites`
- `POST /api/favorites`
- `DELETE /api/favorites/:trackId`

### Journal and analytics

- `POST /api/journal/events`
- `GET /api/journal/recent`
- `GET /api/journal/insights`
- `GET /api/journal/streaks`
- `GET /api/journal/time-patterns`
- `GET /api/analytics/weekly`

### Diagnostics

- `GET /api/rate-limit/status`
- `GET /api/rate-limit/compare`

### Public sharing

- `GET /api/profile/:userId`
- `GET /api/shared/:shareToken`

---

## 13. Frontend sections

### App areas

1. `Home`
   Discovery personalizado, actividad reciente y recomendaciones explicables.
2. `Search`
   Busqueda con previews y acciones rapidas.
3. `Library`
   Playlists y favoritos.
4. `Journal`
   Historial, insights, heatmaps y resumen semanal.
5. `Profile`
   Perfil publico, top genres y playlists compartibles.
6. `Developer Mode`
   Diagnosticos de rate limiting y cache.

---

## 14. Visual direction

### Regla principal

No copies Apple Music literalmente.

### Direccion sugerida

- base oscura, pero no negro puro
- visuales inspirados en waveforms
- tipografia con personalidad
- cards con etiquetas de razon
- componentes de datos como heatmaps, badges y small charts

### Identidad sugerida

- `Space Grotesk` para headings
- `JetBrains Mono` para datos tecnicos
- acento primario sobrio
- acento secundario calido para favoritos y score

### Elementos distintivos

- recommendation reason chips
- completion ring en player bar
- listening heatmap por hora y dia
- small cards con "why this track"

---

## 15. Testing strategy

### Rate limiter tests

- permite requests debajo del limite
- bloquea el request excedente con `429`
- calcula `Retry-After` correctamente
- vuelve a permitir despues del vencimiento de la ventana
- fail-open si la consulta a DB falla

### Auth tests

- setea cookie `httpOnly` en login
- refresca via cookie, no via body
- rota refresh token
- rechaza refresh sin cookie

### Recommendation tests

- favorites pesan mas que plays
- skips penalizan score
- se aplica bonus temporal
- genera reasons consistentes

### Frontend tests

- optimistic updates de playlists
- manejo de `401` y refresh
- manejo de `429`
- render de recommendation reason chips

---

## 16. Roadmap by phases

### Phase 1

- Auth
- Search con Deezer
- Preview player
- Favorites
- Playlists

### Phase 2

- Track events
- Listening sessions
- Journal reciente
- Weekly analytics basico

### Phase 3

- Sliding window rate limiting
- Frontend handling de `429`
- Diagnostics panel

### Phase 4

- Recommendation scoring
- Explainable reasons
- Time-of-day recommendations

### Phase 5

- Public profile
- Shareable playlists
- Optional social features

---

## 17. Final assessment

Este documento ya queda alineado con lo propuesto.

### Si cumple

- fusiona `Smart Discovery` + `Listening Journal`,
- cambia el centro del proyecto de player a producto,
- introduce recomendaciones explicables,
- mejora seguridad,
- mejora modelado de datos,
- y conecta bien con tu experiencia en rate limiting.

### Lo mas importante

La innovacion real no esta en meter mas features, sino en cambiar la historia:

- no haces otro clon de Spotify,
- no haces solo CRUD con playlists,
- haces una app que descubre musica y entiende el comportamiento del usuario.

Ese es el enfoque correcto para portafolio.
