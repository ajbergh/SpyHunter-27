# Spy Hunter '27 — Product & Engineering Roadmap

**Last updated:** 2026-10-21  
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
- [x] Deterministic GPU-instanced roadside density across five biomes: layered forest/snow tree canopies, desert cactus and boulder clusters, bankside reeds, neon street furniture; Low/Medium/High budgets and lane-safe spacing.
- [x] Packed procedural tyre wear, asphalt repairs and instanced reflective edge studs on non-water road tiles.
- [ ] High-resolution authored biome surface art, cinematic weather and biome-specific modular architecture.
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
- [x] Cinematic camera reframed twice against CI screenshots: low near-player eye line, interceptor occupies a larger share of the portrait gameplay viewport while maintaining three visible lanes; mathematical lane/vehicle screen coverage tests.
- [ ] Human-approved art direction and real-GPU frame time validation, especially on high.
- [x] Scene-wide biome-specific filmic grade and environmental reflections via wet material response and procedural rippled highlights.
- [x] Procedural PMREM reflection environment for car clearcoat and metal, without externally licensed imagery.
- [x] Headlight road projection with feathered additive two-beam shader, scene-aware color and performance quality controls.
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

### Fidelity and exposure correction (2026-10-21)

- [x] Scene-specific HDR bloom thresholds above 1.4 and reduced glow strength across all five biomes to prevent vehicle bodywork from saturating white.
- [x] Rebalanced sun, fill and reflection levels; lower metallic paint and cockpit environment response; darker, distinct steel-blue interceptor body and carbon accents.
- [x] Replace flat circular vehicle shadow polygons with soft, physically grounded radial contact-occlusion shader.
- [ ] High-resolution texture art, artist-approved scene-matched reflections, tone calibration across real GPUs, and detailed visual regression comparison.

- [x] Bounded 160-instance paired dynamic tire skids with curve alignment, snow traction threshold, 3.2s decay and Low-preset exclusion; deterministic unit tests.

### Phase 4 — Surface fidelity increment (2026-10-21)

- [x] Longitudinal and perimeter UVs on existing sculpted body hulls, with guard against reversed stations.
- [x] Two cached original vehicle PBR atlases (albedo, roughness, micro-bump) with deterministic panel seams, fasteners, carbon accents and subtle paint noise; shared across traffic instances.
- [x] Cached windscreen detail atlas with restrained reflection bands, wiper arcs, edge trim and roughness variation across all 3D vehicles.
- [ ] Artist-authored vehicle-specific texture sheets, UV seam correction, wear decals, high-resolution normal baking and controlled capture on target GPUs.

### Phase 4 — Atmospheric sky increment (2026-10-21)

- [x] One-draw-call original procedural sky sphere with distinct zenith, horizon and atmospheric haze palettes for forest, desert, snow, city and waterways, plus biome-specific solar disk intensity.
- [x] Camera-relative rendering, smooth cross-biome sky gradients, and automated source and browser coverage.
- [ ] Hand-authored sky textures/cloudscape layers, physically modeled atmosphere, detailed volumetric clouds and verified target-device composition.

### Phase 4 — Wet-road reflection increment (2026-10-21)

- [x] Seeded, corridor-bounded translucent wet asphalt patches along curved neon city road tiles; 9 Medium / 18 High patches per tile and zero on Low.
- [x] Single packed shader draw call per city tile, one shared material/time uniform, no mesh allocation per animation frame, correct stream recycle/disposal ownership.
- [x] Unit tests for deterministic geometry/preset budgets and browser screenshot smoke coverage.
- [ ] Scene-matched reflective light sources and actual rain accumulation, per-pixel reflections, and comparative GPU frame-time/capture approval.

### Phase 4 — Vehicle dynamics and visual response (2026-10-21)

