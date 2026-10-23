# SPY HUNTER '27

A modern, original WebGL arcade-combat driving game inspired by the feel of early 1980s vertical-scrolling highway games. Powered by **Three.js + TypeScript + Vite**.

> **Project status:** Advanced playable browser prototype, not feature-complete or commercially cleared. Five biomes, ground/boat combat, four arcade modes, enemy squad/aircraft systems, route choices, keyboard/gamepad remapping, accessible settings and original generated music are implemented. Consult the current [GitHub Actions CI](https://github.com/ajbergh/SpyHunter-27/actions) for test counts. Extended manual play, multi-browser/hardware profiling, additional audiovisual polish and release clearance remain outstanding.

## Run locally

Requires Node.js 20.19+ (Node 22 recommended). Dependency versions are locked in the committed package-lock.json; CI installs them with `npm ci`. To update dependencies, change package.json and run the manual GitHub Actions workflow **Generate dependency lockfile**, then review the lockfile diff.

```bash
npm ci
npm run dev
```

Open the local address shown by Vite. First open of the game requires a click/Enter to start and unlock browser audio.

```bash
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

## Controls

| Action | Keyboard |
| --- | --- |
| Steer | A/D or left/right arrows |
| Accelerate | W or up arrow |
| Brake | S or down arrow |
| Fire dual guns | Space |
| Guided missile | Q |
| Deploy oil slick | E |
| Deploy smoke screen | R |
| Call weapons resupply truck | F |
| Pause / resume | P or Escape |
| Start / retry | Enter |
| Mute | M |

### Graphics, audio and accessibility

The **Settings** menu (also accessible while paused) saves High/Medium/Low graphics settings, music and effects volumes, reduced-motion preference, and an optional FPS/draw-call diagnostics overlay. Ten core keyboard actions can be rebound in Settings (with duplicate detection and persistent storage); Arrow keys and Escape remain available as fallbacks. Biome-specific GPU weather adds snow, dust, city rain and water mist at quality-dependent particle budgets. High quality enables restrained bloom through a Three.js EffectComposer pipeline. The soundtrack and speed-reactive engine audio are original synthesized Web Audio. Each environment now has its own 16-step melodic arrangement, percussive rhythm and engine color; danger accelerates the pace, with separate incoming-bomb and resupply cues.

### Game modes and environment progression

Choose **Classic Arcade**, **Modern Arcade**, **Endless Pursuit**, or **Daily Challenge** on the title screen. Modern starts with five lives and lighter traffic; Classic has three lives; Endless has a higher encounter rate. The daily challenge uses a shared UTC date to seed hostile encounter choices and stores a separate best score for that date in browser storage.

The deterministic streamed world progresses through forest, desert, snow, neon city and waterway regions. Divided-road encounters periodically split the highway around a hazardous center median with two playable branches. Choosing **left** selects the Shadow Bypass (lighter hostility, smoke resupply and a small completion bonus); choosing **right** selects the Pursuit Route (more hostile traffic, faster encounter pacing, missile resupply and a larger bonus). Choices are locked after entry and tracked on the results screen; both branches currently merge back onto the same highway. Canyon and city bridge spans add lowered terrain, deck supports and roadside rails without disrupting fixed-step road physics. The interceptor transforms into a speedboat in the water region, where hostile patrol boats appear. Snow and water have distinct arcade handling, with extra steering inertia on ice. This is an early functional biome/boat transition; animated boathouse gates, boat wakes, explosive floating barrels and enemy torpedo fire are implemented. Boathouse entry now requires alignment with the center opening and appropriate speed; a clean transition earns bonus points, while hitting the narrow gate causes a collision. Riverbanks and guardrails penalize high-speed outward impacts.

The game also reads compatible gamepads (left stick to steer, right trigger to accelerate, left trigger to brake, main button to shoot, face buttons for specials, left shoulder to call truck, Start to pause).

## Architecture

- `src/core/Game.ts` coordinates the game state, fixed-step simulation, collisions, scoring and render lifecycle.
- `src/core/GameLoop.ts` implements a capped 60 Hz simulation accumulator and independent rendering.
- `src/core/Input.ts` normalizes keyboard/gamepad controls.
- `src/world/Road.ts` streams curved road and river segments and biome-specific roadside scenery.
- `src/world/WorldPlan.ts` defines the deterministic five-biome world, smooth centerline and seeded layout.
- `src/world/BoatWake.ts` animates generated watercraft wakes.
- `src/world/WaterHazards.ts` creates destructible floating barrels with physical damage.
- `src/gameplay/Settings.ts` validates and persists quality/audio/accessibility choices.
- `src/gameplay/GameModes.ts` defines Classic, Modern and Endless Arcade behavior.
- `src/entities/` owns original procedural vehicle meshes and traffic entities.
- `src/combat/Projectiles.ts` handles pooled bullets and hit checks.
- `src/combat/SpecialWeapons.ts` manages missile homing, oil/smoke hazard interactions, ammo and cooldown.
- `src/gameplay/WeaponsVan.ts` implements roadside truck deployment, ramp alignment, animated visible vehicle loading, collision-safe redeployment and refill.
- `src/combat/AirThreats.ts` owns aerial enemies, bomb telegraphs and blast hit detection.
- `src/combat/EnemyProjectiles.ts` pools dodgeable enemy turret rounds.
- `src/gameplay/Scoring.ts` implements civilian lockout, extra-life milestones and timed score combos.
- `src/gameplay/EncounterDirector.ts` plans lane-safe paired pursuit waves.
- `src/combat/ExplosionEffects.ts` pools layered explosion effects.
- `src/ui/Interface.ts` presents accessible HTML HUD/menu overlays on the WebGL canvas.
- `src/audio/Audio.ts` generates lightweight original synthesized arcade effects using Web Audio.
- `src/core/logic.ts` contains small deterministic gameplay functions and tests.

The game uses actual 3D rendering with an angled orthographic camera, but collision is intentionally 2D in the road plane for immediate arcade responsiveness. No copyrighted sprites, music, or original-game assets are used.

## Development principles

1. Preserve the long-viewport, forward-scrolling combat-driving identity.
2. Implement working mechanics before decorative simulations.
3. Keep simulation independent of render frame rate.
4. Use original assets and sound.
5. Optimize and verify before expanding scope.

Read the original [MASTER DEVELOPMENT PROMPT](docs/MASTER_DEVELOPMENT_PROMPT.md) for the authoritative game specification. See [ROADMAP.md](ROADMAP.md) for milestones, acceptance gates and next actions.

## IP note

The working title is provisional. This is an independent homage and is not affiliated with the original game's rights holders. Commercial branding must be reviewed before public release.

### Release and asset provenance

See [Release readiness](docs/RELEASE_READINESS.md) for outstanding QA gates and [Asset provenance](docs/ASSET_PROVENANCE.md) for original creative sources and third-party dependencies. Commercial distribution under the provisional title requires a trademark review.

### Squad tactics

Paired hostile encounters now share a squad identity. When both are close enough, their AI may form a left/right pincer around the interceptor, with a clearly labeled HUD warning and a central escape gap. Coordinated movement is suppressed in forks/waterways, near civilian traffic, when the player is against an outer edge, or when an attacker is disrupted by smoke. Single vehicles retain their original role behavior.

### Gamepad control customization

In Settings, standard Gamepad API controllers can remap eight button actions, including throttle, brake, guns, special weapons, resupply and pause. Left-stick steering remains analog. Mappings persist locally and reject duplicate button assignments; actual compatibility should still be tested on physical controllers.

Squads now disengage after a wingman is destroyed: surviving attackers shift into an outward escape maneuver and retreat up the road rather than continuing a suicidal pursuit. The HUD distinguishes an active pincer from a retreat, and neutralized attackers stop firing during escape.

The resupply van now provides **one-shot docking guidance** if the ramp passes while the driver is out of alignment or outside its safe 15–49 speed range. Misaligned approaches can still recover until the truck leaves the encounter.

### Visual refresh — cinematic world rendering

The refreshed art direction adds distinct warm forest sun, dusty golden desert, cool alpine light, violet/cyan neon city, and blue-green water palettes. Lighting, exponential distance haze, bloom exposure and rim color blend continuously during biome transitions. **High** enables 2048² soft shadows and bloom, **Medium** uses 512² soft shadows, and **Low** disables real-time shadow maps and speed streaks. All presets retain the reusable asphalt microtexture, painted vehicle reflections, and improved animated water shader. Road tiles share pavement materials and texture assets, avoiding GPU-texture creation on every recycled segment. Reduced Motion disables peripheral speed streaks and reactive city-light pulsing.

Chromium CI captures high-preset city and water reference screenshots. These are technical smoke tests, **not approval of art quality or proof of 60 FPS** on real discrete or integrated GPUs. Benchmark performance and review visual consistency before treating the game as a finished graphics release.

### 3D art production — sculpted vehicles and dimensional world (2026-10-20)

The interceptor and standard ground traffic no longer rely on stacked rectangular blocks for their primary silhouettes: original continuous cross-section vehicle shells, panoramic glazing, more detailed wheel/hub assemblies, functional-looking intakes and aerodynamic hardware lead the art direction. Physically based materials now receive a local procedural studio-reflection environment map, without externally sourced assets. The overhead orthographic camera has been replaced by a lower cinematic perspective camera with gentle speed-dependent FOV (disabled under Reduced Motion), and the High preset adds a restrained color vignette and film grain. Terrain now rises and falls continuously alongside the roadway with differentiated forest hills, alpine cliffs, desert mesas, and waterfront banks; the city features high-rise facades and GPU-instanced lit apartment windows. Procedural art and geometry remain original and retain deterministic biome streaming.

**Scope:** This is a major fidelity improvement, but not proof of "AAA graphics." Actual AAA-level asset production would require authored high-resolution car meshes, baking, decals, unique set pieces, physically measured PBR textures, high-quality HDRI / reflection probes, polished particle VFX and camera animation, technical art direction, and reviewed GPU captures on target hardware. The GitHub browser screenshots are smoke tests, not artistic sign-off.

### Hero asset upgrade — helicopters, support van, speedboats, landmarks

More original 3D models replace the most visibly primitive meshes. The weapons van receives a sculpted forward cab, layered cargo ribbing, illuminated loading interior and moving treaded ramp; aerial enemies now have sculpted fuselages, tactical sensor optics, engine modules, weapon pylons, landing skids, rotor hubs and a separately animated tail rotor. Watercraft have a contoured V-hull, glazed cockpit, safety rails and twin propulsion pods. Landmarks are seeded and spaced apart to prevent excessive draw calls: forest ranger towers, desert derricks, snow radar bases, neon city lightboxes and coastal navigation towers. Their geometry is recycled with streaming tiles.

This is **AAA-inspired visual development**, not a claim of commercially competitive AAA production quality. The next art milestones remain custom modeled and textured glTF assets, decals, professionally authored environmental props, tuned reflection probes, animation and real-GPU profiling. CI screenshots are engineering evidence rather than final art approval.

### Camera composition tuning

Actual CI screenshots showed the original camera made the interceptor appear too small within a long empty road. The default perspective has therefore been reframed lower and closer, enlarging the hero vehicle while preserving the view of all three lanes and the road ahead. The framing is checked with camera-space coverage tests, and dynamic FOV remains small and disabled under Reduced Motion. Review the refreshed screenshots on target aspect ratios and integrated graphics before final artistic sign-off.

### Roadside density and cinematic composition (2026-10-20)

Terrain now includes performance-budgeted **GPU-instanced** ground detail. Forests gain multiple overlapping fir-canopy layers with bark and undergrowth; snow regions include frosted conifers and ice-toned boulders; deserts gain mineral-colored rock clusters and cacti; water banks receive reeds and shoreline stone; neon districts have glowing street furniture. Every tile's scatter is deterministically seeded by travel distance, aligned to curved terrain height, and kept outside the collision/driving corridor. Preset budgets scale density, with no runtime mesh creation per simulated frame.

Roadway materials gain subtle tyre wear and seeded crack repairs, plus reflective lane-edge studs. These details occupy at most two additional draw calls per non-water tile. The perspective camera sits lower and closer than the first visual rebuild, increasing the interceptor's visible size while maintaining all driving lanes and the distant encounter horizon. New visual smoke-test captures cover High forest canopies and desert roadside surfaces. These are engineering checks, not evidence of equivalent photorealism or AAA art clearance.

### Soft headlight beams (2026-10-20)

Night driving now projects two feathered vehicle headlight cones forward on the asphalt. A single transparent shader plane draws both beams, with biome-specific brightness and reduced work on Medium; Low disables the effect and boats hide it. The effect follows the curved road's centerline at the player and never creates additional lights, shadows, or meshes during driving.

### High-dynamic-range lighting correction (2026-10-21)

A screenshot review showed that the previous High graphics preset caused the hero interceptor's bright paint, canopy and decorative emitters to blend into a white flare. Cinematic grading now uses **per-biome HDR bloom thresholds** (1.42–1.82) and lower strengths (0.14–0.29); daylight, reflection intensity and physically based clearcoat are tuned to preserve separation between painted metal, window glass, trim and road lighting. The hero sports a muted steel-blue body with a dark carbon center spine and soft radial contact shadows. A new Chromium screenshot captures the High night preset for continued human comparison. These changes improve tone separation without introducing copyrighted or remote texture assets.

### Dynamic tire behavior (2026-10-21)

When steering hard at speed or braking, the interceptor now leaves paired rubber traces that track the curved moving road. A fixed 160-instance GPU pool reuses the same shader, geometry and memory across the run; marks scroll and expire cleanly rather than accumulating over long sessions. Ice changes the steering threshold, and the effect disables itself on water/boats and on Low quality. Together with rebalanced HDR bloom and clearcoat, these touches improve how action and light read on the driving surface.

### Original automotive PBR texture atlas (2026-10-21)

Vehicles now carry physically mapped paint detail rather than uniformly colored shells. The sculpted body geometry uses longitudinal UVs and perimeter bands, allowing the original procedural **512×256 paint, roughness, and bump textures** to display distinct body-panel seams, fine metallic grain, stamped fasteners, interceptor-specific carbon striping, and subtle paint wear. There are only two cached atlas sets (interceptor and road traffic); all spawned cars share the same GPU images instead of recreating textures per traffic vehicle. The maps are generated locally with no network requests or third-party IP, and the extra geometry cost is zero. This is a production texture-pipeline foundation, not a replacement for full artist-authored, per-vehicle UVs and 4K assets.

Glazing also has a third shared procedural atlas with subtle windscreen reflections, stamped perimeter trim, wiper-sweep detail, and roughness variation. Vehicle textures are cached and do not increase draw calls. Distinct body and glass albedo maps remain entirely original.

### Biome sky and atmospheric depth (2026-10-21)

The previous flat-color world backdrop is replaced by a single camera-relative **procedural atmospheric sky sphere**. Each of the five biomes has a distinct original zenith/horizon/haze palette and solar intensity: warm desert horizon, alpine blue, violet city glow, green-blue waterways and misted forest. Sky colors interpolate at biome transitions; a separate shader handles the sun disc and surrounding haze without texture streaming or per-frame scene allocations. The sphere renders as one backdrop draw call on all quality presets. A Chromium screenshot captures the alpine lighting. This is an intentionally stylized cinematic treatment, not full physically based volumetric atmosphere.

### Rain-slick neon pavement (2026-10-21)

The neon-city roadway gains original, shader-feathered wet patches with alternating cyan and magenta light streaks and restrained rain ripples. Each 30-metre tile packs every patch into **one draw call**, and all visible tiles share one shader and one time uniform. The patches stay inside the road corridor, follow the curved centerline and render beneath lane markings; they are disabled entirely on Low quality, while Medium/High use bounded density. This is a procedural approximation of reflected signage, not true screen-space or ray-traced reflections. Hardware frame-time and artistic approval remain release gates.

### Animated vehicle drivetrain and brake signaling (2026-10-21)

The interceptor, civilian and hostile road cars, motorcycles and switchblade adversaries now use articulated axle pivots for continuous wheel roll and eased front-wheel steering. Braking visibly intensifies original red tail lamps, while the player interceptor uses a subtle acceleration/braking chassis pitch (suppressed with **Reduced Motion**). The animation reads actual fixed-step driving speed rather than render frame time, caches wheel and lamp references once per vehicle, and does not change arcade collision or driving handling. Both boat variants remain wheel-free, and replay resets animation state. The final art/suspension realism and target-hardware GPU cost still require manual visual review.

### Aerial searchlight staging (2026-10-21)

Attack helicopters now project an original, softened searchlight onto the curved road, using a pale cyan patrol beam or a muted rose ace-gunship beam that is deliberately distinct from the orange timed bomb-warning ring. **High** renders the translucent tapered beam and a feathered ground pool (two draw calls per helicopter); **Medium** retains only the projected pool (one draw call); **Low** omits both. Reduced Motion disables sweeping and shimmer. The effect follows aircraft motion and road bends, recycles one cached cone/circle geometry set, requires no new lighting or shadow maps, and disposes per-aircraft materials as threats leave. This is a stylized volumetric approximation, not physically ray-marched fog or a gameplay hit indicator.

Chromium CI includes a reproducible development-only ace-gunship screenshot in the neon biome. Automated rendering smoke tests do not substitute for target-GPU benchmarking or human art-direction approval.

### Single-draw-call V-hull water wakes (2026-10-21)

The speedboat now trails paired, original tapered V-shaped foam ribbons with a subtle centerline turbulence trace, replacing individually constructed wake rings and cloned materials. A fixed 80-instance pool stores all wake segments; at any instant the **High/Medium/Low** presets draw at most **80/40/12** wake instances with just **one draw call**, and no per-frame geometry, mesh, or material allocation. The foam follows the curved waterway in the presentation pass and responds slightly to steering and speed, dissipating after it leaves the boat or the region. A deterministic geometry/streaming test and High-quality waterway Chromium screenshot are included. It is a stylized procedural foam approximation and still requires human visual and GPU performance review.

### Arcade-style forward/rearward positioning and head-on opponents (2026-10-21)

Unlike the earlier bottom-anchored prototype, accelerating the interceptor now advances it toward the top of the visible road and braking brings it toward the bottom. The **W / ↑** accelerator and **S / ↓** brake affect both real travel speed and actual player depth (bounded to keep the car visible). The road still scrolls at speed, while player collision geometry, twin guns, missiles, oil/smoke, headlights, skid marks, boat wakes and resupply docking reference that changing depth; curving roads continue to align under the moving player. This restores the arcade principle that screen position communicates pace while retaining the project's modern fixed-step handling and camera; it does not yet add an authentic low/high transmission or reverse gear.

Beyond the existing pursuit traffic, later road encounters can also spawn **head-on hostile cars**, visibly facing the interceptor and advancing at opposing relative speed. Some fire forward-facing rounds, giving the player room to evade into another lane or fire first. This type never joins a two-car pincer or the lighter left route. Developer-only deterministic Playwright scenarios verify both visible vertical travel and incoming attacks; regular campaign spawns remain seeded by the existing encounter generator.

### Manual Low / High transmission (2026-10-21)

The interceptor now starts each run in **LOW** and has a manually switchable **HIGH** range, restoring a distinctive arcade driving decision alongside the new forward/rearward screen travel. Press **G** or **gamepad right shoulder (Button 5)** to toggle while driving; both controls can be remapped independently under Settings. The HUD displays **GEAR LOW / HIGH** (or **BOAT** when using the automatic speedboat). Low offers quick initial throttle response but levels out near **41 world-speed units**; High offers a much higher ceiling, around **58 world-speed units**, but weak pulling power at low speeds. Braking and coasting work in either range, and downshifting gradually reduces speed rather than snapping it instantly. The gear resets to Low on a new mission and during vehicle-to-boat transformation. The game uses arcade speed units, not a physical transmission simulation or measured MPH-to-world-unit calibration.

Shift inputs are edge-triggered, so holding G does not repeatedly toggle. Existing keyboard/gamepad remapping and storage validation prevent binding conflicts; older saved settings migrate with default gear bindings. Pure-unit drivetrain tests and Chromium browser tests verify the mechanical distinction, HUD, key edge triggering, speed-linked Z movement and persisted remapping. Original cabinet exact ratios, engine sound changes and real-hardware accessibility checks remain follow-ups.

### Rear-pursuit enemies and true overtaking (2026-10-21)

The interceptor can now be attacked from **both ends of the highway**. After the opening phase, occasional gold-colored hostile interceptors enter from the rear and close on the player's lane. A **REAR PURSUIT** tactical indicator cues the player to move to another lane or use **HIGH gear** to outrun the attacker. These pursuers use genuine signed relative velocity rather than a forced forward scroll: in Low gear they can catch up, while High gear eventually pulls clear and awards **125 escape points** when the pursuer falls behind the camera. Lane tracking is deliberately slow enough to allow evasive steering; oil and smoke can disrupt it, and frontal guns cannot fire backward. The support van, split roads and waterways all suppress rear-pursuit spawns, and only one rear attacker can be active at a time.

General traffic now obeys signed relative motion as well: slowing down allows faster cars to travel **up** the screen rather than unrealistically drifting toward the interceptor; accelerating and overtaking them pulls them back toward the screen bottom. This makes the new low/high transmission and moving collision body matter beyond presentation alone.

Validation includes unit tests for relative velocity, active-pursuer gating, lane occupancy, water/fork exclusions, steering escape and smoke disruption, plus a deterministic Chromium capture of the rear threat warning and High-gear counterplay. Attack frequency, lane readability, real gamepad behavior, and live-skill balancing still require human playtests.

### Staged rear-attack overtaking and cut-in (2026-10-21)

Rear pursuers no longer simply aim for the interceptor's current lane. When a pursuer approaches from behind, the fixed-step AI first looks for an unoccupied **adjacent passing lane**, keeps the player's current lane clear, and commits to its choice. If both side lanes are occupied by civilians or hostiles, the new flank is withheld instead of executing an impossible side-swipe. Once committed, the attacker remains in that lane even if the player steers across the road; movement into the passing lane is eased, not instantaneous.

After safely passing the interceptor by at least **18 road-space units**, a surviving flanker can attempt a deliberately slow **forward cut-in**, creating a new ahead-of-player threat. The tactical overlay distinguishes **REAR PURSUIT**, **REAR FLANK**, and **CUT-IN AHEAD**, with clear steering/braking counterplay. No new flank maneuver is ordered while the route is divided, the support van is present, or the player is in a speedboat. Smoke/oil disruption interrupts steering without changing the real collision hitbox.

Unit coverage exercises vacant/occupied flank lanes, threat proximity bounds, committed lane behavior, delayed cut-in, disruption, and fallback tracking. Playwright exercises the real simulation and captures two development-only WebGL acceptance screenshots. This remains an arcade-inspired enemy maneuver, not a reconstruction of the exact 1983 original's AI rules; gameplay tuning and physical-device review remain pending.

### Coordinated front/rear cross-pressure encounter (2026-10-22)

Later road missions can now stage a distinct **CROSS PRESSURE** ambush rather than merely spawning more traffic: an armored roadblock car approaches from ahead in one outside lane as a fast rear pursuer occupies the opposite outside lane. **The middle lane is intentionally reserved as the escape corridor**, shown directly in the HUD as **CENTER LANE OPEN**. A rear enemy assigned to the formation holds its outer lane even if the player steers; this prevents the new encounter from turning into an unavoidable center-lane homing attack. Ordinary traffic and additional rear enemies are temporarily withheld during staging and while both attackers remain active. When either formation member is destroyed or exits the stage, the system releases the coordination and returns to regular encounters.

The formation is eligible only once combat has escalated, when the player is relatively centered, there is no immediate civilian/hostile traffic in the playable area, and neither a water crossing, divided-road hazard nor support van is active. A brief pre-encounter lull lets existing traffic leave before admission; if the road remains crowded, the game skips the formation instead of forcing a three-lane blockade. Two mirror-image layouts are seeded with the existing mission RNG. No new external art, licensed sound, networking or runtime dependencies were introduced.

Unit and Chromium browser tests assert opposing lane assignments, obstacle exclusions, actual forward/rear longitudinal travel, held-lane steering, center-lane clearance, and the tactical warning. Manual real-hardware and gameplay fairness testing remain necessary; a reserved lane in this set piece is not a universal collision-immunity guarantee.

### Combat presentation and truthful escape-lane guidance (2026-10-22)

The tactical HUD now reports **FRONT CONTACT**, **REAR CONTACT**, or **both**, based on the actual live hostile positions relative to the interceptor's dynamic depth. During a coordinated cross-pressure encounter, a restrained cyan road-plane guidance shader draws an original dashed center corridor directly onto the curved roadway. A single reusable Three.js shader quad supplies the guide with no per-frame geometry or material creation. The guide remains available across Low, Medium and High graphics presets, while Reduced Motion holds its markings stationary rather than animating them.

**Safety principle:** the center indicator is not a guarantee of collision immunity. It is automatically hidden, and the HUD explicitly changes from **CENTER CORRIDOR CLEAR** to **CENTER CORRIDOR BLOCKED**, if any living car (including civilians and wide hostile blockers) enters that physical corridor. This prevents the previous static cross-pressure hint from claiming a lane is open when real traffic obstructs it. A small synthesized front/rear contact signature is audible on significant direction changes; playback respects existing audio volume, mute, browser permission, and a 3.5-second anti-spam cooldown. Original 3D car models and speed/collision logic are unchanged.

Vitest covers threat direction, blocked center lanes, dead vehicles, boats, audio cooldown, GPU resource reuse and reduced motion. Chromium Playwright covers WebGL scene startup, front/rear HUD, clear projected-lane state and a deterministic civilian-obstructed-lane scenario. Full manual gameplay, real-device GPU profiling and mix-level review remain open.

### Collision camera recoil and vehicle surface damage (2026-10-22)

Combat now has restrained, simulation-time visual feedback that does **not** change the arcade physics. A successful interceptor impact triggers a short, deterministic camera lift and roll (maximum 0.30 world units / 0.018 radians, rapidly decaying). The camera offsets are applied only to the presentation camera, and **Reduced Motion completely suppresses them**. The camera resets between missions, so prior collisions cannot influence the next session's viewpoint. Existing speed-based FOV, road curvature, control input, body pitch and player collision boxes are preserved.

Enemy road vehicles now briefly glow orange where their reusable paint materials are hit, while surviving cars accumulate a restrained wear tint as their HP falls. Paint materials are collected only once per car on construction; **no hit or simulation frame creates geometry, materials or textures**, and existing brake lights, wheels, glass, collision dimensions and hit points remain independently controlled. Direct machine-gun hits display immediately, and HP reductions from area/special weapons are detected on the next fixed simulation step. Original debris and impact explosions remain intact.

Unit coverage checks impact caps/damping/determinism/reduced motion, material reuse, brake-light isolation, paint restoration, recurring hits, and unchanged traffic hitboxes. A deterministic Chromium browser test invokes the ordinary collision-damage path in development mode and verifies camera recoil, settling, and reduced-motion suppression. Manual hardware play and long-session comfort testing remain open.

### Spring-loaded arcade suspension and directional impacts (2026-10-22)

The interceptor now uses a small, **critically damped cosmetic suspension system**. Longitudinal acceleration loads the rear body, brakes induce a short nose-down pitch, steering produces speed-dependent lateral lean and combined inputs add a few centimeters of chassis compression. Three independent bounded springs operate on fixed simulation steps, so these movements remain smooth, deterministic and independent of WebGL frame rate. The system adjusts the existing car-body model only: road position, hitboxes, tires, propulsion, weapons and game rules are unchanged. Waterway boat mode, mission redeployment and **Reduced Motion** all reset the suspension to a steady neutral pose. The existing wheel hubs and brake lamps continue animating independently.

Collision camera feedback now distinguishes **left and right impacts**: guardrails, median strikes and collisions against neighboring vehicles pass an impact-side signal to the pre-existing damped camera system. Neutral impacts (such as undirected explosions) retain centered recoil. Directional roll remains bounded below 0.018 radians, decays to zero, and is disabled under Reduced Motion. No new geometry, material, texture, input latency or runtime dependencies are introduced.

Vitest covers chassis force-response directions, oscillation settling, clamp safety, replay determinism, boat/Reduced Motion resets and side-specific camera response. Chromium runs real acceleration, steering and braking input sequences and checks left/right impact fixtures for symmetric world/player state. Hand-on gamepad feel and physical GPU screenshots remain necessary to complete acceptance.
