# Library preview pass

## Shipped in preview only
- Existing `/crates`, `/crates/:id`, `/home`, `/studio`, share URLs, and Spotify callback behavior are retained. Normal sign-in already defaults to `/crates` with safe return destinations honored.
- Navigation is Library / My DNA / Studio. Library defaults to compact rows with an optional sleeve grid, artwork from saved tracks, wrapping collection titles and counts.
- Recently opened collections use real, account-scoped session history, limited to three displayed collections. No invented history. Search/view/scroll state is retained for return navigation where browser storage is available.
- Direct saved title/artist/album search runs locally over the existing authenticated cross-crate fetch, with crate matches separate from track matches. Track links highlight and scroll to the saved track. No AI request is made by Library search; existing AI tools remain secondary.
- New crate contains empty creation with three editable name/note starters, a read-only paginated Spotify playlist import with track preview and fallback messages, and the existing album mixer with Journey default and advanced customization tucked away.
- Import and album saves reuse the created crate ID after a track-save failure. No Spotify source playlists are modified by import. Unavailable tracks/local files/podcasts are skipped; duplicate songs are saved once.
- Landing keeps Lagos Night Drive close to compact primary sample and outlined Spotify buttons. Share card design is unchanged.

## Verified
- Existing tests plus Library rules and playlist pagination/read-only coverage.
- Chromium at 320px, 390px, and 1280px: landing actions, Library, long titles, New crate, crate detail, no search matches, empty library.
- Disposable in-memory browser fixtures: create empty crate → add song → refresh → find saved song from Library → open highlighted track; playlist preview → save → read back two tracks; select two albums → preview Journey → save → read back 20 tracks.
- Return-to-Library search restoration, no invented recently opened section, and no page errors in those flows.

## Not verified
An eligible Spotify OAuth session is not available in this sandbox. The browser fixtures are not a real Spotify account and do not establish live playlist eligibility, actual hosted create/add persistence, or live album import. Lovable Cloud auth sessions cannot substitute for this app's Spotify identity. Repeat the three saving flows with disposable crates in an eligible signed-in preview before publishing.

No production user data, schema, or deployment settings were changed; nothing was published.