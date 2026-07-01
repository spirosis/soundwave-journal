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

### Invariante matematico: campo position en playlist_tracks

El campo `position` mantiene una secuencia contigua sobre cada playlist:

    forall playlist con n tracks: posiciones = { 1, 2, ..., n }

Las tres operaciones que lo modifican se comportan asi:

    Insert:  nextPosition = MAX(position) + 1
             complejidad O(1) con un aggregate sobre la tabla

    Delete:  forall track donde position > deleted.position:
               position -= 1
             complejidad O(k), k = cantidad de tracks posteriores al eliminado

    Reorder: validar biyeccion antes de reasignar posiciones
             condicion: |A_recibido| = |A_existente|  AND  A_sorted = B_sorted
             deteccion de duplicados via Set en O(n), comparacion en O(n log n)

La estrategia de reorden usa dos fases para evitar colisiones intermedias:

    Fase 1: position <- -(index + 1)    valores negativos, sin conflicto con positivos
    Fase 2: position <- +(index + 1)    estado final correcto

Ambas fases se ejecutan dentro de una transaccion atomica ($transaction).

---

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

### Fundamento matematico

`bcrypt` aplica Blowfish con factor de costo `2^10 = 1024` rounds de key stretching.
Cada incremento en el factor duplica el costo computacional para un atacante de fuerza bruta,
manteniendo el costo para el servidor constante y aceptable.

JWT define dos ventanas de tiempo disjuntas sobre el mismo userId:

    access token:   t ∈ [t0, t0 + 900s]         expira en 15 minutos
    refresh token:  t ∈ [t0, t0 + 604800s]       expira en 7 dias

La firma HMAC-SHA256 garantiza integridad del payload:
cualquier modificacion al header o claims invalida la firma.

`bcrypt.compare()` usa comparacion en tiempo constante, eliminando timing attacks:
la duracion de la operacion no varia si el hash coincide o no.

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

### Fundamento matematico

Una entrada es valida si y solo si:

    expiresAt = createdAt + ttlMs
    entrada valida  <=>  now <= expiresAt

La tasa de aciertos mide la eficiencia del cache:

    hit_rate = hits / (hits + misses)    ∈ [0.0, 1.0]

`MemoryCacheProvider` usa lazy eviction: las entradas expiradas no se eliminan
proactivamente sino cuando se accede a ellas. Esto reduce overhead de barrido
pero puede retener entradas muertas en memoria hasta su proximo acceso.

La interfaz permite reemplazar `MemoryCacheProvider` por `RedisCacheProvider`
sin cambiar el codigo del servicio que la consume — el contrato es invariante.

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
- `source`         registra el origen del track: 'search', 'recommendation', 'playlist'
                   es el mecanismo que cierra el ciclo de feedback del motor de recomendaciones
                   ver seccion 10 para las metricas derivadas (recommendation_favorite_rate, etc.)
- `completion_pct`
- `hour_of_day`
- `day_of_week`
- `session_id`

### Fundamento matematico

`hour_of_day` y `day_of_week` discretizan tiempo continuo en dominios ciclicos enteros:

    hour_of_day  ∈  Z/24Z    valores [0, 23]
    day_of_week  ∈  Z/7Z     valores [0, 6]

Dos eventos en fechas distintas pero a la misma hora comparten `hour_of_day`.
Esto revela habitos recurrentes independientemente del timestamp absoluto,
que es exactamente lo util para recomendaciones basadas en contexto temporal.

`completion_pct ∈ [0, 100]` es una metrica de engagement acotada.
Combinado con `event_type`, permite derivar metricas derivadas por genero o artista:

    skip_rate(genre)       = COUNT(SKIP)  / COUNT(PLAY)
    completion_avg(genre)  = AVG(completion_pct) WHERE event_type = 'PLAY'
    engagement_score       = completion_avg * (1 - skip_rate)

Estas tres metricas se pueden calcular directamente en SQL sobre los indices existentes.

### Resultado

Esto permite responder preguntas mas interesantes:

- Que genero escuchas mas por la noche
- Que artistas completas mas seguido
- Si las recomendaciones acaban en favoritos
- Si un track se reproduce mucho pero siempre se salta

---

