# AI data audit — what leaves the app

Scope: `supabase/functions/ai-curation` and `supabase/functions/vibe-search-expand`.
Both call the Lovable AI Gateway (`ai.gateway.lovable.dev`, model `google/gemini-2.5-flash`).
No changes were made to either function in this pass.

## vibe-search-expand

| Input | Source | Destination | Notes / defaults |
|---|---|---|---|
| `query` (free text) | User typing in crate search (`src/hooks/use-vibe-search.ts`), debounced 400 ms, ≥ 2 chars | AI Gateway (user message) | Single-word queries are skipped — no model call. |
| Fixed system prompt | Function source | AI Gateway | Static. |
| `query` | — | Function logs (`console.log`) | Search text is written to logs. |

- Auth: `verify_jwt = false` and no token check — any caller can trigger a model call (cost/abuse risk, no user data exposed).
- Nothing Spotify-derived is sent. Output is a filter object applied locally.
- Failure modes return `filters: null` (rate limit, no key, bad JSON) → literal search still works.

## ai-curation

Auth: requires `x-spotify-token`, validated against Spotify `/v1/me`; `userId` = Spotify user id.

| Action | Input | Source | Destination | Defaults |
|---|---|---|---|---|
| `generate_crate` step 1 | `prompt` (≥ 5 chars) | User | AI Gateway | — |
| `generate_crate` step 2 | Up to **40 candidate tracks per section**: id, name, artist, up to 3 genres, BPM, energy, popularity, source | `track_cache` (user's synced Spotify library), Spotify top tracks / recommendations / search | AI Gateway | **energy defaults to 50 when missing**; source defaults to `library`; BPM may be `undefined` |
| `generate_crate` | prompt, structure, user id | — | Function logs | prompt and Spotify user id are logged |
| `save_crate` | crate + tracks | Client | Database (`crates`, `crate_tracks`) | duration defaults to 210000 ms |
| `backfill_genres` | up to 100 cached artist ids | `track_cache` | Spotify API only (no AI) | — |

Other defaults/fallbacks: if the model's track pick fails to parse, the first N candidates are used; `max_tokens: 2000`.

### Findings
1. **Spotify-derived content is sent to the model** in `generate_crate` step 2 (track names, artists, genres, audio features, popularity from the user's library). Disclose this in the AI Curation UI or reduce it before expanding AI use.
2. **Fabricated value**: missing energy is sent as 50%, which the model treats as real data.
3. Prompts and Spotify user ids are logged.
4. `vibe-search-expand` is unauthenticated.

## Search by memory (prototype)

`src/lib/memory-search.ts` — pure, local, no model calls. It reads only text the
user (or demo data) wrote: crate name, crate liner notes, per-track notes. It
returns interpretations the user can remove and a quoted evidence snippet for
every match. Literal title/artist search stays the default and runs first.
It never creates or modifies crates. Demo lives on the sample crate page.
