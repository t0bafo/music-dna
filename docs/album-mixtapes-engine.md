# Album Mixtapes — Phase 1 handoff

## Delivered

The approved Phase 1 engine and dead-code cleanup are complete. No existing screens, crate APIs, or database schema were changed. No Python/MIR runtime dependency was added.

```ts
import { generateMixtape, type MixtapeAlbum } from '@/lib/mixtape-engine';

// Album tracks are supplied by the caller; this module never fetches data.
function curate(albums: MixtapeAlbum[]) {
  return generateMixtape(albums, {
    ordering: 'journey',
    targetTracks: 20,
    sides: true,
    pinned: {}, // zero-based slot -> Spotify track ID
    seed: 0,
  });
}
```

The result contains ordered `tracks`, optional `sides: { a, b }` (track counts), and `diagnostics` with disabled ordering reasons, missing-feature count, and notes. Returned tracks and artists are copied; inputs are not mutated.

## Structure

| File | Responsibility |
| --- | --- |
| `src/lib/mixtape-engine.ts` | Stable public entry |
| `src/lib/mixtape/types.ts` | Input, settings, result contracts |
| `src/lib/mixtape/features.ts` | Validity and 80% feature threshold |
| `src/lib/mixtape/random.ts` | Deterministic seeded random generator |
| `src/lib/mixtape/select.ts` | Pin-aware quotas and spread selection |
| `src/lib/mixtape/orderings.ts` | Four ordering strategies |
| `src/lib/mixtape/smoothing.ts` | Pins, adjacency, minute prefix, sides |
| `src/lib/mixtape/index.ts` | Validation, normalization, orchestration |
| `src/lib/mixtape-engine.test.ts` | Rule-based tests |

## Rules and precedence

- Expected album count is 2–5. Outside this range, the engine returns a diagnostic rather than throwing; the future picker must enforce the selection range.
- Track IDs are globally deduplicated; the earlier selected album owns shared tracks.
- Albums are sorted by disc and track number; normalized album position is calculated before deduplication so a shared track does not stretch the remaining album arc.
- With no target, all unique tracks are used. A count target is a non-negative integer; minutes must be finite and non-negative. Setting both throws `RangeError`. Invalid/non-finite or negative track durations also throw.
- Journey merges album positions with user album-order tie breaks. Interleave is round-robin. BPM Flow starts from a valid BPM opener pinned to slot 0, or the first valid Journey opener. Energy Arc uses low third ascending, high third ascending, then middle third descending.
- BPM and Energy styles require at least 80% valid BPM or energy coverage respectively. Below the threshold, generation falls back to Journey and explains why. BPM range is 40–250; energy, valence, and danceability range is 0–1.
- Shorter count targets use even album quotas and spread selection. Pins are reserved before filling quotas. Clustered pins may override an album's share, never the requested count.
- Pins override ordering and adjacency. Unknown IDs, duplicate pins, invalid positions, or slots outside the requested count are ignored with diagnostics.
- Smoothing pulls a later free track forward rather than swapping, preserving unpinned album order. It looks ahead to pinned neighbors. Adjacency can remain when separating it would require moving pins or no other album remains; pin conflicts are reported.
- Minute limits retain the largest prefix within the limit, unless retaining a valid pinned slot requires a longer prefix. The overrun is reported explicitly.
- Sides split at the interior track boundary closest to half the final total duration. Empty/single-track results have zero tracks on Side B.
- Same input and seed produce identical output. Seed variation changes sampling and equal-score choices, not arbitrary album track order. A different seed need not change output when there are no meaningful choices.

## Verification

Run `npm test` or `bun run test`. The suite covers the four strategies, deterministic variation, input immutability, album order and shares, exact spread selection, pins and their conflicts, count/minute limits, sides, the 80% threshold, fallback, duplicate tracks, small pools, and invalid inputs.

## Cleanup

Removed 16 confirmed-unreferenced files from the approved cleanup list: ActionCards, AudioDNACard, ComparisonView, FlowTrackTable, MusicSignatureHero, NavLink, PlaylistGrid, SimplifiedMetricsGrid, SmartPlaylistCreator, TrackSuggestionsTool, GenreBreakdownCard, TopSongsGrid, use-native-app, use-push-notifications, spotify-deeplink, and the unrouted Index page. Retained TopAlbumsGrid for the upcoming album picker. Active operational logs in backend functions were left unchanged; stray frontend debug logs in the deleted code disappeared with those files. No dependency or database removal was attempted.

## Still required for the user-facing feature

1. Spotify saved-album pagination/search and album-track helpers; optional cached ReccoBeats enrichment.
2. `/mixtapes/new` picker/settings/preview, 2–5 album enforcement, album ordering, pin/removal/reorder controls, disabled style reasons, and entry points on Crates/Home.
3. Atomic crate + mixtape-settings persistence through the existing token-validated backend actions, with ownership checks and ordered track writes.
4. Existing Spotify export/sync integration, edit-from-crate, and sides description.
5. Signed-in end-to-end checks of generation, saving, reopening, and export. Those flows cannot be checked in Phase 1 because their UI and persistence do not exist yet.