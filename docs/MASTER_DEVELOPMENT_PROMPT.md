# MASTER DEVELOPMENT PROMPT
# SPY HUNTER '27
## A Modern 3D Arcade Combat Driving Experience

> Original project master development specification, as authored in the initial project conversation. This is the authoritative creative and technical brief. See [ROADMAP.md](../ROADMAP.md) for implementation status. The title is provisional and original licensed assets must not be reused.

### 1. PROJECT VISION

You are an expert AAA game developer, technical game designer, Three.js/WebGL graphics engineer, and creative director.

Your assignment is to design, architect, and implement a complete, polished, browser-based arcade combat driving game titled:

**SPY HUNTER '27**

The game is a modern reimagining of the legendary 1983 arcade game *Spy Hunter*.

The objective is to recreate the original's incredibly addictive combat-driving gameplay while delivering the graphics, effects, responsive controls, sound design, presentation, and overall polish expected of a premium arcade game released in 2027.

Think of the result as:

- The immediate accessibility and gameplay loop of the 1983 arcade original.
- The visual sophistication of a modern arcade racing game.
- The atmosphere of a futuristic espionage thriller.
- The responsiveness and gameplay clarity of a top-tier action roguelite.
- The performance and convenience of an expertly engineered HTML5/WebGL game.

**This is not a conventional racing game.**

It is a fast-moving, vertically scrolling vehicular combat game where the player operates an advanced espionage vehicle, eliminates enemy agents, protects civilians, survives environmental hazards, and upgrades weapon systems while traveling through an increasingly dangerous world.

The result must feel like a complete, commercially polished arcade experience, not a basic Three.js experiment.

The game must be playable immediately in a modern desktop browser.

### 2. NON-NEGOTIABLE REQUIREMENTS

1. Implement a genuinely playable game with a complete start-to-game-over loop.
2. Use Three.js and WebGL2 as the primary graphics technology.
3. Use real 3D geometry, materials, lighting, and animation.
4. Preserve the core top-down, vertical-scrolling gameplay of the original.
5. Make driving and combat responsive, satisfying, and skill-based.
6. Implement functional enemies, weapons, collisions, scoring, lives, and progression.
7. Deliver visually impressive environments, vehicles, particles, lighting, and effects.
8. Include a complete interface with a title screen, HUD, pause menu, settings, and game-over screen.
9. Support keyboard and gamepad controls.
10. Target smooth 60 FPS gameplay on mainstream desktop hardware.
11. Maintain a modular, strongly typed, maintainable codebase.
12. Do not use copyrighted sprites, audio recordings, or other extracted assets from the original game. Produce original assets inspired by its genre and visual vocabulary.

**Priority:** Excellent core gameplay comes before optional features. However, the project should never be considered complete if it is merely a car moving on a scrolling background.

---

# 3. TECHNOLOGY STACK

Use the following architecture.

| Layer | Technology |
|---|---|
| Language | TypeScript, strict mode |
| Graphics | Three.js |
| Renderer | WebGLRenderer / WebGL2 |
| Build system | Vite |
| Game framework | Custom lightweight game engine |
| Physics | Deterministic arcade vehicle physics |
| Collision | Lightweight 2D/2.5D collision system |
| UI | HTML5, CSS3, TypeScript |
| Shaders | GLSL, custom ShaderMaterial where useful |
| Effects | Three.js postprocessing |
| Audio | Web Audio API |
| Controller support | Browser Gamepad API |
| Persistence | localStorage |
| Testing | Vitest and Playwright |
| Assets | Procedural meshes, original textures, optional GLTF/GLB models |

Avoid heavyweight frameworks unless their inclusion provides a clear, meaningful advantage.

Do not introduce a large physics engine unless the custom collision/physics implementation becomes insufficient.

Use modern Three.js ES module imports and current supported APIs.

## Rendering architecture

Use a single primary Three.js scene with a carefully designed rendering pipeline.

Recommended pipeline:

1. Main scene rendering with WebGLRenderer.
2. RenderPass.
3. Selective bloom or bloom-style emissive enhancement.
4. Optional subtle color grading and vignette.
5. Optional lightweight cinematic effects.
6. OutputPass for final output color conversion.

Use EffectComposer where appropriate.

Implement graphics-quality presets:

- Low
- Medium
- High
- Ultra

The rendering pipeline must support resolution scaling, adjustable pixel ratios, and optional effects.

Game logic and simulation must never depend on rendering frame rate.

---

# 4. GAMEPLAY PERSPECTIVE AND CAMERA

The game's defining visual characteristic is its vertical-scrolling viewpoint.

Do not reinterpret it as a conventional behind-the-car driving game.

## Primary camera

Use a nearly top-down, slightly angled orthographic camera.

The camera should deliver the immediacy of the original arcade game while allowing players to appreciate beautifully modeled 3D vehicles and scenery.

Recommended characteristics:

- Player vehicle positioned approximately 70–75% down the screen.
- Approximately 25–30% of the screen below the vehicle.
- Large forward visibility area.
- Camera follows horizontal movement with subtle smoothing.
- Road, traffic, and environment appear to scroll toward the player.
- Subtle perspective and visible vehicle depth without compromising gameplay.

Use an orthographic camera initially. A perspective camera with a long focal length can be evaluated if it improves the presentation without harming readability.

