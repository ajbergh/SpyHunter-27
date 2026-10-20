# Spy Hunter '27 — Product & Engineering Roadmap

**Last updated:** 2026-10-20  
**Stack:** Three.js / WebGL2 / TypeScript / Vite  
**Target:** Polished 60 FPS desktop browser arcade game

**Latest verified CI (2026-10-20):** 53 unit tests across 19 test files, 12 Chromium Playwright browser tests, strict TypeScript and production build all passed on commit `712b69c`. The E2E suite covers actual WebGL gameplay, five biome renders, live vehicle/boat crossings, persistent settings, keyboard remapping, high contrast, natural game-over and redeploy. Hardware performance, extended manual play and visual approval remain unverified.

## North star

Deliver the mechanical clarity and replayability of an early-1980s vertical-scrolling spy-car action game with original retro-futuristic 3D visuals. Maintain a portrait-oriented playfield within a responsive desktop UI. Preserve the forward sightline and immediate controls; graphics must support gameplay readability.

## Phase 0 — Foundation (initial commit)

- [x] Initialize repository, documentation, strict TS/Vite and dependency manifest.
- [x] Create modular engine/world/entity/input/combat/UI/audio layout.
- [x] Add build, type-check, unit-test scripts and CI workflow.
- [x] Validate GitHub Actions type-check, all 5 unit tests and production build (2026-10-20).
- [ ] Commit a resolved package-lock.json and switch CI from npm install to npm ci.
- [x] Add Playwright Chromium gameplay smoke suite (passed on GitHub Actions, 2026-10-20).
- [x] Add Playwright screenshots of all five environments with development-only distance-seek harness (CI validated).
- [ ] Approve reviewed screenshot baselines and extended manual play session.

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
- [x] FPS/draw-call/vehicle diagnostics and full game-over/redeploy Chromium browser test.
- [ ] Complete an uninterrupted 10–15 minute manual session and extended automated soak.

**Exit:** player can begin, drive, destroy hostile cars, avoid civilians, lose lives and restart. No known blockers in a 10-minute session.

## Phase 2 — Signature arcade systems (incremental implementation)

- [x] Distinct interceptor, weaver, armored blocker and aggressive switchblade sideswipe behavior with original procedural blades.
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
- [x] Animate visible interceptor moving into van and safe reentry with invulnerability and cleared deployment lane.
- [ ] More detailed interior animation and feedback for near-miss docking.
- [x] Five-second civilian casualty NO POINTS lockout with HUD warning and casualty counter.
- [x] Initial lane reservation check at spawn horizon.
- [x] Deterministic encounter-planning function with early-game gating and lane safety unit tests.
- [ ] Tune pacing/fairness during extended gameplay, especially enemy convergences.
- [x] Extra life every 10,000 points (capped at five lives).
- [x] Timed 1×–4× hostile-elimination combos, civilian/collision resets, score HUD and results statistics.
- [x] Classic/Modern/Endless mode configuration, starting lives and encounter pacing.
- [ ] Achievement hooks and additional mode-specific scoring rules.
- [x] Bounded pooled multi-layer explosion effects with expanding shockwave and ballistic sparks.
- [ ] More physical vehicle debris, lighting flashes and sound layering.

**Exit:** complete, distinct combat mechanics and memorable resupply loop.

## Phase 3 — Living world and watercraft (in progress)

- [x] Smooth deterministic curved centerline with continuous streamed road/water strips and markings.
- [x] Guardrail and riverbank contact damage with rate limiting and recovery.
- [x] First divided-highway encounter: continuous center median, two navigable routes, reflective barriers, signs, warnings, collision recovery and clean-pass score.
- [ ] Fully branching road topology with independent route destinations and merge AI.
- [ ] Advanced bridges and ramps, separate route destinations, and extended corridor collision validation.
- [x] Five visually distinct biomes: forest, desert, snow, neon city and waterways.
- [x] Distinct snow/ice lateral traction, speedboat lateral inertia and mode-adjusted speed ranges.
- [x] GPU particle snow, desert dust, urban rain and river mist.
- [ ] Substantial biome art/weather polish.
- [x] Seeded deterministic roadside props and biome transitions on cumulative distance.
- [ ] Authorable seeded set pieces and biome-specific encounter scripts.
- [x] Original low-poly speedboat model, water handling and automatic land/water transformation.
- [x] Boathouse portal geometry at land/water stage boundaries.
- [x] Boathouse alignment/speed grading, narrow visible gate, clean-transfer bonus and wall-impact penalty/recovery.
- [ ] Interactive boathouse entry animation and complete interior transformation sequence.
- [x] Animated original water shader and boat enemy encounters.
- [x] Speedboat wake rings and enemy boat-fired torpedo projectiles.
- [x] Floating explosive barrels with bullet destruction, bonus points and player damage.
- [x] Riverbank contact damage, flaming oil-wake damage to pursuing boats.
- [ ] Dedicated barrel-dumper enemy, riverbank obstacle meshes and improved torpedo tracking.