## 10. Recommendations engine

### Motor elegido: time-decay exponencial

El scoring plano (flat count) trata todos los eventos como igualmente relevantes sin importar cuando ocurrieron.
Un FAVORITE de hace 25 dias pesa igual que uno de hace 2 horas. Pierde sensibilidad a cambios de gusto.

El motor correcto usa decaimiento exponencial: cada evento contribuye menos al score a medida que envejece.
Sigue siendo SQL-first, multiple signals y explicable. Sin ML ni modelos externos.

### Formula del scoring

El score de un genero es el producto escalar entre el vector de pesos y los conteos ponderados por tiempo:

    c_i(genre) = sum_j e^(-lambda x delta_t_j)   suma de eventos de tipo i, ponderados por edad
    w          = { FAVORITE: 5.0, COMPLETE: 3.0, PLAY: 1.0, SKIP: -2.0, UNFAVORITE: -4.0 }
    lambda     = ln(2) / half_life               constante de decaimiento

    score(genre) = w . c = sum_i w_i x c_i(genre)

Es una funcion lineal sobre el espacio de conteos ponderados. Resultado: ranking ordinal, no probabilidad.

### Parametros

```ts
const RECOMMENDATION_CONFIG = {
  SIGNAL_WEIGHTS: {
    FAVORITE:    5.0,
    COMPLETE:    3.0,
    PLAY:        1.0,
    SKIP:       -2.0,
    UNFAVORITE: -4.0,
  },
  HALF_LIFE_DAYS: 7,      // 7 dias: fuerte sesgo a recencia
                           // 14 dias: mas estabilidad historica
  LAMBDA: Math.LN2 / 7,   // derivado automaticamente de HALF_LIFE_DAYS
  CUTOFF_DAYS: 90,        // ver nota sobre cutoff abajo
  TOP_N: 5,
};
```

### Sobre TIME_MATCH

El motor base no debe mezclar `TIME_MATCH` dentro del score principal v1.

La recencia ya esta modelada por el decaimiento temporal sobre `created_at`.
El contexto horario (`hour_of_day`) se usa mejor para reasons o como bonus separado en v2:

- reason: "Porque por las noches sueles escuchar Indie"
- bonus futuro: afinidad adicional si el patron horario actual coincide con el historico

Mantener `TIME_MATCH` fuera del score base evita prometer complejidad que aun no esta implementada.

### Scores negativos

Un score negativo representa aversion implicita: el usuario salta sistematicamente ese genero
o revierte preferencia explicita con `UNFAVORITE`.

No truncar a cero. Eso borra informacion util.
Filtrar en la capa de recomendacion: exponer solo generos con score > 0.
Los scores negativos son evidencia de rechazo disponible si se necesita justificar ausencias.

### Cutoff temporal

Usar `WHERE created_at > NOW() - INTERVAL '90 days'`.

La justificacion es performance, no calidad del modelo.
Con lambda aprox 0.099 (half_life = 7 dias), un evento de hace 89 dias aporta
e^(-8.8) aprox 0.00015 del peso de un evento de hoy: materialmente irrelevante.
El cutoff evita escanear filas que ya no mueven el resultado.
Documentarlo en codigo como optimizacion de computo, no como "reduccion de ruido".

### Query SQL con time-decay

Para implementacion real, preferir `CTE` o subquery en lugar de repetir la expresion completa
en `SELECT` y `HAVING`.

```sql
WITH genre_scores AS (
  SELECT
    genre,
    SUM(
      CASE event_type
        WHEN 'FAVORITE'   THEN  5.0
        WHEN 'COMPLETE'   THEN  3.0
        WHEN 'PLAY'       THEN  1.0
        WHEN 'SKIP'       THEN -2.0
        WHEN 'UNFAVORITE' THEN -4.0
        ELSE 0
      END
      * EXP(
          -0.099 * EXTRACT(epoch FROM (NOW() - created_at)) / 86400.0
        )
    ) AS score
  FROM track_events
  WHERE user_id = $1
    AND created_at > NOW() - INTERVAL '90 days'
  GROUP BY genre
)
SELECT genre, score
FROM genre_scores
WHERE score > 0
ORDER BY score DESC
LIMIT 5;
```