## Coordinate system

Use a consistent ground-plane coordinate system:

- X: lateral position.
- Y: elevation.
- Z: longitudinal road direction.
- Forward travel: negative Z in the player-relative rendering space.

Maintain a continuous, monotonic player travel-distance value for scoring, procedural generation, and spawning.

Reposition environmental geometry and moving entities relative to this travel distance to avoid floating-point drift during long sessions.

## Camera effects

Implement subtle, adjustable:

- Camera shake for explosions and heavy impacts.
- Speed-responsive forward framing.
- Smooth lateral camera tracking.
- Brief cinematic emphasis during weapon resupply.
- Subtle impact zoom.
- Optional speed-sensitive field-of-view styling.

Never introduce camera effects that make steering inaccurate or targets difficult to see.

---

# 5. PLAYER VEHICLE — INTERCEPTOR '27

Create a fully original, futuristic high-performance espionage vehicle.

## Visual design

The Interceptor '27 should evoke an advanced black-and-white government pursuit car.

Design features:

- Low, aggressive wedge-shaped silhouette.
- Futuristic armored body panels.
- Black and white exterior.
- Subtle metallic accents.
- Integrated front-mounted machine guns.
- Retractable missile housings.
- Animated rear exhaust and boost-like effects.
- Glowing red rear lighting.
- Distinctive futuristic front light signature.
- Animated wheels.
- Visible suspension/body movement.
- Reactive brake lights.
- Dynamic reflections and highlights.

The vehicle must be recognizable when viewed from above at gameplay scale.

Do not make it visually tiny or overly detailed at the expense of legibility.

## Vehicle handling

Create a responsive, tunable arcade driving model.

Support:

- Acceleration.
- Braking.
- Lateral steering.
- Steering response varying with speed.
- Acceleration and deceleration curves.
- Controlled inertia.
- Limited lateral drift.
- Surface-dependent traction.
- Collision knockback.
- Recovery from minor impacts.
- Spinout and destruction states.

The vehicle should feel fast, powerful, and immediately responsive.

The original arcade game used a high/low gear concept. Reimagine this with a simplified modern system:

- Normal driving acceleration.
- High-speed pursuit state.
- Braking and maneuvering control.

A manual high/low gear option can be offered as an arcade-purist setting.

### Handling principles

- Arcade-first, never realistic simulation at the expense of fun.
- Predictable steering.
- Strong control at high speeds.
- Clear feedback during collisions.
- Distinct handling on asphalt, ice, and water.
- No uncontrollable oscillation or overly slippery default behavior.

Implement handling parameters in a central configuration file.

---

# 6. ROAD AND WORLD GENERATION

Build a continuous, procedurally generated scrolling environment.

The world should appear expansive, alive, and visually diverse.

It must not simply consist of a flat rectangle with repetitive stripes.

## Road generator

Create modular road segments that support:

- Straight highways.
- Gentle curves.
- Sharper curves at higher difficulty.
- Lane-width variations.
- Multi-lane highways.
- Narrow two-lane roads.
- Bridges.
- Road forks.
- Exit ramps.
- Roadside shoulders.
- Waterway transitions.
- Snow and ice sections.

Generate the road from a continuous centerline with interpolated width, curvature, and surface parameters.

Road segments must join seamlessly.

Avoid gaps, visible seams, abrupt camera snapping, and impossible turns.

### Road markings

Include:

- Dashed lane dividers.
- Solid edge lines.
- Reflective road studs.
- Directional arrows.
- Weathered surface details.
- Road damage.
- Occasional hazard markings.
- Bridge entrance markings.

Markings must follow curved roads correctly.

## Environmental biomes

Implement at least five distinct visual environments.

### Environment A — Classic Highway

- Dark asphalt highway.
- Dense green forest.
- Guardrails.
- Road signs.
- Trees.
- Utility infrastructure.
- Occasional overpasses.
- Civilian highway traffic.

### Environment B — Desert Pursuit

- Orange and brown terrain.
- Dry vegetation.
- Dust particles.
- Canyons and rocky roadside features.
- Heat distortion.
- Faster, more aggressive enemies.

### Environment C — Snow and Ice

- Snow-covered landscape.
- Ice patches.
- Reduced traction.
- Tire skid effects.
- Snow particles.
- Cold lighting.
- Specialized enemy vehicles.

### Environment D — Urban Night

- Futuristic city outskirts.
- Neon signage.
- Streetlights.
- Industrial compounds.
- Reflective wet roads.
- Building silhouettes.
- Emergency lighting.
- Increased traffic density.

### Environment E — Waterways

- Rivers and canals.
- Docks and boathouses.
- Bridges.
- Animated water.
- Shoreline scenery.
- Enemy watercraft.
- Floating obstacles.

The progression between environments should feel intentional and cinematic.

## Procedural generation requirements

Implement deterministic, seed-based generation.

Use a segment-streaming architecture that:

1. Generates new segments ahead of the player.
2. Maintains sufficient visibility for high-speed gameplay.
3. Recycles or disposes of segments behind the player.
4. Preserves continuity of curves, lanes, and biome transitions.
5. Supports fixed scripted set pieces.
6. Avoids unreasonably hazardous or physically impossible obstacle combinations.

Procedural generation should feel authored, rather than completely random.

