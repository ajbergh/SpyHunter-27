# Asset Provenance and Third-Party Review

## Original project-created assets

- Vehicles, player interceptor, motorcycles, helicopters, speedboat and roadside props are constructed procedurally using Three.js meshes in `src/entities/`, `src/world/` and `src/combat/`.
- Road textures, weather, shaders, HUD and explosion elements are generated in source code. `public/favicon.svg` is an original vector created for this project.
- `src/audio/Audio.ts` contains original, parameter-driven Web Audio effects and a newly written musical ostinato. No samples or melodies were taken from the 1983 game.

## External dependencies

- Three.js, Vite, TypeScript, Vitest and Playwright are declared in `package.json`; review their exact installed versions and notices before redistribution.
- `src/style.css` currently imports Barlow Condensed and Rajdhani via Google Fonts. Verify the applicable font licenses and CDN privacy/offline requirements before public release; preserve any required notices. Do not distribute raw font files independently without checking the applicable license.
- No externally sourced 1983 game sprites, audio recordings, screenshots, or extracted level data are included.

## Commercial distribution blockers

- **"Spy Hunter" and associated franchise branding are not established as licensed.** The title is provisional; obtain legal review and, if necessary, rename the game and all outward-facing brand elements.
- Complete a dependency/license audit on the resolved dependency tree and archive required notices.
- Confirm any third-party fonts/assets introduced during later development have documented licenses.
- Review soundtrack originality and audiovisual similarity to any protected source material.

Document every new external asset with source URL, author, license, and modifications before merging.

## Second-pass model provenance (2026-10-20)

Detailed helicopter, weapons van, speedboat, landing gear, wheel/cab, rotor and five environmental landmark models are newly constructed using native Three.js geometries and original source code. No external reference image, extracted videogame model, photogrammetry data, or copyrighted franchise asset is bundled. Sculpted surface/prop materials use original procedural PBR values. Production modeling, UV baking and art clearance remain future sign-off requirements.
