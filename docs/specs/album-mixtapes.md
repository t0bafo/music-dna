# Album Mixtapes — Requirements Spec (Music DNA web app)

Target project: [t0bafo/music-dna](https://github.com/t0bafo/music-dna) (Lovable, React + TypeScript + Vite, Supabase, Spotify OAuth, ReccoBeats).
Status: Phase 1 engine implemented and tested. Album picker, preview UI, persistence, and export integration are not implemented yet.
Origin: replaces the Python "Album Playlist Curator" prototype that briefly lived in `diaspora-mir-engine` (`packages/music_dna`). That prototype was removed from the MIR repo; its useful ideas are carried over below. Nothing in this spec depends on the MIR repo.

---

## 1. Goal

Let a listener pick a few albums from their Spotify library and get back one mixtape that weaves those albums together, then save it as a crate and/or export it to Spotify.

A mixtape is an **ordered Spotify playlist** built from tracks of 2–5 source albums. No audio files, no downloads, no audio mixing.

## 2. User stories

1. As a listener, I can browse my saved Spotify albums (and search Spotify for others) and select 2–5 of them.
2. I can choose a length (track count or target minutes) and an ordering style, then generate a mixtape.
3. I see a preview with each track's source album, can drag to reorder, remove tracks, pin a track to its slot, and regenerate around my pins.
4. I can save the mixtape as a crate (so it shows up in Crates like everything else) and export it to Spotify with the existing export flow.
5. I can reopen a saved mixtape, change the settings, and regenerate.

## 3. Out of scope

- Audio mixing, crossfades, beatmatching, or rendering an audio file.
- Local/owned audio files and the MIR engine (see section 11).
- Non-Spotify sources.
- Album recommendations ("albums like this") — possible later phase, not v1.

## 4. What already exists in Music DNA and should be reused

| Need | Existing piece |
| --- | --- |
| Spotify auth and token, `user-library-read` scope | `src/lib/spotify-auth.ts`, `src/contexts/AuthContext.tsx` |
| Spotify fetch helpers | `src/lib/spotify-api.ts` (`getSavedTracks`, `createPlaylist`, `addTracksToPlaylist`) |
| Audio features (bpm, energy, danceability, valence) | `getAudioFeaturesFromReccoBeats` in `src/lib/spotify-api.ts`, cached in `track_cache` |
| Album art/grid UI | `src/components/TopAlbumsGrid.tsx` |
| Reorderable track list | `src/components/DraggableTrackTable.tsx` |
| Flow scoring and BPM issues | `src/lib/flow-analysis.ts` (`calculateFlowScore`, `extractBpmIssues`), `FlowScoreCard` |
| Saving ordered tracks | crates: `crates` + `crate_tracks(position)` via `src/lib/crates-api.ts` and the `music-intelligence` edge function |
| Spotify export and sync | `ExportToSpotifyModal`, `src/lib/spotify-sync.ts` (`createAndLinkPlaylist`, `syncCrateToSpotify`) |

Rule: a saved mixtape **is a crate** plus a small settings row. This keeps Crates, sharing (`/crates/:crateId/share`), export and sync working without new code paths.

## 5. Data

### 5.1 Spotify endpoints (new helpers in `src/lib/spotify-api.ts`)

- `GET /me/albums?limit=50&offset=…` — saved albums (paginate).
- `GET /search?type=album&q=…` — find albums not in the library.
- `GET /albums?ids=…` (up to 20) — album metadata incl. `total_tracks`, images, release date.
- `GET /albums/{id}/tracks?limit=50` — tracks with `track_number`, `disc_number`, `duration_ms`.

Spotify's own audio-features and recommendations endpoints are not available to this app; keep using ReccoBeats for features, and treat them as **optional** (mixtapes must generate even when features are missing).

### 5.2 Per-track working model (client side)

```ts
interface MixtapeTrack {
  trackId: string;
  albumId: string;
  albumName: string;
  name: string;
  artists: string[];
  durationMs: number;
  discNumber: number;
  trackNumber: number;
  albumPosition: number; // 0..1, (index within album) / (album track count - 1)
  bpm?: number;          // ReccoBeats, optional
  energy?: number;
  valence?: number;
  danceability?: number;
}
```

### 5.3 Supabase (one new table, writes go through the `music-intelligence` edge function like crates do)

```sql
CREATE TABLE public.mixtapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  crate_id UUID NOT NULL REFERENCES public.crates(id) ON DELETE CASCADE,
  source_album_ids TEXT[] NOT NULL,
  ordering TEXT NOT NULL CHECK (ordering IN ('journey','interleave','bpm_flow','energy_arc')),
  target_tracks INTEGER,
  target_minutes INTEGER,
  sides BOOLEAN NOT NULL DEFAULT false,
  pinned JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "<position>": "<track_id>" }
  seed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mixtapes_user_id ON public.mixtapes(user_id);
CREATE UNIQUE INDEX idx_mixtapes_crate_id ON public.mixtapes(crate_id);
```

Same RLS approach as `crates` (access only through the edge function with Spotify token validation). The ordered track list lives in `crate_tracks.position`; the mixtape row only stores how it was generated.

## 6. Ordering methods

All live in a new pure module `src/lib/mixtape-engine.ts` (no React, no fetch) so they are unit-testable.

1. **Journey (default)** — position merge. Each track gets `albumPosition` (0 = opener, 1 = closer). Merge all albums' tracks sorted by `albumPosition`, so openers open the mixtape and closers close it, and each album's internal arc is preserved. Ties broken by album order chosen by the user.
2. **Interleave** — round-robin A, B, C, A, B, C… in each album's track order. Generalized to N albums (the Python prototype only handled two).
3. **BPM flow** — greedy nearest-neighbor on bpm starting from the chosen opener; requires bpm on at least 80% of tracks, otherwise disabled with a tooltip.
4. **Energy arc** — build, peak, cool-down: sort by energy, split into thirds, ascending / high / descending. Same 80% rule.

Selection (when the target is shorter than all tracks combined): keep an even share per album (`ceil(target / albums)`), choosing tracks spread across each album's length (sample by `albumPosition`) so every album contributes its opener-ish, middle and closer-ish tracks. User pins always survive selection.

## 7. Smoothing rules (applied after ordering, in this order)

1. **Pins** — pinned tracks stay at their slot; ordering fills around them.
2. **No back-to-back album** — if two adjacent tracks share an album, swap the second with the nearest later track from a different album. Skip only when impossible (e.g., one album left).
3. **Length** — trim to `target_tracks`, or to the largest prefix under `target_minutes`.
4. **Sides (optional)** — split into Side A / Side B at the track closest to half the total duration; show a divider in the preview; Spotify export stays one playlist with "(A)"/"(B)" noted in the description.
5. **Determinism** — same inputs + same `seed` produce the same mixtape; "Shuffle variation" increments `seed`.

After smoothing, show the existing flow score (`calculateFlowScore`) when features are available.

## 8. UI flow

New route `/mixtapes/new` (and an entry point button on `/crates` and on the home albums section).

1. **Pick albums** — grid of saved albums (reuse `TopAlbumsGrid` styling) with search; select 2–5; selected tray shows order (drag to reorder albums, which sets tie-breaks).
2. **Settings** — length (tracks or minutes), ordering style (4 options, with disabled state + reason when features are missing), Sides toggle.
3. **Preview** — `DraggableTrackTable` with a source-album color chip per row, pin toggle, remove, "Regenerate" (respects pins), "Shuffle variation", flow score card.
4. **Save** — name (default "Album A × Album B"), emoji, then creates crate + mixtape row. Offer "Export to Spotify" using `ExportToSpotifyModal`.
5. Reopening a crate that has a mixtape row shows an "Edit mixtape" button that returns to step 2 with saved settings.

Mobile: same steps as full-screen sheets, consistent with the existing bottom-nav layout.

## 9. Acceptance criteria

- Selecting 2–5 albums and generating with default settings produces a playlist in under 2 seconds after album tracks are loaded (excluding Spotify network time).
- Journey ordering: for any two tracks from the same album, their relative order matches the album order.
- No two adjacent tracks share an album unless only one album still has tracks left.
- Every selected album contributes at least `floor(target / albums)` tracks when it has that many.
- Pinned tracks remain at their positions after regenerate and shuffle.
- Missing ReccoBeats features never block generation; BPM flow and Energy arc are disabled with a reason instead.
- Saving creates exactly one crate and one `mixtapes` row; the crate appears on `/crates` with the right track count and order.
- Export creates one Spotify playlist with the same order (existing export flow).
- Unit tests for `src/lib/mixtape-engine.ts` cover the four orderings, selection, pins, no-back-to-back, length trimming and sides.

## 10. Phases

1. **Engine** — `mixtape-engine.ts` + unit tests, using fixture albums. No UI.
2. **Album picker + preview** — Spotify album helpers, `/mixtapes/new`, generate and preview in memory.
3. **Save and export** — `mixtapes` migration, edge function actions (`create_mixtape`, `update_mixtape`, `get_mixtape`), crate creation, export.
4. **Polish** — Sides, pins, shuffle variation, edit-from-crate, mobile sheets.

## 11. Open questions

1. Which 2–3 albums should be the test set for tuning Journey ordering?
2. Default length: 20 tracks or 60 minutes?
3. Should mixtapes be shareable like crates on day one (`/crates/:id/share` would work automatically)?
4. Allow albums not in the user's library (search), or saved albums only for v1?
5. Later, should Music DNA ever read MIR-engine features? Only as an optional import (e.g., a JSON of per-track features keyed by Spotify id); never a runtime dependency on the Python repo.

## 12. Constraints

- Spotify app is in Development Mode: only registered users can log in; keep requests paginated and cached (`track_cache`).
- All database writes go through the `music-intelligence` edge function with token validation, same as crates.
- No new heavy dependencies; the engine is plain TypeScript. The repo has no test runner yet, so Phase 1 adds `vitest` as a dev dependency and an `npm test` script.
- New edge function actions follow the existing `switch (action)` in `supabase/functions/music-intelligence/index.ts` (next to `create_crate`, `update_crate`).

## 13. Phase 1 implementation notes

The public engine entry is `src/lib/mixtape-engine.ts`; implementation is split into pure modules under `src/lib/mixtape/`. See [engine handoff](../album-mixtapes-engine.md) for usage, validation, diagnostics, tests, and subsequent phases.

Resolved precedence from the approved Phase 1 plan:

- With no length target, use every unique available track. A track target and a minute target cannot be set together.
- Pins take priority over adjacency, Journey order, and minute limits. A minute-limit overrun caused by pins is reported in diagnostics. Pins outside the requested track-count result are ignored with a note.
- Album quotas reserve pinned tracks first and distribute remaining slots as evenly as possible. Clustered pins can override even album shares; they do not inflate the track target.
- Journey preserves disc/track order when no pins override it. Album positions are normalized from that order before selection.
- Invalid lengths and durations raise `RangeError`. Missing optional audio features never prevent Journey or Interleave generation.

---

## Lovable prompt (paste-ready)

> Add an "Album Mixtapes" feature. Read `docs/specs/album-mixtapes.md` first.
> Phase 1 only: create `src/lib/mixtape-engine.ts`, a pure TypeScript module (no React, no fetch) exporting `generateMixtape(albums, settings)` where `albums` is an array of `{ albumId, albumName, tracks: MixtapeTrack[] }` and `settings` is `{ ordering: 'journey' | 'interleave' | 'bpm_flow' | 'energy_arc', targetTracks?: number, targetMinutes?: number, sides?: boolean, pinned?: Record<number, string>, seed?: number }`. Implement the four orderings, the per-album selection, and the smoothing rules (pins, no back-to-back album, length, sides, deterministic seed) exactly as in sections 6 and 7. Add `vitest` as a dev dependency with an `npm test` script, and add unit tests for every acceptance criterion in section 9 that applies to the engine. Do not change any existing pages, crates code, or Supabase schema in this phase.