Use weighted encounter patterns and fairness rules.

Never create unavoidable deaths through unfair spawns.

---

# 7. ENEMY VEHICLES AND AI

Enemy encounters are central to the experience.

Each enemy archetype must look distinct and behave differently.

Do not implement all enemies as vehicles that simply drive forward and collide with the player.

## Enemy archetypes

### A. Switchblade Interceptor

Fast enemy pursuit car.

Behavior:

- Accelerates toward the player.
- Attempts to flank and sideswipe.
- Deploys dangerous wheel-mounted blades.
- Tries to push the player into obstacles or off the road.

Visuals:

- Dark armored body.
- Animated blade deployment.
- Sparks during blade contact.
- Aggressive lane changes.

### B. Armored Road Lord

Heavy armored enemy vehicle.

Behavior:

- Blocks lanes.
- Absorbs machine-gun fire.
- Attempts to ram the player.
- Can be defeated by forcing it off the road or through environmental interactions.

Visuals:

- Large, heavy body.
- Reinforced armor.
- Heavy exhaust.
- Strong collision effects.

### C. Enforcer Limousine

Long enemy vehicle with ranged attacks.

Behavior:

- Positions itself beside the player.
- Attempts to maintain an advantageous firing angle.
- Fires directional projectiles.
- Retreats or repositions after attacks.

### D. Attack Helicopter

Airborne threat that flies over the highway.

Behavior:

- Tracks the player.
- Predicts their movement.
- Drops explosive bombs.
- Creates persistent road hazards.
- Can be destroyed with missiles.

Visuals:

- Animated rotor.
- Helicopter shadow on terrain.
- Searchlight effects.
- Explosive projectile trails.
- Large destruction animation.

### E. Pursuit SUV

Modern reinterpretation of an aggressive enemy interceptor.

Behavior:

- Performs coordinated attacks.
- Attempts to box the player in.
- Uses evasive maneuvers.
- Works with other enemy vehicles.

### F. Enemy Motorcycle

Fast, small target.

Behavior:

- Weaves through traffic.
- Makes aggressive passing maneuvers.
- Uses rapid lateral movement.
- Rewards precision targeting.

### G. Waterway Enemy — Barrel Dumper

Drops explosive barrels and floating hazards.

### H. Waterway Enemy — Torpedo Boat

Tracks the player's boat and launches directional torpedoes.

## AI architecture

Implement state-driven enemy AI with states including:

- Spawn.
- Patrol.
- Pursue.
- Intercept.
- Attack.
- Evade.
- Damaged.
- Disabled.
- Destroyed.

Enemy vehicles must account for:

- Road boundaries.
- Player position.
- Other vehicles.
- Current speed.
- Collision hazards.
- Weapon firing opportunities.
- Encounter difficulty.

Implement spawn pacing so that enemy attacks create challenging but understandable situations.

Use readable attack telegraphs where necessary.

---

# 8. CIVILIAN TRAFFIC

Civilian vehicles are a critical mechanic.

Include:

- Standard sedans.
- SUVs.
- Trucks.
- Civilian motorcycles.
- Occasional service vehicles.

Civilian drivers must behave differently from enemies.

They should generally:

- Maintain lanes.
- Drive predictably.
- Change lanes occasionally.
- React to approaching hazards.
- Avoid intentional attacks on the player.

Civilian vehicles must be visually distinguishable from hostile vehicles.

## Civilian protection mechanic

Players should be rewarded for eliminating enemies while avoiding civilian casualties.

Destroying a civilian vehicle must result in:

- A temporary "NO POINTS" scoring lockout.
- Distinct visual and audio warning feedback.
- An entry in the session statistics.
- Potential reduction in a clean-driving bonus.

Civilian casualties should not automatically result in instant game over.

The mechanic must meaningfully encourage careful shooting.

---

# 9. WEAPONS SYSTEM

Implement a fully functional multi-weapon system.

Every weapon must have:

- Distinct behavior.
- Clear animation.
- Appropriate visual effects.
- Unique sound.
- Collision and damage logic.
- Cooldown.
- HUD representation.
- Configurable ammunition or charges.

## Weapon 1 — Dual Machine Guns

Default player weapon.

Characteristics:

- Infinite ammunition.
- Continuous firing while held.
- Dual muzzle flashes.
- Tracer rounds.
- Impact sparks.
- Roadside impact effects.
- Limited overheating only if it improves gameplay.

Weapons fire forward from the nose of the vehicle.

Projectile collision must be accurate.

The weapons should feel immediate, powerful, and satisfying.

## Weapon 2 — Surface-to-Air Missiles

Special weapon.

Characteristics:

- Limited ammunition.
- Missile launch animation.
- Visible smoke trail.
- Fast-moving projectile.
- Optional limited homing against airborne enemies.
- Large airborne explosion.
- Effective against helicopters.

Allow the missile system to target appropriate enemies without requiring awkward precision aiming.

## Weapon 3 — Oil Slick

Defensive rear-mounted weapon.

Characteristics:

- Deploys behind the player.
- Leaves a clearly visible slick.
- Causes enemy vehicles to lose traction.
- Creates spinouts and collisions.
- Lasts for a limited duration.
- Can affect multiple pursuing enemies.

Use custom surface rendering or animated decals for a convincing effect.

## Weapon 4 — Smoke Screen