- [x] Retrofit reusable, articulated axle pivots across interceptor, ground traffic, motorcycles and switchblade vehicles; physically scaled fixed-step wheel rotation and eased front steering without per-frame scene traversal.
- [x] Functional red brake-light intensity on player braking and smoke/oil-disrupted enemies, plus subtle player chassis pitch disabled by Reduced Motion; reset-safe and excluded from boats.
- [x] Deterministic Vitest coverage of drivetrain, player, AI and accessibility transitions, plus live cinematic-neon Chromium capture smoke test.
- [ ] Independent wheel suspension, turn-signal behavior, high-detail tire tread/normal maps, skid-to-wheel contact matching, actual GPU profiling and target-aspect-ratio art approval.

### Phase 4 — Aerial searchlight staging (2026-10-21)

- [x] Original aircraft searchlight with centered 3D cone plus a feathered, road-centerline-aligned ground pool; patrol/ace palettes preserve distinct orange bomb telegraphs.
- [x] Bounded 0/1/2 extra draw calls per helicopter on Low/Medium/High, shared static geometries, no dynamic lights, no render-loop mesh allocation, and complete cleanup when helicopters leave.
- [x] Reduced Motion locks searchlight scanning/pulsation; quality changes update existing aircraft and future spawns; deterministic unit + Chromium gameplay smoke coverage.
- [ ] Artist-approved exposure/depth composition and target GPU profiling; actual volumetric fog scatter, occlusion against props/bridge decks, and individually authored aircraft optics.

### Phase 4 — Marine wake fidelity and instancing (2026-10-21)

- [x] Replace transient one-mesh-per-ring river wakes with original authored twin V-hull foam ribbons and a centerline disturbance, combined as one instanced draw.
- [x] Strict fixed-capacity 80/40/12 High/Medium/Low wake budgets, bounded emission catch-up, no dynamic mesh/material allocation per frame, deterministic lifecycle and quality switch reset.
- [x] Curve-aligned, steering-sensitive foam expansion and fade; original geometry, simulation-independent presentation, geometry/unit tests, and live High-waterway Playwright screenshot smoke check.
- [ ] Physically modeled buoyancy, hull-water intersection, wake interaction with riverbanks, water spray/caustics, target GPU benchmarking, and artist-approved turbulence/scaling.

### Gameplay fidelity — Arcade depth movement and frontal attacks (2026-10-21)

- [x] Couple throttle/braking to a bounded, real player Z coordinate rather than only scrolling the highway; maintain a stable cinematic camera and preserve fixed-step lateral control.
- [x] Move player collision checks, guns, missiles, smoke/oil, resupply ramp, headlights, tire skids and boat wakes with the actual vehicle; align vehicle X against streamed curved-road centerline at its current Z.
- [x] Introduce separate, rotated head-on hostile vehicles with opposing relative velocity, advance warning, fair low-frequency spawn gating, forward attacks, and no mixed pincer formations.
- [x] Unit tests for depth bounds, acceleration/braking/boat transitions, frontal encounter planning and AI; Playwright screenshots prove actual W/S vertical travel and head-on presentation.
- [ ] Authentic gear-shifting mechanics, front/rear tactical chase choreography, authored threat-specific vehicle behaviors, target-device play sessions, collision-fairness balancing and visual QA under all aspect ratios.

### Gameplay fidelity — Low / High manual transmission (2026-10-21)

- [x] Original-style Low/High gear selection with deliberate fast-launch/lower-ceiling versus slower-launch/higher-ceiling torque response; fixed 60 Hz simulation, bounded speed and smoother downshifts.
- [x] Remappable keyboard **G** and gamepad **Button 5** (standard right shoulder) with duplicate binding validation, backwards-compatible stored settings and single-action edge triggering.
- [x] Distinct HUD gear indicator, shift notification and explicit **BOAT** transmission mode; gear resets safely on restart and boat transformation.
- [x] Unit gearbox, Player integration, settings migration and Chromium keyboard/gear persistence tests, including actual forward/rearward depth after shifting.
- [ ] Verify original-cabinet speed curves/gear ratios, independent engine pitch and shift audio, gamepad hardware mappings, frame-time profiling, and manual collision/resupply balance across modes.

