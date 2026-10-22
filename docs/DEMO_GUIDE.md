# Demo guide

A short, scripted walkthrough for showing SoundWave Journal with real data already in place — no need to generate activity live before an interview.

## Prerequisites

The demo account only exists after `apps/api/src/scripts/seed-demo-account.ts` has been run once against the production database (see the "Cuenta demo" section in `docs/DEVELOPMENT_GUIDE_v2.md` for the exact command). It is not seeded automatically.

## Credentials

| Field | Value |
|---|---|
| Email | `demo@soundwave-journal.app` |
| Password | Whatever was passed as `DEMO_USER_PASSWORD` when the seed ran. Not written here or anywhere in the repo — passwords don't belong in a public portfolio repo even for a demo account. Keep it in your own notes/password manager. |

## Walkthrough

### 1. Login → Home

Log in and land on `/`. The "Built from your real activity" panel is already populated from seeded events: weekly plays/completes/favorites/skips, and a genre recommendation list (derived from real event scoring, not hardcoded) — point out that these numbers come from the same `track_events` table everything else reads from, not a separate "demo mode" dataset.

### 2. Search

Go to `/search` and look up something **not** already in the seed (e.g. an artist other than Queen, Daft Punk, or Radiohead) to show a live, real Deezer lookup rather than replaying pre-loaded data. Play a preview to show the real `<audio>` element working.

### 3. Favorite

From those live search results, favorite a track. It should appear immediately in `/library` alongside the three tracks the seed already favorited (Bohemian Rhapsody, Get Lucky, Creep (Acoustic)) — this is the moment to show that favoriting is a real write, not a toggle on static data.

### 4. Playlist

Still in `/library`, open the two seeded playlists:

- **Interview highlights** — Bohemian Rhapsody, Get Lucky
- **Late-night rotation** — Creep (Acoustic), Bohemian Rhapsody

Use Move up/down on one of them to demonstrate the paginated reorder — the swap is a real backend call (`PATCH .../tracks/:trackId/move`), not a client-side reshuffle.

### 5. Journal

Go to `/journal`. The seeded events are deliberately shaped so these panels have deterministic, real content to show, regardless of when the seed was run:

- **"When you listen"**: most active hour is **21:00** (7 of the 12 seeded events land there), and the genre/hour note reads *"You most often play rock around 21:00."* (Bohemian Rhapsody has the most PLAY events at that hour).
- **"Your consistency"**: current streak **4 days**, longest streak **4 days** (last 365 days), **7** total active days — the seed places events on 7 distinct days within the last 13, with a 4-day consecutive run ending today.
- Top genres/artists and recent activity reflect the same seeded events — nothing here is a separate mock.

### 6. Developer diagnostics

Go to `/developer`. Make a few requests elsewhere in the app first (a couple of searches, a favorite) so the rate-limit panel has non-zero consumption to show, then point out the "Fixed window vs sliding window" comparison — explain that fixed window is the real enforcement running right now, and sliding window is documented as the evolution path, not implemented as live enforcement (see `docs/DEVELOPMENT_GUIDE_v2.md`, section 11).

## What not to demo

- **Public profile** — not implemented, no route or UI.
- **Playlist sharing** — incomplete: `isPublic` is accepted and persisted when a playlist is created, but there's no way to toggle it afterward and no route generates or consumes a `shareToken`. If asked, say so directly rather than clicking around looking for a share button.
- **A persistent player bar** — previews are per-track via `<audio>`; there's no cross-route now-playing queue.
- **Listening sessions UI** — the backend supports starting/ending a session, but nothing in the UI creates one yet.
