# SPY HUNTER '27

A modern, original WebGL arcade-combat driving game inspired by the feel of early 1980s vertical-scrolling highway games. Powered by **Three.js + TypeScript + Vite**.

> **Project status:** Phase 2 in progress. Phase 1 driving, traffic and scoring are implemented; initial special weapons (missile, oil, smoke), civilian NO POINTS penalty, enemy roles and an alignment-based support truck are now added. Curved highways, watercraft, biome variety, watercraft, biome variety and premium art/audio remain roadmap items. Phase 2 includes helicopter bombs, enforcer fire, motorcycle attackers, paired pursuits, timed combos and pooled explosions. Initial Phase 3 curve/biome/watercraft traversal and game mode selection are implemented. Automated Chromium WebGL start/control/pause smoke testing passed; the expanded Phase 2 suite has 30 passing unit tests. Extended manual gameplay, visual quality reviews and a performance soak remain outstanding.

## Run locally

Requires Node.js 20.19+ (Node 22 recommended).

```bash
npm install
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

The **Settings** menu (also accessible while paused) saves High/Medium/Low graphics settings, music and effects volumes, reduced-motion preference, and an optional FPS/draw-call diagnostics overlay. High quality enables restrained bloom through a Three.js EffectComposer pipeline. The soundtrack and speed-reactive engine audio are original synthesized Web Audio.

### Game modes and environment progression

Choose **Classic Arcade**, **Modern Arcade**, or **Endless Pursuit** on the title screen. Modern starts with five lives and lighter traffic; Classic has three lives; Endless has a higher encounter rate.

The deterministic streamed world progresses through forest, desert, snow, neon city and waterway regions. The interceptor transforms into a speedboat in the water region, where hostile patrol boats appear. Snow and water have distinct arcade handling, with extra steering inertia on ice. This is an early functional biome/boat transition; animated boathouse gates, boat wakes, explosive floating barrels and enemy torpedo fire are implemented. Collision-driven boathouse entry/exit and shoreline hazards still require refinement.

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