### Rear chase and overtaking fidelity (2026-10-21)

- [x] Restore signed, speed-correct relative traffic motion (cars overtake when player slows and are overtaken when player accelerates), without affecting head-on enemy velocity.
- [x] Add isolated rear-attack encounters after progression with proper road-lane occupancy checks, fork/water/resupply exclusions, active-attacker limits, and bounded frequency.
- [x] Give rear attackers a distinctive traffic role, faster pursuing velocity, readable rear tactical indicator and warning, restrained lane tracking, smoke/oil disruption and High-gear escape.
- [x] Award small points for outrunning a tail, prevent indefinite behind-camera entities, and supply deterministic tests for encounter selection, speed mechanics, and GPU rendering.
- [ ] Balance real-time catch-up windows, add bespoke rear-facing attack behaviors and stronger overtaking choreography, stage rear pursuit dynamically with chase cinematics, perform device-based lane-fairness and GPU QA.

### Rear overtaking choreography and safe lane screens (2026-10-21)

- [x] Pure deterministic rear-flank lane planner chooses an adjacent passing lane while reserving the player's nearest lane; suppress dangerous maneuvers when lanes are blocked or the road is divided.
- [x] Persist chosen flank lane within the attacker; player evasion does not produce unfair instant direction changes.
- [x] Introduce two legible AI states: committed rear **overtaking** and delayed forward **screening**, separated by 18 units of longitudinal clearance.
- [x] Update tactical HUD with distinct **REAR FLANK** and **CUT-IN AHEAD** warnings, retaining pincer/retreat prioritization.
- [x] Unit and WebGL regression coverage for lane safety, collision separation, smoke disruption, and forward maneuver state.
- [ ] Build more complete authored front/rear coordinated encounters, adjust screen-time warning thresholds, independently verify lane changes/collisions at high FPS and wide aspect ratios, and conduct manual feel/fairness testing.

### Coordinated cross-pressure set piece (2026-10-22)

- [x] Create a pure deterministic, two-direction ambush planner with mirrored outside-lane formation and explicit center escape lane.
- [x] Gate deployment on escalation, centered player, clear traffic, no active water/fork/van restrictions, and no competing rear chase.
- [x] Introduce a brief staging lull and suppress ambient traffic, extra air threats, and rear arrivals while the coordinated pair is active.
- [x] Hold the rear attacker's assigned lane rather than allowing instant homing into the safe corridor; use the existing forward armored blocker.
- [x] Add CROSS PRESSURE / CENTER LANE OPEN tactical HUD state, fixed-step unit safety tests and deterministic Chromium WebGL acceptance coverage.
- [ ] Fine-tune encounter pacing and difficulty across modes; hand-test real GPU devices, controller steering and collisions; eventually add authored cutscenes and cross-direction audio cues.

### Combat presentation: directional radar + center escape-lane guide (2026-10-22)

- [x] Derive front/rear/both threat telemetry from the real active hostile traffic positions and moving player depth, including health and water exclusions.
- [x] Give cross-pressure the only projected escape corridor: a single original shader quad (one draw call) following roadway curvature in render space with no per-frame allocations.
- [x] Hide the projected guide whenever *any* living civilian or hostile obstructs the center, updating both the combat radar and cross-pressure HUD hint to say BLOCKED rather than asserting false safety.
- [x] Keep guide available on all graphics presets, with non-animated Reduced Motion behavior and explicit high-contrast textual status.
- [x] Add distinct original synthesized threat-front/threat-rear signal patterns with mute, effect-volume and cooldown protection.
- [x] Unit and Chromium regression scenarios for front/rear radar, dynamically blocked escape lane and reusable shader geometry.
- [ ] Add spatialized vehicle-engine pitch, higher fidelity damaged-vehicle animation, reactive camera choreography, player-adjustable radar prominence and hardware-based legibility/performance acceptance.

