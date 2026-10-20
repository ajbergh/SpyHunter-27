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
