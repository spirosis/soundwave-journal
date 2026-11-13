# UI DOM contract

The Playwright suite (`apps/web/tests/*.spec.ts`) locates elements by accessible name, not by CSS class. Any visual redesign is free to change markup, styling and layout as long as the names below survive. If a stage of the redesign needs to change one of these, update the spec in the same commit.

## Structural

| Contract | Used by |
|---|---|
| Playlist selector buttons live inside an `<aside>` (`PlaylistsView` on `/library`). The shell's own `<aside>` must not contain **buttons** whose name includes a playlist name — its playlist shortcuts are links. Rename/Delete buttons live outside any `<aside>`. | `playlist-flow`, `playlist-manage-flow`, `playlist-move-flow` |
| Search input has `id="search-query"` | `favorites-flow`, `playlist-flow` |
| Playlist tracks render as text `"<position>. <title>"` (e.g. `1. Bohemian Rhapsody`) | `playlist-flow`, `playlist-move-flow` |

## Form labels (`getByLabel`)

`Display name`, `Email`, `Password`, `Playlist name` (create form, always mounted on `/library`), `Rename playlist` (inline rename input; must differ from `Playlist name`).

## Button names (`getByRole("button")`)

| Name | Where |
|---|---|
| `Login`, `Register`, `Logout` | auth forms, shell topbar |
| `Search` (exact) | search form submit |
| `Favorite`, `Remove favorite` | track cards |
| `Create playlist`, `Save` | playlist create / rename forms |
| `Rename playlist <name>`, `Delete playlist <name>`, `Confirm delete playlist <name>` | playlist detail header |
| `Remove track` | playlist detail track row |
| `Move <title> up`, `Move <title> down` | playlist detail track row |
| `Previous page of tracks`, `Next page of tracks` | playlist detail pagination (must differ from Library pagination) |
| `<playlist name>` | sidebar playlist selector (accessible name may include a "Created …" suffix) |
| `<recent query>` (e.g. `bohemian rhapsody`) | recent searches chips |

## Headings (`getByRole("heading")`)

`Your playlists`, `<playlist name>` (detail view, removed from DOM after delete), `When you listen`, `Your consistency`.

## Visible text (`getByText`, exact)

Journal patterns panel: hour `HH:00`, weekday name, sentence `You most often play <genre> around HH:00.`, streak values `N days`, total active days as a bare number. Track cards: title and artist name as separate text nodes. Discovery tiles: genre name once (image `alt` must stay empty), and the tile is a link named by that genre.

## Menu text

`Add to playlist` (track actions menu trigger and panel).