Defensive rear-mounted weapon.

Characteristics:

- Creates a dense smoke cloud.
- Obscures or disrupts enemy targeting.
- Causes pursuing enemies to slow, evade, or lose tracking.
- Uses convincing particle effects.
- Dissipates naturally.

Smoke must have an actual gameplay effect, not merely be decorative.

## Watercraft weapons

In boat mode:

- Machine guns remain available.
- Missiles remain available.
- Smoke screen remains available.
- Oil slick becomes a flaming-oil wake weapon.

All weapon behavior must be implemented in reusable systems.

---

# 10. WEAPONS VAN — SIGNATURE GAMEPLAY MECHANIC

The mobile weapons resupply truck is one of the original game's most memorable features.

Implement it as a fully animated, interactive system.

## Resupply sequence

1. A weapons van appears ahead or along the roadside.
2. The van accelerates into an appropriate position.
3. A rear loading ramp deploys.
4. The player must align their vehicle with the ramp.
5. The player drives into the van.
6. The vehicle enters a brief automated resupply sequence.
7. A special weapon is replenished or added.
8. The player's car exits and returns to the road.

## Visual treatment

- Large futuristic armored support truck.
- Distinct high-visibility design.
- Moving wheels.
- Opening and closing rear doors.
- Deployable ramp.
- Animated resupply indicators.
- Interior machinery visible during docking.
- Brief sparks or mechanical effects.

Display a weapon symbol identifying the available resupply package.

## Gameplay requirements

The van must use real collision and alignment logic.

Do not implement the sequence as a simple power-up pickup floating on the roadway.

Docking should reward player skill without being frustratingly difficult.

Support calling the van when permitted by the current mission state.

Include a cooldown and a clear dashboard indicator.

---

# 11. WATERCRAFT TRANSFORMATION

Implement the classic transition from land vehicle to speedboat.

This must be a complete playable system.

## Boathouse sequence

The player approaches an identifiable boathouse entrance.

On entering:

1. Vehicle control transitions into an automated docking animation.
2. The spy car visually transforms into, or is exchanged for, a speedboat.
3. The environment transitions from road to water.
4. The camera smoothly adjusts.
5. Boat handling becomes active.
6. Gameplay resumes immediately.

At the end of a water section, the player can return to car mode through another boathouse.

## Water physics and visuals

Include:

- Custom animated water shader.
- Subtle wave normals.
- Water reflections or reflection approximations.
- Foam around the boat.
- Wake trails.
- Spray particles.
- Boat banking during turns.
- Distinctive high-speed water movement.

Boat movement should feel lighter and more fluid than car driving while remaining arcade-friendly.

Provide enemy boats, torpedoes, barrels, and shoreline collision hazards.

---

# 12. DAMAGE, COLLISIONS, AND EXPLOSIONS

Combat must have convincing physical and visual impact.

## Collision types

Handle:

- Vehicle-to-vehicle collisions.
- Vehicle-to-road boundaries.
- Vehicle-to-guardrails.
- Vehicle-to-obstacles.
- Projectiles against vehicles.
- Bomb impacts.
- Oil slick interactions.
- Water hazards.
- Boathouse and weapons-van interactions.

Use collision layers and appropriate broad-phase collision filtering.

Do not use expensive 3D physics calculations where simpler 2D geometry is sufficient.

## Damage model

Implement:

- Health or armor state where appropriate.
- Light impact response.
- Heavy impact response.
- Temporary invulnerability after respawning.
- Vehicle destruction.
- Respawn.
- Game-over conditions.

Preserve an arcade-like high-risk feel.

Offer a Classic mode where major impacts are lethal and a Modern mode with a small damage buffer.

## Explosion effects

Create impressive layered explosions using:

- Flash sprites.
- Animated fire particles.
- Smoke plumes.
- Flying debris.
- Expanding shockwave rings.
- Sparks.
- Vehicle fragments.
- Dynamic lighting flashes.
- Small camera shakes.
- Brief time dilation for significant destruction.

Use pooled particles and GPU-friendly rendering wherever possible.

Vehicle destruction should never feel like a mesh simply disappearing.

---

# 13. SCORING AND GAME PROGRESSION

Create an arcade scoring system inspired by the original game.

Points are earned through:

- Forward travel.
- Enemy vehicle destruction.
- Helicopter destruction.
- Special tactical maneuvers.
- Boathouse transitions.
- Survival bonuses.
- Consecutive enemy eliminations.
- Clean driving and civilian protection.

Use configurable score values.

## Lives

Support:

- Initial limited protection period.
- A configurable number of lives.
- Extra lives at score thresholds.
- Respawn with temporary protection.
- End-of-game scoring.

The original game's introductory protection mechanic should influence the design, but its timing and behavior can be tuned for the modern version.

## Difficulty progression

Increase difficulty based on:

- Distance traveled.
- Survival time.
- Score milestones.
- Environment.
- Enemy encounter density.

Difficulty should escalate without making encounters unfair.

## Combo system

Add a modern optional score multiplier for consecutive enemy eliminations without civilian casualties.

Possible display:

- DOUBLE AGENT — 2X
- PURSUIT MASTER — 3X
- GHOST PROTOCOL — 4X

The multiplier should reward skilled play without overwhelming the original scoring identity.

## Game modes

Implement:

