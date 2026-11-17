# Demo guide

A short, scripted walkthrough for showing SoundWave Journal with real data already in place, so there is no need to generate activity live before an interview.

## Prerequisites

The demo account only exists after `apps/api/src/scripts/seed-demo-account.ts` has been run once against the production database (see the "Cuenta demo" section in `docs/DEVELOPMENT_GUIDE_v2.md` for the exact command). It is not seeded automatically.

## Credentials

| Field | Value |
|---|---|
| Email | `demo@soundwave-journal.app` |
| Password | Whatever was passed as `DEMO_USER_PASSWORD` when the seed ran. Not written here or anywhere in the repo: passwords don't belong in a public portfolio repo even for a demo account. Keep it in your own notes/password manager. |

## Walkthrough

### 1. Login → Home

Log in from the two-column threshold page and land on `/`. The hero greets the account by name and time of day. Below it, the "Built from your real activity" panels are already populated from seeded events: weekly plays/completes/favorites/skips, and a genre recommendation list derived from real event scoring. Point out that these numbers come from the same `track_events` table everything else reads from, not a separate "demo mode" dataset.

### 2. Search and the preview player

Go to `/search` and look up something **not** already in the seed (an artist other than Queen, Daft Punk, or Radiohead) to show a live Deezer lookup rather than replaying pre-loaded data.

Press play on a cover. Three things are worth showing:

- The cover gets a progress ring and the **now-playing bar** appears at the bottom with scrubbing and timings.
- Navigate to `/journal` with the sidebar while it plays: **the preview keeps playing**. One `<audio>` element lives above the routes.
- The play you just made is already the newest entry in "Latest events". `PLAY` is logged only once audio actually starts.

### 3. Favorite

Back in Search, favorite a track. It appears immediately in `/library` alongside the three tracks the seed already favorited (Bohemian Rhapsody, Get Lucky, Creep (Acoustic)). This is the moment to show that favoriting is a real write, not a toggle on static data.

Play one of the **seeded** favorites here. Its stored preview URL expired long ago (Deezer signs them for a few minutes); the player notices, asks the API for a fresh one and plays. Worth mentioning if the conversation goes to third-party API quirks.

### 4. Playlist

Still in `/library`, open the two seeded playlists:

- **Interview highlights** — Bohemian Rhapsody, Get Lucky
- **Late-night rotation** — Creep (Acoustic), Bohemian Rhapsody

Use the ↑ / ↓ controls on a track to demonstrate reordering. The swap is a real backend call (`PATCH .../tracks/:trackId/move`) that stays correct across pagination boundaries, not a client-side reshuffle. Rename and delete are the pencil and bin icons next to the playlist title.

### 5. Journal

Go to `/journal`. The seeded events are deliberately shaped so these panels have deterministic, real content regardless of when the seed was run:

- **"When you listen"**: most active hour is **21:00** (7 of the 12 seeded events land there), and the note reads *"You most often play rock around 21:00."*
- **"Your consistency"**: current streak **4 days**, longest streak **4 days** (last 365 days), **7** total active days. The bar under the metrics lights one step per day of the current streak.
- **"Latest events"** is a timeline: teal for plays, mint for completions, rose for favorites.

Anything you played or favorited in steps 2–3 shifts these numbers. That is the point: nothing here is a separate mock.

### 6. Developer diagnostics

Go to `/developer`. Make a few requests elsewhere in the app first (a couple of searches, a favorite) so the meters have non-zero consumption, then point out the "Fixed window vs sliding window" comparison: fixed window is the real enforcement running right now, and sliding window is documented as the evolution path, not implemented as live enforcement (see `docs/DEVELOPMENT_GUIDE_v2.md`, section 11). A meter turns red above 80% of its limit.

### 7. Responsive (optional, 20 seconds)

Narrow the window below 1024px or open DevTools device mode: the sidebar becomes a bottom tab bar and the now-playing bar docks on top of it.

## What not to demo

- **Public profile** — not implemented, no route or UI.
- **Playlist sharing** — incomplete: `isPublic` is accepted and persisted when a playlist is created, but there's no way to toggle it afterward and no route generates or consumes a `shareToken`. If asked, say so directly rather than clicking around looking for a share button.
- **A play queue** — the player handles one preview at a time. There is no next/previous or autoplay, and a full page reload stops playback.
- **Listening sessions UI** — the backend supports starting/ending a session, but nothing in the UI creates one yet.
- **Opening several tabs mid-demo** — session restore between tabs has no timeout yet (see "Known limitations" in the README); keep the demo in one tab.
