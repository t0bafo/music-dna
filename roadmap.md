# Crates-first redesign

## Personalized sharing (current stack, production untouched)
- [ ] Check existing pre-rendering support for two distinct public `/s/:id` thumbnails in an isolated deployment.
- [ ] Verify with a supported social preview tool or messaging app where accessible; distinguish metadata evidence from messaging evidence.
- [ ] Report standalone share-page hosting requirements if existing hosting cannot satisfy personalized previews.
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
