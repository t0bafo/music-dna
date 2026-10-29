# Architecture rules

- Keep Album Mixtapes generation in pure TypeScript modules under `src/lib/mixtape`, exposed through `src/lib/mixtape-engine.ts`; this isolates ordering and selection from later UI and persistence integration.
- Keep mixtape rule tests next to the public engine entry and run them with the repository test command; this protects ordering, pins, length limits, and feature fallbacks during refactors.