**Classic Arcade**

A faithful, high-challenge experience emphasizing survival, score, and precise driving.

**Modern Arcade**

Slightly more forgiving handling and damage, with modern progression mechanics.

**Endless Pursuit**

Continuous procedural difficulty escalation and high-score competition.

Use shared core systems rather than maintaining three separate gameplay implementations.

---

# 14. VISUAL ART DIRECTION

The game must have an unmistakable visual identity.

## Creative theme

**Retro-futuristic espionage arcade.**

Imagine classic 1980s spy-action artwork reinterpreted through modern high-end 3D game rendering.

Design pillars:

- Bold silhouettes.
- Dramatic lighting.
- Glossy vehicle materials.
- Clean geometric forms.
- Strong visual hierarchy.
- Cinematic explosions.
- Atmospheric environments.
- High readability.
- Restrained futuristic neon accents.

Avoid generic mobile-game cartoon graphics.

Avoid unlit placeholder blocks in the final experience.

## Color palette

Primary colors:

- Deep charcoal.
- Black.
- Metallic silver.
- Off-white.
- Electric blue.
- Warning red.

Environmental accents:

- Forest green.
- Desert orange.
- Ice blue.
- Neon magenta.
- Warm sodium-vapor street lighting.

## Vehicle rendering

Use physically based materials where appropriate.

Support:

- Metallic paint.
- Roughness variation.
- Emissive lighting.
- Clearcoat effects where supported.
- Directional lighting.
- Dynamic shadowing where affordable.
- Reflections and environment maps.
- Realistic-looking glass.
- Animated headlights and brake lights.

## Postprocessing

Implement carefully controlled:

- Bloom.
- Tone mapping.
- Color grading.
- Vignette.
- Limited motion-oriented speed effects.
- Subtle film grain where useful.

Do not overuse blur, chromatic aberration, or screen distortion.

Objects must remain visually crisp.

## Distinctive visual moments

Examples include:

- Missile leaving the player's car with an illuminated exhaust.
- Helicopter crashing onto the road.
- Weapons truck docking.
- Night highway reflecting neon lights.
- Speedboat emerging from a boathouse.
- Snowstorm highway pursuit.
- Large armored enemy being forced through a guardrail.

Build these moments as actual gameplay events.

---

# 15. SOUND DESIGN AND MUSIC

Sound is as important as visual presentation.

Use the Web Audio API.

Implement a centralized AudioManager.

## Vehicle sounds

Include:

- Engine idle.
- Engine acceleration.
- High-speed engine tone.
- Tire squeal.
- Skidding.
- Hard braking.
- Impact sounds.
- Metal collision sounds.
- Watercraft engine.
- Water spray.

Audio should respond continuously to vehicle state.

## Weapons and combat

Include:

- Machine-gun fire.
- Missile launch.
- Missile impact.
- Oil deployment.
- Smoke deployment.
- Enemy weapon fire.
- Explosion variations.
- Debris impacts.
- Helicopter rotor.

Use variation in pitch, filtering, or synthesized layers to avoid repetitive audio.

## Music

Compose or synthesize an original instrumental soundtrack inspired by classic espionage and arcade action.

Style:

- Driving bassline.
- Spy-jazz rhythmic elements.
- Electronic percussion.
- Analog synthesizer leads.
- High-energy pursuit themes.
- Modern cinematic transitions.

Do not use the original game's licensed *Peter Gunn* recording or melody.

Implement adaptive music intensity based on action level.

## Audio controls

- Master volume.
- Music volume.
- Effects volume.
- Mute.
- Browser audio-unlock handling.

---

# 16. USER INTERFACE AND HUD

The user interface should combine classic arcade readability with modern sophistication.

## Main menu

Display:

**SPY HUNTER '27**

Subtitle:

*THE PURSUIT NEVER ENDS.*

Menu options:

- START GAME
- GAME MODE
- HOW TO PLAY
- SETTINGS
- HIGH SCORES
- CREDITS

Use animated gameplay or a lightweight attract-mode scene behind the menu.

## Gameplay HUD

Include:

- Current score.
- High score.
- Remaining lives.
- Current speed.
- Active weapons.
- Ammunition counts.
- Weapons van availability.
- Current combo multiplier.
- Relevant warnings.

Suggested composition:

- Score at top.
- Lives near score.
- Weapon inventory along the right.
- Speed display near the lower edge.
- Brief center-screen event notifications.

Use a distinctive futuristic dashboard style.

Typography should be inspired by military equipment, arcade displays, and espionage interfaces.

## Game-over screen

Include:

- Final score.
- Highest score.
- Distance traveled.
- Enemies destroyed.
- Civilians lost.
- Accuracy.
- Survival time.
- Best combo.
- Play again.
- Return to menu.

Persist local high scores using localStorage.

---

# 17. CONTROL SYSTEM

Provide responsive keyboard and gamepad input.

## Default keyboard controls

| Action | Key |
|---|---|
| Steer left | A / Left Arrow |
| Steer right | D / Right Arrow |
| Accelerate | W / Up Arrow |
| Brake | S / Down Arrow |
| Machine guns | Space |
| Missiles | Q |
| Oil slick | E |
| Smoke screen | R |
| Call weapons van | F |
| Pause | P / Escape |
| Mute | M |
| Start / confirm | Enter |