### Vehicle collision and damage presentation (2026-10-22)

- [x] Add fixed-step hit-recoil to the camera with tightly bounded lift/roll, exponential decay and no impact on hitboxes, steering, frame-rate or projectile targeting.
- [x] Fully disable camera recoil when Reduced Motion is enabled, and reset any active recoil on mission start.
- [x] Add per-vehicle reusable paint feedback: hot material emissive flashes on hit and restrained persistent worn-panel coloring as HP drops.
- [x] Ensure brake lamps/wheels/glass and existing vehicle models remain unmodified by the damage overlay.
- [x] Handle immediate machine-gun impacts and deferred HP changes from special weapons.
- [x] Unit and deterministic Chromium regression coverage, including real guarded collision and Reduced Motion.
- [ ] Add directional collision-specific camera recoil, physical suspension loading, authored paint cracks/dent geometry, richer skid/audio mix and long-session hardware playtest.

### Interceptor suspension and directional recoil (2026-10-22)

- [x] Build three bounded fixed-step cosmetic suspension springs for nose pitch, side roll and body squat from measured acceleration, brake command and steering.
- [x] Keep hitbox, wheel hub steering, car world coordinates, driving acceleration and projectile trajectory untouched.
- [x] Reset all spring pose and velocities at new mission, boat transfer and Reduced Motion; preserve existing brake lamps.
- [x] Add left/right collision roll bias to the existing camera impulse without exceeding the prior movement envelope, including guardrail/median/vehicle contact attribution.
- [x] Unit tests for exact bounds, deterministic replay, re-centering and reduced-motion guarantees.
- [x] Chromium regression on live throttle, brake, steer input and directional impact fixtures.
- [ ] Finalize controller/real-GPU road feel and compare accessibility with Reduced Motion; pursue richer vehicle suspension models, engine/load acoustics and art-directed damaged parts.

### Synthesized vehicle and surface audio (2026-10-22)

- [x] Compute per-frame pure, bounded engine pitch and lowpass/gain targets from real throttle/brake state, speed, acceleration, and Low/High gear.
- [x] Add a third long-lived oscillator and bandpass filter for original biome-specific tire/grit/propwash texture, with slip and deceleration emphasis but no physics changes.
- [x] Use a distinct original synthesized gear-shift confirmation and smooth continuous WebAudio parameter transitions.
- [x] Preserve all existing music, effects volume, mute, browser audio permission and pause behavior; ensure the surface layer also silences.
- [x] Add deterministic unit-model tests, mocked persistent WebAudio chain tests, and browser acceptance tests on actual throttle/shift/brake/biome transitions.
- [ ] Subjectively mix with player SFX, hand-test on mobile/headsets and throttle controllers, and consider optional stereo/spatial roadside ambience with dedicated volume sliders.

### Frame-pacing maintenance: zero-work idle effects (2026-10-23)

- [x] Disable the 160-instance skid-trail draw entirely at zero active skid marks rather than updating all instance matrices each frame.
- [x] Update only live or once-expired skid matrices, clearing stale transforms before a later mark batch is made visible.
- [x] Track skid pool count without per-HUD allocation/filtering, retaining original bounded mark capacity and biome-dependent visuals.
- [x] Suppress transparent speed-streak draw calls and dynamic position buffer uploads at cruising speed, Low graphics quality or Reduced Motion.
- [x] Cache static roadside tile X coordinates at build/recycle/seek rather than recomputing ten roadway curve offsets every fixed update.
- [x] Hoist immutable environment sound texture profiles out of 60 Hz engine-audio updates.
- [x] Add GPU buffer-version, draw-culling, count/expiry/regrowth tests; preserve full Playwright visual suite.
- [ ] Profile frame time and draw calls on representative integrated/discrete GPUs with High/Medium/Low quality and long-session memory monitoring.