`WHERE score > 0` filtra generos con aversion implicita antes de devolver resultados.

### source como ciclo de feedback cerrado

El campo `source` convierte el sistema en evaluable sin instrumentacion extra.

La mayoria de motores de portafolio son open-loop: generan recomendaciones pero no saben si funcionaron.
Este no, porque `source` ya esta en el modelo desde el primer dia.

    source = 'recommendation' + eventType = FAVORITE o COMPLETE  ->  recomendacion correcta
    source = 'recommendation' + eventType = SKIP                 ->  recomendacion incorrecta

### Metricas de efectividad (funnel de conversion)

No usar el termino "precision" para estas metricas.
Precision en ML es TP / (TP + FP) y requiere ground truth externo. No aplica aqui.
Estas son tasas de conversion por etapa del funnel:

    PLAY (source='recommendation')    <- impresion
        COMPLETE                      <- interes profundo
        FAVORITE                      <- conversion explicita
        SKIP                          <- rechazo

    recommendation_favorite_rate  = COUNT(FAVORITE) / NULLIF(COUNT(PLAY), 0)   WHERE source = 'recommendation'
    recommendation_complete_rate  = COUNT(COMPLETE) / NULLIF(COUNT(PLAY), 0)   WHERE source = 'recommendation'
    recommendation_skip_rate      = COUNT(SKIP)     / NULLIF(COUNT(PLAY), 0)   WHERE source = 'recommendation'

### Separacion: score vs reasons

El score ordena internamente. No se expone al usuario.
Las reasons se derivan de conteos simples sobre ventanas recientes para ser legibles:

- "Porque completaste varias previews de R&B esta semana"   <- COUNT(COMPLETE, genre=R&B, 7d)
- "Porque has marcado Pop como favorito recientemente"      <- COUNT(FAVORITE, genre=Pop, 7d)
- "Porque por las noches sueles escuchar Indie"             <- patron en hour_of_day

Esto da lo mejor de ambos mundos: ranking correcto via time-decay, explicacion legible via conteos simples.

### Evolucion futura (v2)

Una vez que el motor base funcione, la siguiente iteracion es dual-window:

    score_final = a x score_7d + (1 - a) x score_90d

Captura gusto reciente vs. habito estable con dos queries independientes combinadas linealmente.
Mas moving parts y requiere calibrar a. Implementar como v2, no como version inicial.

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

### Fundamento matematico

El algoritmo cuenta requests dentro de un intervalo movil de longitud fija:

    requests_in_window(t) = COUNT(*) WHERE requested_at > t - window_size

Para cada request entrante con timestamp t_now:

    permitir  si  requests_in_window(t_now) < limit
    rechazar  si  requests_in_window(t_now) >= limit   -> responder 429

El tiempo minimo de espera antes de poder reintentar:

    retry_after = MIN(requested_at) en la ventana + window_size - t_now

Diferencia con fixed window:

    Fixed window:   reinicia contador en multiplos exactos del intervalo (e.g. cada :00)
                    permite burst de hasta 2x limit en el borde entre dos ventanas

    Sliding window: el intervalo se desplaza con cada request
                    no hay bordes fijos, el burst maximo es siempre <= limit

El indice compuesto @@index([userId, endpoint, requestedAt]) permite ejecutar
la consulta de conteo en O(log n) sin full scan de la tabla.

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

- FAVORITE pesa mas que COMPLETE, COMPLETE mas que PLAY (verificar pesos relativos del config)
- SKIP reduce el score del genero (peso negativo)
- evento reciente pesa mas que evento identico de hace 30 dias (verificar decay exponencial)
- genero con score <= 0 no aparece en resultados (HAVING clause filtra aversion implicita)
- eventos fuera del cutoff de 90 dias no afectan el score
- source = 'recommendation' permite calcular recommendation_favorite_rate y skip_rate
- reasons generadas corresponden al genero con mayor score en ventana reciente de 7 dias

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

- Recommendation scoring con time-decay exponencial (half_life = 7 dias, cutoff 90 dias)
- Scores negativos filtrados via HAVING > 0, no truncados — preservar como evidencia de rechazo
- Explainable reasons derivadas de conteos simples en ventana de 7 dias (no el score numerico)
- Time-of-day bonus via hour_of_day (dominio Z/24Z)
- Metricas de efectividad via source field: recommendation_favorite_rate, complete_rate, skip_rate

