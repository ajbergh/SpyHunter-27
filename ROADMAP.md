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
- [x] Commit a resolved package-lock.json and use npm ci in CI for reproducible dependency installation.
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
- [x] Cohesive squad-ID pincer behavior: two hostile vehicles coordinate lateral targets, reserve a central escape corridor, stand down near road edges/civilians, and stop on smoke disruption.
- [x] Post-1900-distance elite ace gunship profiles with strafing, 5 HP, alternating telegraphed attack lanes and increased takedown rewards.
- [x] Squad survivors break off when their wingman is destroyed, steer outward and accelerate off the forward road; retreat disables weapons and cleans up offscreen enemies.
- [ ] Air combat long-session tuning and additional aerial patterns.
- [x] Initial guided hostile-target missiles, oil spinout hazards, smoke-based AI disruption, inventory and cooldown.
- [x] Prioritize helicopter targets with altitude-aware guided missile interception and +750 aerial scoring.
- [x] Improved helicopter bomb fairness: 0.92-second predictive warning, ramping target marker and brake/steer escape validation.
- [x] Single-draw-call 128-instance pooled missile contrails, curved-road world alignment and unit regression coverage.
- [ ] More comprehensive missile camera/readability polish, aerial blast detail and long-session balance.
- [x] First deployable support truck with an animated ramp, approach/cooldown, alignment-based docking and inventory refill.
- [x] Animate resupply van rear doors, ramp, beacons and brief vehicle-hide/docking camera choreography.
- [x] Animate visible interceptor moving into van and safe reentry with invulnerability and cleared deployment lane.
- [x] One-shot approach guidance distinguishes wrong lane and wrong speed, without prematurely failing the van docking sequence.
- [ ] More detailed van interior animation and loading choreography.
- [x] Five-second civilian casualty NO POINTS lockout with HUD warning and casualty counter.
- [x] Initial lane reservation check at spawn horizon.
- [x] Deterministic encounter-planning function with early-game gating and lane safety unit tests.
- [ ] Tune pacing/fairness during extended gameplay, especially enemy convergences.
- [x] Extra life every 10,000 points (capped at five lives).
- [x] Timed 1×–4× hostile-elimination combos, civilian/collision resets, score HUD and results statistics.
- [x] Classic/Modern/Endless mode configuration, starting lives and encounter pacing.
- [ ] Achievement hooks and additional mode-specific scoring rules.
- [x] Bounded pooled multi-layer explosion effects with expanding shockwave and ballistic sparks.
- [x] 96-slot single-draw-call ballistic metal-debris pool for vehicles, helicopters and shoreline barrels, with gravity/bounce and deterministic dispersion.
- [ ] Additional lighting flashes, authored vehicle-part breakage and layered destruction audio.

**Exit:** complete, distinct combat mechanics and memorable resupply loop.

## Phase 3 — Living world and watercraft (in progress)

- [x] Smooth deterministic curved centerline with continuous streamed road/water strips and markings.
- [x] Guardrail and riverbank contact damage with rate limiting and recovery.
- [x] First divided-highway encounter: continuous center median, two navigable routes, reflective barriers, signs, warnings, collision recovery and clean-pass score.
- [x] Consequential left/right fork selection: stealth bypass vs high-risk pursuit, route-specific traffic pressure, ammo/score rewards, branch HUD and completion statistics.
- [ ] Separate world destinations, terrain-diverging branch geometry and advanced merge AI.
- [x] Curved desert-canyon and neon-city viaduct bridge sections, terrain drop-offs, deck undersides, piers, rail posts and proximity warnings.
- [ ] Complex ramps, alternate-route destinations, bridge-specific enemy AI and extended corridor collision validation.
- [x] Five visually distinct biomes: forest, desert, snow, neon city and waterways.
- [x] Distinct snow/ice lateral traction, speedboat lateral inertia and mode-adjusted speed ranges.
- [x] GPU particle snow, desert dust, urban rain and river mist.
- [ ] Substantial biome art/weather polish.
- [x] Seeded deterministic roadside props and biome transitions on cumulative distance.
- [x] Deterministic landmark set-piece geometry and quality-scaled placement.
- [ ] Biome-specific encounter scripting and authorable art assets.
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

