# Music DNA Ideas

## Pocket Mix and the streaming provider wrapper

Music DNA helps listeners find the tracks they don't want to lose. A crate is a collection organized around a mood, moment, scene, or set. I want the crate to stay useful when a listener changes streaming services or leaves their phone behind.

### What we know

Music DNA already has a Spotify flow. I tested creating a crate, exporting it as a Spotify playlist, and syncing that playlist to a Mighty 3 audio player. The curation worked for me; getting it onto the device took several steps. That's a personal observation, not a usability study.

### The idea

Keep the crate and its ordering in Music DNA, with provider playlist IDs stored as links rather than as the crate's identity. A streaming provider adapter would resolve each recording against the destination catalog, surface missing or ambiguous matches, and create a playlist with the user's permission. It should preserve order, distinguish alternate recordings and versions, and make retries safe. Keep the existing Spotify workflow working while testing another provider.

- **Apple Music:** A candidate for the first portability test. [Apple documents creating a library playlist](https://developer.apple.com/documentation/applemusicapi/create-a-new-library-playlist) with a Music User Token. Start with one crate, one authorized account, and one verified playlist. This does not establish Apple Music playback on Mighty.
- **Amazon Music:** The candidate for Pocket Mix's screenless listening test. [Amazon documents its Web API as closed beta](https://developer.amazon.com/docs/music/API_web_LWA.html), so automated playlist creation depends on access. Start by creating a playlist manually and testing it through [Mighty's supported Amazon Music workflow](https://bemighty.com/pages/spotify-update).

### How the pieces fit

- **Music DNA** is the listener's library and the place to curate and sequence crates.
- **Diaspora MIR Engine** explores culturally informed audio descriptors that could improve discovery and sequencing. It's a research input whose usefulness should be evaluated separately from whether exports work.
- **The wrapper** handles catalog matching and playlist delivery. It does not own playback, audio files, or device sync.
- **Pocket Mix** tests whether curated playlists make it to a screenless device reliably and whether listeners come back to use them. The partner concept puts the experience inside Amazon Music and uses Mighty's existing sync path. It doesn't require a third app in the listener's daily flow.

Longer term, the business idea is to help partners offer better music experiences by embedding curation and catalog intelligence inside their own products. That's a direction to explore, not an existing integration or partnership.

### Start here in Antigravity

Read the current Spotify auth, export, and sync paths and trace how a crate is linked to a Spotify playlist. Identify the smallest seam for a second provider and show which changes would affect the Lovable app. Propose a one-crate test with exact, ambiguous, and missing matches; verify the playlist's order and report partial failures clearly. Separately, test whether a manually created Amazon playlist syncs and plays offline on Mighty. Compare steps and successful completion against the observed Spotify path before proposing tighter integration. Keep sequencing quality and delivery reliability separate so we know which change helped.

This is a public concept brief. The full Pocket Mix report remains private.