Support simultaneous steering and weapon firing.

Use key-down/key-up state tracking rather than relying solely on repeated keypress events.

## Gamepad

Support:

- Left stick: steering.
- Right trigger: accelerate.
- Left trigger: brake.
- Primary action: machine guns.
- Secondary buttons: special weapons.
- Shoulder button: weapons van.
- Start: pause.

Provide optional vibration where supported.

## Control customization

Allow remapping of keyboard controls and adjustment of gamepad dead zones.

All settings should persist between sessions.

---

# 18. GAME ENGINE ARCHITECTURE

Use modular TypeScript systems.

Suggested project structure:

    spy-hunter-27/
    ├── public/
    │   ├── assets/
    │   │   ├── audio/
    │   │   ├── textures/
    │   │   ├── models/
    │   │   └── fonts/
    │   └── icons/
    ├── src/
    │   ├── main.ts
    │   ├── core/
    │   │   ├── Game.ts
    │   │   ├── GameLoop.ts
    │   │   ├── GameState.ts
    │   │   ├── EventBus.ts
    │   │   ├── Config.ts
    │   │   └── Random.ts
    │   ├── rendering/
    │   │   ├── Renderer.ts
    │   │   ├── CameraController.ts
    │   │   ├── Lighting.ts
    │   │   ├── Materials.ts
    │   │   ├── PostProcessing.ts
    │   │   └── ParticleSystem.ts
    │   ├── world/
    │   │   ├── WorldManager.ts
    │   │   ├── RoadGenerator.ts
    │   │   ├── RoadSegment.ts
    │   │   ├── BiomeManager.ts
    │   │   ├── EnvironmentManager.ts
    │   │   └── WaterSystem.ts
    │   ├── vehicles/
    │   │   ├── Vehicle.ts
    │   │   ├── PlayerVehicle.ts
    │   │   ├── EnemyVehicle.ts
    │   │   ├── CivilianVehicle.ts
    │   │   ├── VehicleFactory.ts
    │   │   └── VehiclePhysics.ts
    │   ├── ai/
    │   │   ├── AIController.ts
    │   │   ├── EnemyBehaviors.ts
    │   │   ├── TrafficAI.ts
    │   │   └── SpawnDirector.ts
    │   ├── combat/
    │   │   ├── WeaponManager.ts
    │   │   ├── ProjectileSystem.ts
    │   │   ├── DamageSystem.ts
    │   │   └── ExplosionSystem.ts
    │   ├── gameplay/
    │   │   ├── CollisionSystem.ts
    │   │   ├── ScoreManager.ts
    │   │   ├── DifficultyManager.ts
    │   │   ├── WeaponsVan.ts
    │   │   ├── Boathouse.ts
    │   │   └── GameModes.ts
    │   ├── input/
    │   │   ├── InputManager.ts
    │   │   ├── KeyboardInput.ts
    │   │   └── GamepadInput.ts
    │   ├── audio/
    │   │   ├── AudioManager.ts
    │   │   └── MusicManager.ts
    │   ├── ui/
    │   │   ├── HUD.ts
    │   │   ├── MainMenu.ts
    │   │   ├── PauseMenu.ts
    │   │   ├── SettingsMenu.ts
    │   │   └── GameOverScreen.ts
    │   ├── shaders/
    │   │   ├── water/
    │   │   ├── road/
    │   │   └── effects/
    │   ├── data/
    │   │   ├── Enemies.ts
    │   │   ├── Weapons.ts
    │   │   └── Biomes.ts
    │   ├── styles/
    │   └── tests/
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── README.md

Adjust this structure where justified, but preserve clear separation of responsibilities.

## Game loop

Use a fixed simulation timestep and independent rendering.

Recommended simulation rate: 60 Hz.

Use an accumulator-based update loop.

The core architecture should resemble:

    Read input
         ↓
    Advance fixed simulation
         ↓
    Update player physics
         ↓
    Update enemy AI
         ↓
    Advance procedural world
         ↓
    Process weapons/projectiles
         ↓
    Resolve collisions/damage
         ↓
    Update score/game state
         ↓
    Update visual interpolation
         ↓
    Render frame

Cap simulation catch-up steps to prevent spiral-of-death behavior after severe frame drops.

Use delta-time-independent gameplay behavior.

## Entity management

Implement efficient lifecycle management for:

- Vehicles.
- Projectiles.
- Particles.
- Environment props.
- Temporary hazards.
- Road segments.

Use pooling for high-frequency objects.

Avoid allocating large numbers of objects every frame.

---

# 19. PERFORMANCE ENGINEERING

The game must run smoothly at 60 FPS on typical desktop hardware.

Target:

- 60 FPS on mainstream integrated graphics at reduced quality.
- 60 FPS at 1080p on modern midrange dedicated graphics hardware.
- No major frame-time spikes during enemy spawning or explosions.
- No long-term memory growth during extended play.

## Optimization requirements

Apply:

- InstancedMesh for repeated environmental props where appropriate.
- Shared geometry and material instances.
- Object pooling.
- Visibility culling.
- Reduced draw calls.
- Efficient collision broad-phase.
- Cached calculations.
- Preallocated arrays where useful.
- Sensible shadow-map quality.
- Particle budgets.
- Quality-dependent effects.
- Capped device pixel ratio.

