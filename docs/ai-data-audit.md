# AI data audit — what leaves the app

Scope: `supabase/functions/ai-curation` and `supabase/functions/vibe-search-expand`.
Both source files use Lovable AI Gateway (`ai.gateway.lovable.dev`, model `google/gemini-3.8-flash`). Existing model, endpoint and output limits are preserved.

## Current status — Nov 7, 2026, 12:35 UTC

This recheck changes preview source only. No publishing, shared function deployment,
log deletion, real-crate updates or per-track notes were performed. Cloud functions
are shared with production: the additional server fixes below are **not deployed**.

- The actual shared HTTP transport (`_shared/ai-request.ts`) is tested through an
  injected mock fetch, rather than constructing a separate illustrative request.
  Curation sends fixed instructions plus the user's description, limited to 500
  characters; vibe expansion sends fixed instructions plus query text. Neither
  request includes candidate tracks, account IDs or Spotify tokens. Selection is
  deterministic, after description interpretation, and never calls the model.
- Fixed a reproduced search bug: missing BPM and energy previously received a
  combined-filter bonus. Unknown measurements now never earn that bonus; valid
  energy zero remains eligible for low-energy matches.
- Curation energy quality now reports unknown flow/balance when evidence is missing,
  does not bridge unknown tracks when assessing transitions, and leaves overall
  quality unknown when either score is unavailable. The preview reports measurement
  coverage and labels section prose as planned mood, not measured evidence.
- Removed the still-present browser top-results payload and raw caught-error logs;
  removed server error objects, derived target genres/ranges and crate identifiers.
  Remaining diagnostics are static stages, counts and error status/codes.
- Kept the existing valid-Spotify-session check and 20 requests / 600 seconds limit.
  Authentication and limiter failures now fail closed before the model. Single words
  bypass both checks because they make no AI call. Terminal upstream errors preserve
  their status and safe message, without retries.
- AI Curation discloses description-only use before Generate and now has a matching
  500-character input maximum. The old `useVibeSearch` hook has **no active UI caller**;
  if reintroduced, its optional AI action must receive a visible query-only disclosure
  before invocation. Current sample memory search remains local and unchanged.

### Validation in this recheck
- `bun run test`: **74 tests passed**, including 19 AI-boundary tests.
- The mock captures the real transport request for both paths, checking absence of
  track identifiers/metadata and identity/token context; curation keeps its 2000-token cap.
- Checks cover zero/missing energy, unknown quality, unknown transition gaps, unauthorized
  and rate-limited requests, protection-service failures, single-word bypass, terminal
  denial with one call only, model-unavailable fallback, and literal title/artist search.
- Chromium signed-out `/sample/lagos-night-drive`: searching Tems displays Essence and
  Free Mind, with zero page errors; screenshot checked. This is not signed-in verification.
- Preview compilation reported `build OK` after edits.

### Log history and remaining limitations
- Targeted recent log searches returned no entries for ai-curation (`analyzing`) and
  vibe-search-expand (`query`). This **does not establish that older logs do not exist**.
- Cloud Logs document searching/filtering and relative or absolute time ranges; these
  are viewing controls, not a verified retention duration or deletion control.
  https://docs.lovable.dev/features/logs
- No documented per-entry delete/purge or configurable retention control was verified
  for Cloud function or AI Gateway logs. Workspace audit-log retention is a separate
  facility and must not be applied to these logs. No logs were deleted.
- Existing hosted rate-limit function/table permissions and persistence were not
  reverified here; the existing limiter was reused without a migration or changed limit.
- Real provider availability and signed-in model requests were not tested: mock-gateway
  success is not a live-provider result. New server fixes await deployment to the shared
  backend; deploying them would affect production even without publishing the frontend.
- Signed-in Home, Crates, Add to Crate and Share remain a separate browser pass requiring
  an eligible Spotify session; they are **not verified** by these sample tests.

## Historical baseline (before the earlier fixes)
The findings below describe the original audit, not the current preview implementation.

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

---

## Fixes applied (Nov 7, 2026)