**Exit:** 15-minute play session with seamless road/water traversal.

## Phase 4 — Visual/audio quality pass

- [ ] High-quality original interceptor, enemies, truck, props and variant assets.
- [ ] Real-time lighting, reflection approximations and optional shadows.
- [x] Single-draw-call GPU weather particles (snow, dust, city rain, river mist) with quality budgets.
- [ ] Skid marks, more physical debris and atmospheric grading.
- [x] Optional high-quality EffectComposer with subtle bloom and OutputPass.
- [ ] Sophisticated color grading, advanced reflections and weather effects.
- [x] Original adaptive synthesized espionage riff and speed-sensitive engine drone.
- [ ] Multi-layer authored music, richer engine samples and environmental audio.
- [x] Persistent Low/Medium/High render quality, original music/effects volume and reduced-motion option.
- [x] Persistent keyboard remapping for 10 actions with duplicate protection, Escape cancellation and reduced-motion display rules.
- [x] Persistent high-contrast HUD and reduced-motion UI preferences.
- [ ] Remappable gamepad buttons, additional accessibility review and broader graphics presets.

**Exit:** cohesive premium look, responsive effects, no readability regressions.

## Phase 5 — UX, polish and release readiness

- [x] Three-mode title-screen selection, settings panel and live keyboard control-rebinding interface.
- [ ] Sophisticated autonomous attract-mode demo, more accessible tutorial and credits.
- [x] Functional HUD for weapons, ammunition, speed, lives, scoring lockout, combo and resupply readiness.
- [x] Results statistics: enemies eliminated, civilian casualties, best combo, distance, elapsed time and gun accuracy.
- [x] Seeded UTC daily challenge mode with deterministic encounter generation and date-specific personal best.
- [ ] Achievement hooks and daily challenge sharing/leaderboards.
- [x] Persistent settings UI available on main and paused screens.
- [x] Keyboard control rebinding with persisted help hints and optional reduced-motion interface treatment.
- [ ] Gamepad button remapping and extended pause/focus/accessibility behavior.
- [x] Optional FPS, draw calls, active vehicle diagnostics overlay.
- [ ] Profiling: verified 60 FPS at 1080p midrange GPU and integrated GPU tier.
- [x] Chromium E2E game-over / full-life-cycle / redeploy test passed (2026-10-20).
- [ ] 10-minute memory soak, collision fuzzing, fixed-step consistency and cross-browser tests.
- [x] Document asset provenance, font dependencies, QA and release validation gates.
- [ ] Resolve final name and trademark review.

**Exit:** release candidate with tests, production bundle and deployment instructions.

## Next implementation batch

1. Commit a dependency lockfile and switch CI to reproducible `npm ci`.
2. Implement fully interactive branching roads, bridges and more detailed boathouse transformations.
3. Deepen pursuit AI, missile trails, visual destruction and fully authored music/engine audio.
4. Add an attract-mode demonstration, tutorial, gamepad rebinding and broader accessibility review.
5. Run 10–30 minute manual/memory soaks, inspect screenshot artifacts, benchmark 1080p performance, and verify Firefox/Edge/Safari before a release candidate.

## Previous planned Phase 2 follow-ups

1. Inspect captured Chromium gameplay screenshots and tune visual readability and vehicle placement.
2. Capture and inspect gameplay screenshots, then run a full manual play session.
3. Make the truck docking sequence cinematic and detect near-misses clearly.
4. Tune new motorcycle/paired encounter pacing in browser and improve bomb telegraph fairness.
5. Improve weapons-van interior detailing and near-miss feedback; safe reentry is implemented.

## Architecture and quality gates

- Simulation logic updates at fixed 1/60 second; rendering may interpolate or render at monitor rate.
- Gameplay collision remains 2D/2.5D; Three.js renders original 3D meshes.
- Road/environment recycling should not allocate every frame.
- Input actions are edge-triggered for one-shot events and level-triggered for continuous controls.
- Unit tests cover deterministic logic; browser tests cover actual WebGL gameplay.
- Do not mark unimplemented gameplay systems done because a placeholder or UI element exists.
- Strict TypeScript, successful production build and a 10-minute manual smoke run required for phase completion.

## Known limitations of current prototype

The highway and river are continuous and curved, but do not yet have interactive forks, complex bridges or mission-specific set pieces. Vehicle and roadside art remains procedurally stylized rather than premium authored production art. Enemies support several distinct behaviors but lack full coordinated tactical AI. River transfers are graded for center alignment and speed but lack a detailed boathouse interior transformation. Gamepad rebinding, final soundtrack production, comprehensive accessibility validation, and multi-browser/real-hardware performance qualification remain unfinished. A dependency lockfile is not yet committed. Do not market this build as feature-complete or commercially cleared without completing the release checklist.