- [x] Sculpted interceptor and road-car primary hull geometry, enhanced cockpit clearcoat, detailed wheel assemblies, reflective original procedural PMREM lighting and dramatic perspective driving camera.
- [x] Procedural biome terrain heightfields with canyon mesas/snow peaks/forested ridges, high-rise city facades and instanced emissive window grids.
- [x] High-preset filmic vignette, subtle optical separation and grain (reduced-motion aware).
- [x] Sculpted support-van cab, segmented illuminated cargo bay, animated-ramp tread grips; tactical helicopter fuselage/weapon pods/landing skids, independent tail rotor; streamlined marine hull and twin engines.
- [x] Sparse biome-specific hero landmarks: ranger towers, desert oil derricks, alpine radome stations, neon digital monoliths, navigation beacons. Quality-based placement and deterministic tile streaming.
- [ ] High-resolution artist-authored glTF hero meshes, dedicated UV/baked normal/roughness maps, authentic vehicle wear, unique modular level sets and art-direction approval.
- [ ] Real-time lighting, reflection approximations and optional shadows.
- [x] Single-draw-call GPU weather particles (snow, dust, city rain, river mist) with quality budgets.
- [ ] Skid marks, more physical debris and atmospheric grading.
- [x] High-quality EffectComposer bloom, cinematic color/exposure grading, five smoothly blended biome light rigs and fog palettes, scalable 0/512/2048 soft shadows.
- [x] Seamless seeded asphalt microtextures, clearcoat hero paint and windshields, ground-contact shadows, city neon facades, layered forest canopy, and animated multilayer water glints.
- [x] Bounded one-draw-call edge speed streaks with quality/reduced-motion safeguards.
- [x] Cinematic camera reframed against actual in-game screenshots for more prominent hero vehicle and reduced empty road; mathematical lane/vehicle screen coverage tests.
- [ ] Human-approved art direction and real-GPU frame time validation, especially on high.
- [x] Scene-wide biome-specific filmic grade and environmental reflections via wet material response and procedural rippled highlights.
- [x] Procedural PMREM reflection environment for car clearcoat and metal, without externally licensed imagery.
- [ ] Scene-matched dynamic reflection probes, original authored decals, HDRI art direction and advanced volumetric lighting.
- [x] Original adaptive synthesized espionage riff and speed-sensitive engine drone.
- [x] Five distinct original synthesized biome arrangements with percussive pulses, threat-adaptive pace, dual-layer reactive engine audio, separate warning and resupply signals.
- [ ] Richer authored/sample-based music production and environmental recordings.
- [x] Persistent Low/Medium/High render quality, original music/effects volume and reduced-motion option.
- [x] Persistent keyboard remapping for 10 actions with duplicate protection, Escape cancellation and reduced-motion display rules.
- [x] Persistent high-contrast HUD and reduced-motion UI preferences.
- [x] Standard Gamepad API button rebinding for 8 actions, persistent duplicate-safe settings UI, and unit/browser coverage.
- [ ] Additional accessibility and actual-device validation across controller layouts; broader graphics presets.

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
- [x] Gamepad button mapping UI and persistent input integration for throttle/brake/fire/specials/pause.
- [ ] Extended pause/focus/accessibility behavior and actual-controller compatibility validation.
- [x] Optional FPS, draw calls, active vehicle diagnostics overlay.
- [ ] Profiling: independently verified 60 FPS at 1080p midrange GPU and integrated GPU tier. High preset now scales shadows and details; optimize if needed.
- [x] Chromium E2E game-over / full-life-cycle / redeploy test passed (2026-10-20).
- [ ] 10-minute memory soak, collision fuzzing, fixed-step consistency and cross-browser tests.
- [x] Document asset provenance, font dependencies, QA and release validation gates.
- [ ] Resolve final name and trademark review.

**Exit:** release candidate with tests, production bundle and deployment instructions.

## Next implementation batch

1. Verify npm ci on all CI jobs; review dependency advisories and run the manual Generate dependency lockfile workflow only when dependencies change.
2. Implement fully interactive branching roads, bridges and more detailed boathouse transformations.
3. Expand gunship/evasive pursuit behavior, author fuller music and environmental audio, and polish vehicle destruction.
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

The highway and river are continuous and curved, but do not yet have interactive forks, complex bridges or mission-specific set pieces. Vehicle and roadside art remains procedurally stylized rather than premium authored production art. Enemies support several distinct behaviors but lack full coordinated tactical AI. River transfers are graded for center alignment and speed but lack a detailed boathouse interior transformation. Gamepad rebinding, final soundtrack production, comprehensive accessibility validation, and multi-browser/real-hardware performance qualification remain unfinished. An npm dependency lockfile is now committed and enforced by CI. Do not market this build as feature-complete or commercially cleared without completing the release checklist.
