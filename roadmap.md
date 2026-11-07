# Crates-first redesign

## AI safeguards recheck (preview only)
- [x] Remove remaining sensitive logs and missing-energy scoring/explanation gaps.
- [x] Exercise actual gateway request builders with mock fetch, auth/limit gates, and literal search fallback.
- [x] Update audit with verified results and hosted/log-retention limitations; do not publish, deploy shared functions, or mutate crates.
- [ ] Deploy additional server safeguards (blocked: shared backend affects production; this pass is preview-only).

## Personalized sharing (current stack, production untouched)
- [x] Check isolated hosting: both test draft addresses returned 401 Unauthorized; no supported public isolated deployment available without publishing.
- [ ] Compare two personalized thumbnails through an official social preview tool (blocked: public crawler-ready test deployment unavailable).
- [x] Report standalone share-page hosting requirements; existing pre-rendering remains unverified, not disproven.
- [ ] Implement opt-in snapshot URL sharing, revocation and secondary image sharing only after the hosting boundary is resolved.

## Library product pass (preview only)
- [x] Library navigation, list/grid, recent history, direct saved-music search and return position.
- [x] New crate: empty starters, playlist preview/import, reused album mix with tucked-away customization.
- [x] Crate detail and compact landing actions; preserve share design and existing URLs.
- [x] Tests and 320px/390px/desktop fixture validation for create/add/refresh/find, import and album mix.
- [ ] Real Spotify create/add/refresh/find, playlist import and album mix (blocked: no eligible Spotify session available).

- [x] Sign-in lands on Crates (safe deep-link return kept); welcome tour retired.
- [x] Crates list: New Crate primary, AI secondary, two-line titles.
- [x] Name-first crate creation → opens Add Tracks once.
- [x] Crate page: Add Tracks opens Spotify search; other tools in menus; "Search tracks in this crate".
- [x] Analysis: no invented scores, chart gaps, coverage, popularity signal labeled.
- [x] Landing rebuilt around the Lagos Night Drive sample crate.
- [ ] Signed-in QA with a test Spotify account (blocked: needs user sign-in).
- [ ] Spotify dashboard follow-ups — see docs/redesign-followups.md (blocked: dashboard access).