### Phase 5

- Public profile
- Shareable playlists
- Optional social features

---

## 18. Bitacora de ajustes

Registro acumulativo de hallazgos, correcciones y pendientes detectados durante el desarrollo y revision tecnica del proyecto. Se actualiza a medida que se implementan los fixes.

Estado: `CORREGIDO` | `PENDIENTE`

---

### 18.1 Seguridad

| # | Componente | Hallazgo | Estado | Como se corrigio / Como corregir |
|---|-----------|----------|--------|----------------------------------|
| S1 | `auth.routes.ts` | `authLimiter` compartia bucket entre login, register y refresh | CORREGIDO | Separado en `authWriteLimiter` (10 req/15min) para login/register y `refreshLimiter` (30 req/15min) para refresh |
| S2 | `server.ts` | Faltaba `app.set("trust proxy", 1)` — IPs de clientes incorrectas detrás de reverse proxy | CORREGIDO | Agregado en `server.ts` antes de montar rutas |
| S3 | `server.ts` | `GET /api/db-check` era publico sin rate limit ni guarda de entorno | CORREGIDO | Protegido con `publicLimiter` y envuelto en `if (process.env.NODE_ENV !== "production")` |
| S4 | `rate-limit.middleware.ts` | Store en memoria no sobrevive multiples instancias (no apto para escala horizontal) | CORREGIDO (documentado) | Comentario MVP en el archivo: indica que debe migrarse a Redis store si el API escala a multiples replicas |
| S5 | `playlists.service.ts` | Race condition TOCTOU en `addTrackToPlaylist`: posicion calculada fuera de lock permitia inserciones duplicadas o posiciones incorrectas bajo concurrencia | CORREGIDO | `$transaction` interactivo con `SELECT ... FOR UPDATE` en la fila de la playlist + captura de `P2002` como safety net |
| S6 | `auth.routes.ts` | Sin politica minima de password en registro | CORREGIDO | Funcion `isValidPassword`: minimo 8 caracteres, al menos una letra y un numero. Devuelve 400 si no cumple |
| S7 | `auth.service.ts` | Email no se normalizaba antes de buscar en DB (case/whitespace-sensitive) | CORREGIDO | `normalizeEmail`: trim + toLowerCase aplicado en register y login antes de cualquier consulta |
| S8 | `auth.service.ts` | Bug `exactOptionalPropertyTypes` (TS2375): se comprobaba `displayName !== undefined` pero se pasaba `normalizedDisplayName` que podia ser `undefined` independientemente | CORREGIDO | Condicion cambiada a `normalizedDisplayName !== undefined` para spread consistente |
| S9 | `auth.service.ts` | Refresh tokens sin rotacion ni revocacion — un token robado era valido indefinidamente | CORREGIDO | Modelo `RefreshSession` en DB, `generateTokens` crea sesion con hash SHA-256, `refreshAccessToken` rota el hash en cada uso, `revokeRefreshToken` marca `revokedAt` en logout |
| S10 | `server.ts` | `db-check` catch path usaba `res.status(500).json.apply(...)` en lugar de `res.status(500).json(...)` — error en path de fallo de DB | CORREGIDO | Removido `.apply`, llamada directa a `res.status(500).json({ status: "error", db: "disconnected" })` |

---

### 18.2 Eficiencia y rendimiento de queries

