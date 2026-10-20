# SPY HUNTER '27

A modern, original WebGL arcade-combat driving game inspired by the feel of early 1980s vertical-scrolling highway games. Powered by **Three.js + TypeScript + Vite**.

> **Project status:** Phase 2 in progress. Phase 1 driving, traffic and scoring are implemented; initial special weapons (missile, oil, smoke), civilian NO POINTS penalty, enemy roles and an alignment-based support truck are now added. Curved highways, watercraft, biome variety, specialized airborne enemies and premium art/audio remain roadmap items. Browser gameplay validation is outstanding.

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

The game also reads compatible gamepads (left stick to steer, right trigger to accelerate, left trigger to brake, main button to shoot, face buttons for specials, left shoulder to call truck, Start to pause).

## Architecture

- `src/core/Game.ts` coordinates the game state, fixed-step simulation, collisions, scoring and render lifecycle.
- `src/core/GameLoop.ts` implements a capped 60 Hz simulation accumulator and independent rendering.
- `src/core/Input.ts` normalizes keyboard/gamepad controls.
- `src/world/Road.ts` streams recyclable three-dimensional highway segments and roadside scenery.
- `src/entities/` owns original procedural vehicle meshes and traffic entities.
- `src/combat/Projectiles.ts` handles pooled bullets and hit checks.
- `src/combat/SpecialWeapons.ts` manages missile homing, oil/smoke hazard interactions, ammo and cooldown.
- `src/gameplay/WeaponsVan.ts` implements roadside truck deployment, ramp alignment, docking and refill.
- `src/gameplay/Scoring.ts` implements civilian score lockout and extra-life milestones.
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
