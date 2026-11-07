# Architecture rules

- AI Curation and vibe expansion share a server-only text-message transport; keep Spotify candidates and identity context outside its request builders, and test the real transport with injected fetch.
- AI curation quality uses only measured energy and adjacent known pairs; nullable quality fields prevent missing measurements from appearing as confirmed scores.

- Keep Album Mixtapes generation in pure TypeScript modules under `src/lib/mixtape`, exposed through `src/lib/mixtape-engine.ts`; this isolates ordering and selection from later UI and persistence integration.
- Keep mixtape rule tests next to the public engine entry and run them with the repository test command; this protects ordering, pins, length limits, and feature fallbacks during refactors.
- Theme lives in semantic tokens in `src/index.css`; sleeve surfaces use the `.sleeve-ink`, `.sleeve-groove` and `.label-meta` classes so texture stays scoped to sleeves and components never hardcode palette values.
- Library keeps existing `/crates` URLs and reuses one New crate dialog for empty, playlist import, and album mix; account-scoped session history is navigation convenience only, never authorization.
- Playlist import is read-only against Spotify, paginates all source tracks, and retries track saving against the same newly created crate to avoid duplicate collections.