| # | Componente | Hallazgo | Severidad | Estado | Como corregir |
|---|-----------|----------|-----------|--------|---------------|
| E1 | `recommendations.service.ts:194` — `getRecommendationMetrics` | Query sin ventana temporal: escanea **todo el historial** del usuario para calcular tasas de conversion de recomendaciones. Malo en costo y en semantica (metricas de hace 2 anos no describen el estado actual) | Alta | PENDIENTE | Agregar `AND created_at >= NOW() - INTERVAL '90 days'` antes del `;` en la clausula `WHERE user_id = $userId`. La ventana de 90 dias es coherente con la del motor de scoring |
| E2 | `favorites.service.ts:47` — `getFavorites` | `findMany` sin `take` ni cursor: devuelve **todos** los favoritos del usuario en un solo response. El problema principal es volumen de payload y memoria, no el scan (el indice `favorites_user_id_idx` ya existe) | Media-Alta | PENDIENTE | Implementar cursor-based pagination: aceptar parametros `cursor` y `limit` en el endpoint `GET /api/favorites`. Prisma soporta `cursor` + `take` nativamente |
| E3 | `playlists.service.ts:141` — `getPlaylistById` | `include: { tracks }` sin paginacion: carga todos los tracks de la playlist en un solo query. Severidad depende del producto: aceptable para playlists de uso personal (<100 tracks), problematico si se permiten playlists grandes | Media | PENDIENTE | Decision de producto primero. Si se decide paginar: separar en dos endpoints — `GET /api/playlists/:id` (metadata) y `GET /api/playlists/:id/tracks?cursor=&limit=` (tracks paginados) |
| E4 | `playlists.service.ts:252` — `reorderTracks` | Double-loop con 2N updates individuales en transaccion (N negativos + N positivos). El patron de negativos-primero es correcto para evitar colisiones en el unique constraint de `position`. Suboptimo pero correcto | Media-Baja | PENDIENTE (diferible) | Reemplazar los dos loops por dos queries bulk usando `UPDATE ... SET position = CASE deezer_track_id WHEN x THEN y ... END WHERE playlist_id = $id`. Reduce de 2N a 2 queries independientemente del tamano de la playlist |
| E5 | `journal.service.ts:399` — `getStreaks` | Query CTE con `ROW_NUMBER()` escaneaba todo el historial sin filtro temporal | Alta | CORREGIDO | Acotado con `STREAK_LOOKBACK_DAYS = 365` como constante. El indice `track_events_user_id_created_at_idx` ya existe y el planner lo usa para filtrar el rango |

---

### 18.3 Bugs corregidos (logica y tipos)

| # | Componente | Bug | Como se corrigio |
|---|-----------|-----|-----------------|
| B1 | `recommendations.routes.ts` | Ruta con typo: `/recommendation/metrics` (singular) causaba 404 | Corregido a `/recommendations/metrics` |
| B2 | `recommendations.routes.ts` | Handler de metrics no llamaba `res.json(metrics)` — response quedaba colgada | Agregado `res.json(metrics)` al final del handler |
| B3 | `journal.service.ts` | Query `topArtistRows`: typo `"astistName"` en lugar de `"artistName"`, coma antes de `FROM`, `ORDER_BY` en lugar de `ORDER BY` — causaba error SQL 42601 | Corregidos los tres errores en el raw query |
| B4 | `analytics.routes.ts` | Ruta sin slash inicial: `router.get("analytics/weekly", ...)` causaba 404 bajo el mount `/api` | Corregido a `"/analytics/weekly"` |
| B5 | `schema.prisma` | `@@map(["refresh_sessions"])` usaba array en lugar de string | Corregido a `@@map("refresh_sessions")` |
| B6 | `schema.prisma` | `@map("created at")` con espacio en lugar de guion bajo | Corregido a `@map("created_at")` |
| B7 | `deezer.service.ts` | Typo `DEFAULT_TIMIEOUT_MS` referenciaba constante inexistente | Declarada constante `DEFAULT_TIMEOUT_MS = 5_000` y corregido el typo en el constructor |
| B8 | `auth.service.ts` | `generateTokens` usaba `await` pero no era `async` (TS1308) | Marcada `async function generateTokens` + agregado `await` en ambas llamadas (`registerUser`, `loginUser`) |
| B9 | `auth.routes.ts` | Handler de `/refresh` no era `async` y no esperaba `refreshAccessToken` — el `try/catch` no capturaba rechazos de la promesa | Handler cambiado a `async` y agregado `await` antes de `refreshAccessToken(token)` |
| B10 | `auth.routes.ts` | Typo por autocompletado: `requestAnimationFrame.cookies[...]` en lugar de `req.cookies[...]` en handler de `/logout` | Corregido a `req.cookies[REFRESH_COOKIE]` y parametro renombrado de `_req` a `req` |

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
