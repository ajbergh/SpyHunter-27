# Spy Hunter '27 — Product & Engineering Roadmap

**Last updated:** 2026-10-20  
**Stack:** Three.js / WebGL2 / TypeScript / Vite  
**Target:** Polished 60 FPS desktop browser arcade game

## North star

Deliver the mechanical clarity and replayability of an early-1980s vertical-scrolling spy-car action game with original retro-futuristic 3D visuals. Maintain a portrait-oriented playfield within a responsive desktop UI. Preserve the forward sightline and immediate controls; graphics must support gameplay readability.

## Phase 0 — Foundation (initial commit)

- [x] Initialize repository, documentation, strict TS/Vite and dependency manifest.
- [x] Create modular engine/world/entity/input/combat/UI/audio layout.
- [x] Add build, type-check, unit-test scripts and CI workflow.
- [ ] Confirm first CI run and address any environment-specific failures.
- [ ] Add Playwright browser-level smoke tests and screenshot baselines.

**Exit:** reproducible local setup, type-check/test/build green and CI green.

## Phase 1 — Playable highway vertical slice (implementation underway)

- [x] Angled orthographic camera with centered portrait playfield.
- [x] 60 Hz fixed-step game loop, deterministic score/impact helpers.
- [x] Original procedural interceptor model and responsive lateral handling.
- [x] Recyclable highway tiles, moving lane markings and roadside scenery.
- [x] Civilian and hostile traffic with distinct silhouettes and rudimentary movement AI.
- [x] Dual machine guns, hit detection, simple impact visuals and synthesized sound.
- [x] Collisions, lives, spawn grace, score, local high score, menu/pause/game over.
- [x] Keyboard plus basic Gamepad API mapping.
- [ ] Verify full browser play session, tune pacing, road scaling and collision fairness.
- [ ] Add explicit FPS/diagnostics panel and automated browser smoke tests.

**Exit:** player can begin, drive, destroy hostile cars, avoid civilians, lose lives and restart. No known blockers in a 10-minute session.

## Phase 2 — Signature arcade systems

- [ ] Enemy state machines: flank/sideswipe, armored blockers, shooting limousines, motorcycles and helicopters.
- [ ] Missile, oil slick and smoke systems with actual tactical effects.
- [ ] Deployable resupply weapons van with alignment/docking/ramp animation.
- [ ] Civilian casualty penalty with timed score lockout and feedback.
- [ ] Attack telegraphs, spawn fairness constraints and difficulty encounter director.
- [ ] Combo, extra lives, score events and modes (Classic/Modern/Endless).
- [ ] Layered debris/shockwaves/explosion lighting.

**Exit:** complete, distinct combat mechanics and memorable resupply loop.

## Phase 3 — Living world and watercraft

- [ ] Continuous curved-road centerline, geometry/marking interpolation.
- [ ] Validated road splits, bridges, ramps, guardrails and collision constraints.
- [ ] Five biomes: forest, desert, snow/ice, city at night, waterways.
- [ ] Seeded authored-pattern world generation with biome transitions.
- [ ] Boathouse conversion, boat physics and original boat model.
- [ ] Water shader, animated wake, water enemies and torpedo hazards.

**Exit:** 15-minute play session with seamless road/water traversal.

## Phase 4 — Visual/audio quality pass

- [ ] High-quality original interceptor, enemies, truck, props and variant assets.
- [ ] Real-time lighting, reflection approximations and optional shadows.
- [ ] GPU-oriented particle pooling, weather, skid marks and atmospheric effects.
- [ ] Optimized EffectComposer with output transform, restrained bloom and grades.
- [ ] Original adaptive espionage score and rich vehicle audio system.
- [ ] Visual/audio accessibility options and quality presets.

**Exit:** cohesive premium look, responsive effects, no readability regressions.

## Phase 5 — UX, polish and release readiness

- [ ] Sophisticated start screen/attract mode, game mode/settings, control rebinding.
- [ ] Full HUD: weapons, speed, lives, scoring modifiers, truck readiness.
- [ ] Results statistics, achievements, seeded daily challenge (optional).
- [ ] Full keyboard and gamepad support; resize/pause/focus behavior.
- [ ] Profiling: 60 FPS 1080p midrange GPU, integrated GPU quality tier.
- [ ] Memory soak, collision fuzzing, fixed-step consistency, cross-browser tests.
- [ ] Document asset provenance; resolve final name and trademark review.

**Exit:** release candidate with tests, production bundle and deployment instructions.

## Next implementation batch

1. Run first GitHub Actions CI and correct any failing checks.
2. Add Playwright gameplay smoke test and collect screenshots for visual inspection.
3. Refine enemy AI into a reusable behavior/state system, then make traffic reactions fair.
4. Add timed civilian scoring penalty and extra-life thresholds.
5. Implement missiles, oil/smoke and then weapons van docking as an actual collision interaction.

## Architecture and quality gates

- Simulation logic updates at fixed 1/60 second; rendering may interpolate or render at monitor rate.
- Gameplay collision remains 2D/2.5D; Three.js renders original 3D meshes.
- Road/environment recycling should not allocate every frame.
- Input actions are edge-triggered for one-shot events and level-triggered for continuous controls.
- Unit tests cover deterministic logic; browser tests cover actual WebGL gameplay.
- Do not mark unimplemented gameplay systems done because a placeholder or UI element exists.
- Strict TypeScript, successful production build and a 10-minute manual smoke run required for phase completion.

## Known limitations of first vertical slice

Straight highway only, minimal AI, no missiles/truck/boat, low-poly procedural artwork, simple sound, no browser E2E suite yet. Those constraints are explicit so future engineering work can advance gameplay rather than masquerade as visual completion.