Avoid expensive per-frame geometry recreation.

Allow the player to change graphics settings without reloading the entire game where practical.

## Debug profiling

Provide a developer-only diagnostics panel showing:

- FPS.
- Frame time.
- Draw calls.
- Triangle count.
- Active vehicles.
- Active projectiles.
- Active particles.
- Loaded road segments.
- Collision checks.

Make these diagnostics easy to disable in production builds.

---

# 20. POLISH AND GAME FEEL

A major objective is making the game feel exceptionally satisfying.

Pay special attention to:

## Acceleration

The vehicle should feel as though it has powerful acceleration, even with an orthographic camera.

Use road-scroll speed, motion cues, sound, particles, and environmental movement to communicate velocity.

## Shooting

Machine guns must have:

- Minimal input latency.
- Visible muzzle flashes.
- Clear projectile paths.
- Impact confirmation.
- Audio punch.
- Satisfying enemy damage response.

## Collisions

Impacts should create:

- Instant visual feedback.
- Appropriate knockback.
- Sparks and debris.
- Short camera movement.
- Destruction when warranted.

## Threat readability

The player must always be able to distinguish:

- Hostile targets.
- Civilians.
- Obstacles.
- Projectiles.
- Safe routes.
- Special gameplay opportunities.

## Difficulty

The player should frequently experience satisfying near misses and narrow escapes.

The game should reward mastery rather than random survival.

Use encounter pacing:

1. Introduction.
2. Escalation.
3. Intense confrontation.
4. Short recovery.
5. Resupply or environmental transition.
6. Renewed escalation.

Avoid constant maximal chaos.

---

# 21. OPTIONAL ADVANCED FEATURES

Once the foundational game is complete and polished, consider:

### Cinematic set pieces

- Helicopter attacks during bridge crossings.
- Armored convoys.
- Multi-vehicle enemy ambushes.
- Destructible roadside structures.
- High-speed tunnel sequences.

### Boss encounters

- Heavily armed military transport.
- Specialized attack helicopter.
- Armored multi-vehicle convoy.
- Powerful experimental interceptor.

### Dynamic environments

- Day-to-night progression.
- Rain.
- Fog.
- Snowstorms.
- Roadside fires.
- Wet-road reflections.

### Replayability

- Daily seeded challenges.
- Unlockable paint schemes.
- Achievement system.
- Mission modifiers.
- Local replay statistics.

Do not implement optional features by compromising gameplay responsiveness or core feature completeness.

---

# 22. DEVELOPMENT IMPLEMENTATION PHASES

Execute the work in the following order.

## Phase 1 — Functional vertical slice

Build:

- Vite and TypeScript project.
- Three.js renderer.
- Camera.
- Main game loop.
- Player vehicle mesh.
- Moving road.
- Steering.
- Acceleration and braking.
- Basic enemy spawning.
- Machine-gun firing.
- Collision detection.
- Basic score.
- Start/game-over flow.

**Acceptance criterion:** A genuinely playable combat-driving loop exists.

## Phase 2 — Arcade gameplay

Implement:

- All primary enemy archetypes.
- Civilian traffic.
- Enemy AI.
- Complete weapons system.
- Destruction and respawning.
- Scoring rules.
- Difficulty escalation.
- Weapons van.

**Acceptance criterion:** The game reproduces the essential high-skill arcade gameplay identity.

## Phase 3 — World systems

Implement:

- Procedural curves.
- Biome transitions.
- Road forks.
- Bridges.
- Snow/ice handling.
- Boathouse transitions.
- Speedboat gameplay.
- Waterborne enemies.

**Acceptance criterion:** A complete session traverses multiple distinct environments and supports both road and water combat.

## Phase 4 — Visual and audio production

Implement:

- Detailed original vehicle models.
- Improved environments.
- Custom materials and shaders.
- Particle effects.
- Explosions.
- Dynamic lighting.
- Postprocessing.
- Engine and weapon audio.
- Original music.
- Camera polish.

**Acceptance criterion:** The game looks and feels like a deliberate, polished modern arcade title.

## Phase 5 — Interface and usability

Implement:

- Full title screen.
- Game mode selection.
- Complete HUD.
- Pause/settings interface.
- Gamepad support.
- High scores.
- Accessibility settings.
- Visual tutorials and control hints.

**Acceptance criterion:** A first-time player can launch and understand the game without external instructions.

## Phase 6 — Testing, tuning, and optimization

Perform:

- TypeScript validation.
- Production build testing.
- Unit tests.
- Browser gameplay testing.
- Collision edge-case testing.
- Extended play-session testing.
- Memory-leak investigation.
- Difficulty balancing.
- Performance profiling.
- Visual refinement.

**Acceptance criterion:** The game is stable, responsive, and enjoyable through complete sessions.

---

# 23. TESTING AND QUALITY ASSURANCE

Write automated tests for important deterministic systems.

At minimum, test:

- Input state changes.
- Vehicle acceleration and braking.
- Frame-rate-independent movement.
- Road generator continuity.
- Collision detection.
- Weapon ammunition consumption.
- Projectile hit detection.
- Scoring and civilian penalties.
- Lives and respawning.
- Game-state transitions.
- Difficulty progression.
- Seed reproducibility.

Use Playwright for browser-level smoke testing.

