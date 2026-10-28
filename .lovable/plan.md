# Album Mixtapes — Phase 1 (Engine) + Cleanup

## What you'll get
A tested "mixtape brain" that takes 2–5 albums and returns one ordered mixtape. No screens yet (that's Phase 2). Plus a tidy-up of leftover files nothing in the app uses.

## Part A — Mixtape engine
New files, nothing existing is changed:

```text
docs/specs/album-mixtapes.md        the spec, saved in the repo
src/lib/mixtape/
  types.ts        MixtapeTrack, MixtapeAlbum, MixtapeSettings, MixtapeResult
  features.ts     "is this value usable?" checks (bpm 40–250, energy/valence/danceability 0–1)
  random.ts       small seeded random generator (same seed = same result)
  select.ts       even share per album, spread across opener / middle / closer
  orderings.ts    journey, interleave, bpm_flow, energy_arc
  smoothing.ts    pins, no back-to-back album, trim by tracks/minutes, sides split
  index.ts        generateMixtape(albums, settings) — wires the steps together
src/lib/mixtape-engine.ts            public entry (re-exports index), as the prompt names it
src/lib/mixtape-engine.test.ts       all tests from the prompt
```

Split into small files so Phase 2–4 (picker, saving, export) plug in without growing one large file.

Pipeline: copy inputs → dedupe track ids across albums → check features (80% rule, otherwise journey + reason) → select → order → pins → no back-to-back → trim → sides → result with diagnostics.

Design choices to confirm:
- Seed only affects ties and which track is picked when several are equally good, so the default result stays stable and "Shuffle variation" gives a real but small change.
- Pins are applied after trimming too, so a pinned track is never cut off. A pin pointing to a track or slot that doesn't exist is ignored with a note.
- Default length when none is given: use every track (the spec leaves 20 tracks vs 60 min open).
- Sides split is by duration, at the track boundary closest to half.

Tests: add vitest + `npm test` script, small setup file, fixture albums (with and without features). I'll show the test output at the end.

## Part B — Cleanup (separate step, no behaviour change)
Delete files that nothing imports (I'll re-check each one before deleting):
- Components: ActionCards, AudioDNACard, ComparisonView, FlowTrackTable, MusicSignatureHero, NavLink, PlaylistGrid, SimplifiedMetricsGrid, SmartPlaylistCreator, TrackSuggestionsTool, charts/GenreBreakdownCard
- Hooks: use-native-app, use-push-notifications
- lib/spotify-deeplink, pages/Index (not routed)
- Keep TopAlbumsGrid (the spec reuses it for the album picker in Phase 2). TopSongsGrid will be double-checked.
- Remove leftover stray `console.log` debug lines.

Your prompt said not to touch existing pages in this phase. Cleanup only removes unused files, so no screen changes. Say if you'd rather do it later.

## Note on branches
I can't create a git branch from here; Lovable controls branches. To keep this off main, open this chat as a draft/branch in Lovable, or sync to GitHub and branch there before I start.