1. **No Spotify-derived data reaches the model.** The track-selection model call
   (`selectBestTracks`) was removed. The model now receives only the user's description
   (capped at 500 chars) via `buildStructureMessages` in
   `supabase/functions/_shared/curation-core.ts` — the single builder of model input,
   which accepts a string only. Candidates are ranked deterministically in the backend
   by `rankCandidates` (BPM fit, energy fit, genre match, source, max 2 per artist).
2. **Missing energy is unknown.** `knownEnergy` keeps 0 and returns null for missing.
   The score is the mean of available signals, so missing energy neither helps nor hurts.
   The library query no longer drops tracks with null energy. No "50%" placeholder remains.
3. **Logging minimized.** Removed descriptions, Spotify account ids, search queries,
   track names and raw gateway error bodies from logs in both functions and from the
   client vibe-search hook. Errors log status/codes only. The AI Curation dialog now
   states: only the typed description is sent; Spotify tracks are ranked in-app.
4. **Vibe search protected.** Requires a valid Spotify session (`x-spotify-token`
   checked against `/v1/me`) and a per-user limit of 20 calls / 10 min, stored in
   `ai_rate_limits` under a SHA-256 key (no raw account id). Both checks run before any
   model call (`handleVibeSearch` in `_shared/vibe-search-core.ts`). Single-word
   queries return immediately with no auth or model call.

### Earlier tests (`src/lib/server/ai-boundaries.test.ts`, then 12 tests)
- Mock-gateway request body contains the description and no track ids, titles, artists or account id.
- Description length cap.
- Zero vs missing energy; missing energy is score-neutral; zero is ranked as low energy.
- Signed-out → 401 and rate-limited → 429, both with zero model calls.
- Single-word bypass skips auth and model.
- Only the query text is passed to the model.
- Model unavailable → `filters: null` (search keeps working).
- Rate-limit key does not contain the Spotify id.
- Title/artist search works with no AI filters.

### Live checks against deployed functions
- `vibe-search-expand` "Tems" → 200 skipped; multi-word without token → 401; with bad token → 401.
- `ai-curation` without token → 401.

### Unverified
- A real signed-in vibe search and AI Curation run (needs a Spotify session).
- Older logs: a log search found no matching entries in the retained window, but I could
  not confirm the platform's retention period, and there is no per-entry delete control
  available from the app. Nothing was deleted.
- Signed-in Home, Crates, Add to Crate and Share still need a separate browser pass.

## Personalized share links — not built

Per-link Open Graph tags must be in the response seen by the messaging crawler.
This app is a static single-page site, but Lovable's current documentation describes
pre-rendered published pages for **verified search engines and social-preview bots**.
That does not establish support for distinct dynamic `/s/:id` thumbnails. The earlier
claim that a full stack migration was the only viable option was too strong.

Serving HTML directly from a backend function was previously tested: the platform
forced `Content-Type: text/plain` with a sandbox CSP. That is a limitation of that
endpoint, not proof that published-page crawler pre-rendering cannot work.

Nov 7 follow-up: a separate draft hosting probe uses only fictional snapshots, with
no publishing, backend mutations, or production changes. Requests to a nonexistent
production `/s/hosting-probe` path with Facebook, WhatsApp and Twitter user agents
returned the generic site title and image. This is a baseline only: spoofing an agent
string does not make it a verified social crawler, and the path has no snapshot.

If route-specific pre-rendering cannot be verified in an isolated published test,
the smallest independent alternative is a standalone share-page service on a new
subdomain. Keeping `/s/:id` on the main domain would instead require a controlled
reverse proxy for those paths; Lovable's static hosting has no documented `_redirects`
or per-path server proxy configuration. The existing Vite application can remain
unchanged in either approach. No migration was started.

Reference: https://docs.lovable.dev/features/upgrade-to-tanstack-start

### Isolated probe outcome
Both draft addresses `/s/test-late-drive` and `/s/test-global-soul` returned HTTP 401,
`text/plain; charset=UTF-8`, `Unauthorized`, including at the draft root. No fictional
snapshot routes were created after that access blocker was confirmed. No supported
public crawler-ready draft deployment was available without publishing.
LinkedIn Post Inspector's input page was accessible; Meta Sharing Debugger required
login. Neither received two implemented public snapshot URLs, so no personalized
thumbnail comparison or actual iMessage/WhatsApp test ran. The result is **unverified**,
not a finding that published Classic pre-rendering cannot work.