Test launching the game, beginning a session, steering, firing, pausing, restarting, and reaching game over.

Also manually validate:

- No major visual glitches.
- No disappearing player vehicle.
- No unfair enemy spawns.
- No gaps between road segments.
- No persistent projectile objects after despawning.
- No broken controls after pause/resume.
- No repeat-triggering of one-shot actions while holding a key.
- No lingering audio after returning to the menu.
- No severe memory growth during long sessions.
- No uncaught console exceptions during normal play.

Add a reproducible testing checklist to the README.

---

# 24. ACCESSIBILITY AND RESPONSIVENESS

Desktop gameplay is the primary target.

The interface must adapt gracefully to different window sizes.

Include:

- Responsive canvas resizing.
- Adjustable quality.
- Reduced-motion option.
- Adjustable screen shake.
- Visible keybindings.
- Remappable keyboard controls.
- High-contrast HUD mode.
- Color-independent enemy/civilian identification.
- Adjustable music and effects volume.

Mobile controls are optional and should not delay desktop completeness.

---

# 25. ASSET CREATION GUIDELINES

Do not rely on inaccessible or paid external assets.

Prefer original, procedurally generated geometry and effects where reasonable.

Where higher-fidelity authored assets meaningfully improve the game, support GLTF/GLB loading.

Required primary visuals must remain available without external paid services.

Create attractive original placeholder models early, then improve them incrementally.

Never present temporary boxes and flat colored planes as the final artistic implementation.

Keep asset licenses and attributions documented.

The game title is requested as "Spy Hunter '27," but the implementation must not assume rights to existing trademarks, logos, commercial artwork, or copyrighted music. Treat branding as provisional for any public commercial distribution.

---

# 26. DEFINITION OF DONE

The game is complete only when all of the following are true:

- [ ] The player can launch the game and start a session.
- [ ] A fully modeled spy vehicle appears in a scrolling 3D world.
- [ ] Steering, acceleration, and braking feel responsive.
- [ ] Roads extend continuously and curve naturally.
- [ ] Enemy vehicles spawn and execute distinct behaviors.
- [ ] Civilian traffic is present and distinguishable.
- [ ] Machine guns fire and damage valid targets.
- [ ] Missiles function against airborne threats.
- [ ] Oil slicks create functional road hazards.
- [ ] Smoke screens affect enemy behavior.
- [ ] The weapons van can be entered to replenish weapons.
- [ ] Cars collide with vehicles, boundaries, and hazards.
- [ ] Enemy vehicles explode with satisfying visual effects.
- [ ] The player can lose lives and respawn.
- [ ] Score, lives, speed, and weapon status are displayed.
- [ ] The game transitions between at least five environment types.
- [ ] Boathouse transitions and speedboat gameplay work.
- [ ] Sound effects and original music are included.
- [ ] The title, pause, settings, and game-over screens function.
- [ ] Gamepad input works.
- [ ] High scores persist locally.
- [ ] Graphics settings function.
- [ ] The game runs at an acceptable frame rate.
- [ ] Type checking and production builds pass.
- [ ] Core automated tests pass.
- [ ] No known game-breaking errors remain.

Do not describe a feature as implemented if only a visual placeholder or stub exists.

---

# 27. INSTRUCTIONS TO THE DEVELOPMENT AGENT

You are expected to **build the actual game**, not merely discuss how it could be built.

Work autonomously and methodically.

### Execution rules

1. Inspect the existing repository, if one is provided, before making modifications.
2. Establish a clean, working project architecture.
3. Implement the smallest fully playable vertical slice first.
4. Build complete gameplay systems incrementally.
5. Validate each major subsystem before proceeding.
6. Execute builds and tests instead of assuming code works.
7. Prioritize visual fidelity and gameplay feel together.
8. Refactor weak implementations instead of layering workarounds.
9. Keep code modular and clearly documented.
10. Prefer real implementations over mocks, stubs, or purely decorative simulations.
11. Maintain working game functionality during development.
12. Do not stop after project scaffolding or the first proof of concept.

If a specific visual asset or sound effect cannot be produced, create a functional and aesthetically consistent original alternative.

Make reasonable engineering and design decisions autonomously.

Maintain a ROADMAP.md tracking implementation phases, completion status, deferred features, and known limitations.

Keep the README updated with:

- Installation requirements.
- Development commands.
- Production build instructions.
- Controls.
- Game features.
- Architecture overview.
- Testing instructions.
- Known limitations.

### Final deliverables

Provide:

1. Complete source code.
2. Working Three.js/WebGL game.
3. All required original assets.
4. Development and production build configuration.
5. Automated tests.
6. README documentation.
7. Development roadmap.
8. Summary of implemented features and verified test results.

The final implementation must be runnable locally using:

    npm install
    npm run dev

And must build for production with:

    npm run build

### FINAL CREATIVE DIRECTIVE

The most important result is the **feeling of playing Spy Hunter**.

The player should experience the constant forward momentum, aggressive enemies, split-second driving decisions, powerful weapons, memorable resupply interactions, and escalating danger that made the 1983 original special.

But the finished game must look and feel like it belongs in 2027.

It should be visually stunning, technically sophisticated, highly responsive, intensely replayable, and unmistakably an arcade combat-driving experience.

**Create an experience players want to restart immediately after losing.**

**Build SPY HUNTER '27.**
