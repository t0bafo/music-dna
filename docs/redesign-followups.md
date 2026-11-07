# Crates-first redesign — follow-ups and release checklist

## Deliberately not changed in this pass
- OAuth scopes, callback settings, tokens, database schema, Spotify write behavior, sync preferences.

## Follow-ups (need Spotify dashboard / deployment access)
- Spotify consent screen shows an app name that does not match "Music DNA" — rename in the Spotify developer dashboard.
- Decide whether playlist write scopes can be requested only at first Export/Sync instead of at sign-in.
- Export and sync have not been tested end to end against a test account; record results before claiming them.

## Publish checklist
- [ ] Guest: landing → Explore a sample crate → search → back, without Spotify.
- [ ] New user (test account): create crate with only a name → Add Tracks opens once → save a track → reload → find it with "Search tracks in this crate".
- [ ] Returning user: similar crate titles readable (2 lines, full title on hover); Taste (Home), Studio, crate menu reachable.
- [ ] Failure states: empty Spotify search, failed save keeps selection, expired session returns to sign-in.
- [ ] Analysis: crate with no audio data shows "Not enough audio data" and no overall score; partial data shows chart gaps and coverage.
- [ ] Mobile 375px: no horizontal overflow, search dialog usable.
- [ ] Studio shows the Album Mixtapes card on the candidate build.
- [ ] After publishing, load musicdna.tobiafo.com/studio and confirm Album Mixtapes is visible (published bundle was stale before).
