# 🧬 Music DNA

**Organize by Vibe, Not Genre.**

A Spotify-connected music intelligence platform that analyzes your listening DNA, surfaces hidden patterns in your taste, and organizes your library into vibe-based collections called *Crates*.

🔗 **Live:** [musicdna.lovable.app](https://musicdna.lovable.app)

---

## What It Does

Music DNA connects to your Spotify account, extracts audio features across your entire library, and builds a rich profile of your musical identity. It goes beyond surface-level stats — analyzing tempo, energy, danceability, valence, and popularity to reveal the DNA of your taste.

From there, you can organize tracks into Crates (vibe-based collections), generate AI-curated playlists, analyze playlist flow, and discover tracks from your own library you forgot about.

---

## Key Features

### 🎭 Musical Identity (`/home`)
Your musical fingerprint. Archetype detection (e.g. "The Curator," "The Explorer"), underground index, top defining tracks, recent discoveries, and stat cards — all derived from audio feature analysis.

### 📦 Crates (`/crates`)
Vibe-based music organization. Create collections by mood, energy, or context. Drag-and-drop reordering, AI-powered curation, vibe tagging, quality scoring, Spotify playlist export, and shareable public links.

### 🎛️ Studio (`/studio`)
Your production toolkit. Natural language vibe search across your library, playlist flow analysis with transition scoring, and a smart discovery engine that surfaces tracks matching specific audio parameters.

### 📊 Music Intelligence (`/intelligence`)
Deep analytics on your library. BPM distribution charts, energy × danceability scatter plots, genre breakdown, top listened artists, and listening pattern analysis.

### 📅 Your Music Year
Spotify Wrapped-style analytics you can access anytime. Top songs, albums, genres, audio evolution over time, and discovery stats — filterable by time period.

### 🎵 SNITC Generator (`/snitc-generator`)
AI-powered playlist generation. Describe a vibe in natural language, get a curated playlist with real Spotify tracks. Save results directly as a Crate.

### 🔬 Playlist Analysis (`/playlist/:id`)
Analyze any Spotify playlist's flow. Track-by-track energy mapping, flow score, appeal analysis, BPM/energy transitions, and optimization suggestions with AI coaching.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **State** | TanStack Query, React Context |
| **Backend** | Lovable Cloud (Edge Functions, Database) |
| **Auth** | Spotify OAuth 2.0 (PKCE) |
| **Native** | Capacitor (PWA + iOS/Android) |
| **Data** | ReccoBeats API (audio features), Spotify Web API |

---

## Architecture

```
┌─────────────┐     OAuth 2.0      ┌──────────────┐
│  Music DNA   │◄──────────────────►│  Spotify API  │
│  (React SPA) │                    └──────────────┘
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│           Lovable Cloud (Edge Functions)       │
├──────────────┬───────────────┬────────────────┤
│ ai-curation  │ snitc-gen     │ music-intel    │
│ playlist-ai  │ vibe-search   │ spotify-token  │
└──────────────┴───────────────┴────────────────┘
       │
       ▼
┌──────────────────┐
│    Database       │
│  (music_library,  │
│   crates, tracks, │
│   taste_snapshots)│
└──────────────────┘
```

### Backend Functions

| Function | Purpose |
|----------|---------|
| `ai-curation` | AI-powered crate generation from natural language prompts |
| `music-intelligence` | Secure library storage, taste profiling, track search |
| `playlist-ai-coach` | Playlist optimization suggestions and flow analysis |
| `snitc-generator` | AI playlist generation with artist matching |
| `spotify-public-token` | Public token proxy for non-authenticated lookups |
| `vibe-search-expand` | Natural language → audio feature parameter expansion |

---

## Portfolio Context

Music DNA is a Creative Technologist portfolio piece exploring the question: *"What does your music taste actually look like?"*

It's an exercise in **engineering a mirror** — translating the subjective experience of musical preference into queryable data structures. The challenge isn't the tech stack; it's designing interfaces that make abstract audio features feel personal and actionable.

Built by [Tobi Afo](https://github.com/tobiafo).

---

## Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd music-dna

# Install dependencies
npm install

# Start the development server
npm run dev
```

Requires a Spotify Developer App with redirect URI pointing to your local/deployed callback URL.

---

## Access

Music DNA's Spotify integration is currently in **Development Mode**, which means users must be manually registered before they can log in. If you'd like to try the app, reach out to **assist@tobiafo.com** to request access.

---

## License

Private project. All rights reserved.
