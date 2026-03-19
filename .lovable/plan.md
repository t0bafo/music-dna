

# Update README to Showcase Music DNA

## What
Replace the boilerplate README with a polished project showcase that accurately reflects Music DNA — a Spotify-connected music intelligence platform.

## Plan

### Single file change: `README.md`

Rewrite to include:

1. **Hero section** — Project name, tagline ("Organize by Vibe, Not Genre"), live link to `musicdna.lovable.app`

2. **What it does** — Brief overview: connects to Spotify, analyzes listening DNA, organizes music into "crates" by vibe

3. **Key Features** (matching actual routes/components):
   - **Musical Identity** (`/home`) — Archetype detection, underground index, defining tracks, recent discoveries
   - **Crates** (`/crates`) — Vibe-based music organization, drag-and-drop, AI curation, Spotify export, shareable links
   - **Studio** (`/studio`) — Vibe search, playlist flow analysis, smart discovery engine
   - **Music Intelligence** (`/intelligence`) — BPM distribution, energy scatter plots, genre breakdown, listening patterns
   - **Your Music Year** — Spotify Wrapped-style analytics with time period tabs
   - **SNITC Generator** (`/snitc-generator`) — AI-powered playlist generation with save-to-crate
   - **Playlist Analysis** (`/playlist/:id`) — Flow scoring, appeal analysis, track-by-track optimization

4. **Tech Stack** — React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Tanstack Query, Capacitor (PWA + native), Lovable Cloud (backend functions, database, auth)

5. **Backend Functions** — List the 6 edge functions: ai-curation, music-intelligence, playlist-ai-coach, snitc-generator, spotify-public-token, vibe-search-expand

6. **Architecture note** — Spotify OAuth, audio feature extraction, AI-powered curation via backend functions

7. **Portfolio context** — Brief note positioning this as a Creative Technologist portfolio piece ("Engineering a Mirror" — translating musical feelings into actionable data structures)

8. **Getting Started** — Keep the local dev setup instructions (clone, install, dev)

