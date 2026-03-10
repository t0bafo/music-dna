

# SNITC Generator: Increase Minimum Track Count to 25+

## Root Cause Analysis

Three bottlenecks are capping output at 10-12 tracks:

1. **Artist search cap**: `artists.slice(0, 8)` — only queries 8 artists total per slot, regardless of how many are in the database
2. **Spotify limit per artist**: `limit=10` — only fetches 10 tracks per artist search
3. **Segment track counts**: `segmentTrackCount()` parses the blueprint ranges like `"1-3"` = 3 tracks, `"4-7"` = 4 tracks — these sum to only 10-12 per slot

## Plan

### 1. Edge Function (`supabase/functions/snitc-generator/index.ts`)

- **Increase artist search cap** from 8 to 20 (`artists.slice(0, 20)`)
- **Increase Spotify results per artist** from 10 to 20 (`limit=20`)
- **Multiply segment track counts by ~2.5x** so each segment yields more tracks. Change `segmentTrackCount()` to return a scaled-up count (e.g., `"1-3"` = 7 tracks, `"4-7"` = 10 tracks, `"8-10"` = 8 tracks) targeting 25 total
- Specifically: apply a multiplier of ~2.5 to the parsed range, with a minimum of 5 per segment

### 2. Artist Database (`artist-database.ts`)

- Update segment `tracks` ranges in each blueprint to reflect larger counts (e.g., `"1-7"`, `"8-17"`, `"18-25"`) so the progression labels match the actual output
- Increase `track_count` field on each blueprint from 10-17 to 25-30

### 3. Frontend (`src/pages/SNITCGenerator.tsx`)

- No changes needed — it already renders whatever tracks come back

### Summary of Key Changes

| Parameter | Current | New |
|---|---|---|
| Artists searched | 8 | 20 |
| Tracks per artist | 10 | 20 |
| Tracks per segment | 3-4 | 7-10 |
| Total output | 10-12 | 25-30 |

