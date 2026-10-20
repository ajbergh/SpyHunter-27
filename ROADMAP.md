# Spy Hunter '27 — Product & Engineering Roadmap

**Last updated:** 2026-10-20  
**Stack:** Three.js / WebGL2 / TypeScript / Vite  
**Target:** Polished 60 FPS desktop browser arcade game

**Latest CI verification (2026-10-20):** strict TypeScript passed, 27 unit tests passed, Vite production build passed, Chromium Playwright smoke test passed. Full manual session and visual inspection remain outstanding.

## North star

Deliver the mechanical clarity and replayability of an early-1980s vertical-scrolling spy-car action game with original retro-futuristic 3D visuals. Maintain a portrait-oriented playfield within a responsive desktop UI. Preserve the forward sightline and immediate controls; graphics must support gameplay readability.

## Phase 0 — Foundation (initial commit)

- [x] Initialize repository, documentation, strict TS/Vite and dependency manifest.
- [x] Create modular engine/world/entity/input/combat/UI/audio layout.
- [x] Add build, type-check, unit-test scripts and CI workflow.
- [x] Validate GitHub Actions type-check, all 5 unit tests and production build (2026-10-20).
- [ ] Commit a resolved package-lock.json and switch CI from npm install to npm ci.
- [x] Add Playwright Chromium gameplay smoke suite (passed on GitHub Actions, 2026-10-20).
- [ ] Add visual screenshot baselines and extended manual play session.

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
- [ ] Add explicit FPS/diagnostics panel and extended play-session automation (basic browser smoke suite passes).

**Exit:** player can begin, drive, destroy hostile cars, avoid civilians, lose lives and restart. No known blockers in a 10-minute session.

## Phase 2 — Signature arcade systems (incremental implementation)

- [x] Initial distinct interceptor, weaver, blocker behaviors and disrupted/spinning states.
- [x] Enforcer ranged-limousine role with cooldown, dodgeable enemy rounds and custom weapon visuals.
- [x] Attack helicopter with animated rotor, timed bomb warning rings and damaging blasts.
- [x] Original motorcycle geometry with fast slalom attacks and single-hit precision targeting.
- [x] Paired hostile encounters with longitudinal separation and a reserved escape lane.
- [ ] Expand coordinated AI, attack pacing and more complex helicopter behaviors.
- [x] Initial guided hostile-target missiles, oil spinout hazards, smoke-based AI disruption, inventory and cooldown.
- [x] Prioritize helicopter targets with altitude-aware guided missile interception and +750 aerial scoring.
- [ ] Refine missile contrails, air-combat visuals and balance.
- [x] First deployable support truck with an animated ramp, approach/cooldown, alignment-based docking and inventory refill.
- [x] Animate resupply van rear doors, ramp, beacons and brief vehicle-hide/docking camera choreography.
- [ ] Add visible interceptor interior loading/exit sequence, near-miss feedback and collision-safe reentry.
- [x] Five-second civilian casualty NO POINTS lockout with HUD warning and casualty counter.
- [x] Initial lane reservation check at spawn horizon.
- [x] Deterministic encounter-planning function with early-game gating and lane safety unit tests.
- [ ] Tune pacing/fairness during extended gameplay, especially enemy convergences.
- [x] Extra life every 10,000 points (capped at five lives).
- [x] Timed 1×–4× hostile-elimination combos, civilian/collision resets, score HUD and results statistics.
- [ ] Achievement hooks and Classic/Modern/Endless modes.
- [x] Bounded pooled multi-layer explosion effects with expanding shockwave and ballistic sparks.
- [ ] More physical vehicle debris, lighting flashes and sound layering.

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

1. Inspect captured Chromium gameplay screenshots and tune visual readability and vehicle placement.
2. Capture and inspect gameplay screenshots, then run a full manual play session.
3. Make the truck docking sequence cinematic and detect near-misses clearly.
4. Tune new motorcycle/paired encounter pacing in browser and improve bomb telegraph fairness.
5. Add full weapons-van interior loading, vehicle reentry, and damage-safe docking.

## Architecture and quality gates

- Simulation logic updates at fixed 1/60 second; rendering may interpolate or render at monitor rate.
- Gameplay collision remains 2D/2.5D; Three.js renders original 3D meshes.
- Road/environment recycling should not allocate every frame.
- Input actions are edge-triggered for one-shot events and level-triggered for continuous controls.
- Unit tests cover deterministic logic; browser tests cover actual WebGL gameplay.
- Do not mark unimplemented gameplay systems done because a placeholder or UI element exists.
- Strict TypeScript, successful production build and a 10-minute manual smoke run required for phase completion.

## Known limitations of first vertical slice

Straight highway only, initial but incomplete enemy AI and signature weapons systems, no boat/biome transitions; initial helicopters, motorcycles, paired pursuits and combos now exist. Low-poly procedural art and simple audio remain. Chromium E2E smoke tests are present, but not extended manual playtests. Those constraints are explicit so future engineering work can advance gameplay rather than masquerade as visual completion.
