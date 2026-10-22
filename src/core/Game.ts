import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createFilmicPass, setFilmicReducedMotion } from '../rendering/FilmicPass';
import { highlightBloom } from '../rendering/CinematicGrade';
import { GameLoop } from './GameLoop';
import { Input } from './Input';
import { MAX_LIVES, PLAYER_Z, approach, distancePoints, intersects, scoreForTarget, spawnInterval } from './logic';
import { Road } from '../world/Road';
import { BoatWake } from '../world/BoatWake';
import { WaterHazards } from '../world/WaterHazards';
import { Weather } from '../rendering/Weather';
import { VisualDirector } from '../rendering/VisualDirector';
import { SkyAtmosphere } from '../rendering/SkyAtmosphere';
import { SpeedStreaks } from '../rendering/SpeedStreaks';
import { HeadlightBeams } from '../rendering/HeadlightBeams';
import { SkidTrails } from '../rendering/SkidTrails';
import { CAMERA_FRAME, cinematicFov } from '../rendering/CameraFraming';
import { Player } from '../entities/Player';
import { TrafficVehicle } from '../entities/Traffic';
import { planRearPursuit } from '../gameplay/RearPursuitDirector';
import { planRearFlank } from '../gameplay/RearFlankDirector';
import { Projectiles } from '../combat/Projectiles';
import { SpecialWeapons, type WeaponKind } from '../combat/SpecialWeapons';
import { AirThreats, Helicopter } from '../combat/AirThreats';
import { EnemyProjectiles } from '../combat/EnemyProjectiles';
import { Interface, type Screen } from '../ui/Interface';
import { AudioManager } from '../audio/Audio';
import { Scoring } from '../gameplay/Scoring';
import { GAME_MODES, type GameMode } from '../gameplay/GameModes';
import { loadPreferences, type GamePreferences } from '../gameplay/Settings';
import { WeaponsVan } from '../gameplay/WeaponsVan';
import { planEncounter } from '../gameplay/EncounterDirector';
import { ExplosionEffects } from '../combat/ExplosionEffects';
import { VehicleDebris } from '../combat/VehicleDebris';
import { accuracyPercent } from '../gameplay/SessionMetrics';
import {
  challengeDate, challengeSeed, dailyRecordKey, seededGenerator, bestDailyScore,
} from '../gameplay/DailyChallenge';
import { boundaryStrike, gradeBoathouseEntry } from '../gameplay/Boundary';
import { biomeAt } from '../world/WorldPlan';
import { splitDangerous, splitMedianHalfWidth, upcomingSplit, escapeFromMedian } from '../world/SplitRoad';
import { RouteDirector, ROUTE_CHOICES } from '../gameplay/RouteDirector';
import { bridgeAhead } from '../world/BridgePlan';
import { chooseHelicopterProfile } from '../combat/FlightDirector';
import { planSquadTactics } from '../gameplay/SquadTactics';

export class Game {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(CAMERA_FRAME.baseFov, 1, 0.1, 420);
  private readonly renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private filmic: ShaderPass | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private preferences = loadPreferences();
  private renderTime = 0;
  private averageFps = 60;
  private readonly ui: Interface;
  private readonly input = new Input();
  private readonly audio = new AudioManager();
  private readonly road: Road;
  private readonly wake: BoatWake;
  private readonly waterHazards: WaterHazards;
  private readonly weather: Weather;
  private readonly visuals: VisualDirector;
  private readonly sky: SkyAtmosphere;
  private readonly streaks: SpeedStreaks;
  private readonly headlights: HeadlightBeams;
  private readonly skidTrails: SkidTrails;
  private readonly player: Player;
  private readonly bullets: Projectiles;
  private readonly specials: SpecialWeapons;
  private readonly air: AirThreats;
  private readonly enemyShots: EnemyProjectiles;
  private readonly van: WeaponsVan;
  private readonly scoring = new Scoring();
  private readonly routes = new RouteDirector();
  private readonly loop: GameLoop;
  private readonly traffic: TrafficVehicle[] = [];
  private nextSquadId = 1;
  private readonly effects: ExplosionEffects;
  private readonly debris: VehicleDebris;
  private screen: Screen = 'menu';
  private mode: GameMode = 'classic';
  private random: () => number = Math.random;
  private dailyDate = '';
  private dailyBest = 0;
  private best = 0;
  private lives = MAX_LIVES;
  private distance = 0;
  private spawnClock = 0;
  private airSpawnClock = 9;
  private tailSpawnClock = 15;
  private shotClock = 0;
  private grace = 0;
  private dockingTimer = 0;
  private dockingEntryX = 0;
  private dockingEntryZ = PLAYER_Z;
  private boundaryCooldown = 0;
  private gateWarned = false;
  private splitWarnAt = -1;
  private bridgeWarnAt = -1;
  private splitInProgress = false;
  private splitClean = true;
  private toastClock = 0;
  private survivalSeconds = 0;
  private roundsFired = 0;
  private roundsHit = 0;

  constructor(host: HTMLElement) {
    this.ui = new Interface(host);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.01;
    // Procedural studio reflection environment: real PMREM specular response
    // on clearcoat, glass and metals without remote or licensed image assets.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(room, 0.04).texture;
    this.scene.environmentIntensity = 0.49;
    room.dispose();
    pmrem.dispose();
    this.ui.stage.appendChild(this.renderer.domElement);
    this.camera.position.set(0, CAMERA_FRAME.height, CAMERA_FRAME.positionZ);
    this.camera.lookAt(0, 0, CAMERA_FRAME.targetZ);
    this.visuals = new VisualDirector(this.scene, this.renderer);
    this.sky = new SkyAtmosphere(this.scene);
    this.road = new Road(this.scene);
    this.wake = new BoatWake(this.scene);
    this.waterHazards = new WaterHazards(this.scene);
    this.weather = new Weather(this.scene);
    this.streaks = new SpeedStreaks(this.scene);
    this.headlights = new HeadlightBeams(this.scene);
    this.skidTrails = new SkidTrails(this.scene);
    this.player = new Player(this.scene);
    this.bullets = new Projectiles(this.scene);
    this.specials = new SpecialWeapons(this.scene);
    this.air = new AirThreats(this.scene);
    this.enemyShots = new EnemyProjectiles(this.scene);
    this.effects = new ExplosionEffects(this.scene);
    this.debris = new VehicleDebris(this.scene);
    this.van = new WeaponsVan(this.scene);
    try { this.best = Number(localStorage.getItem('spyhunter27-best') || 0) || 0; } catch { /* private browsing may deny storage */ }
    this.refreshHUD();
    this.ui.onStart = (mode) => this.start(mode);
    this.ui.onResume = () => this.resume();
    this.ui.onSettingsChange = (settings) => this.configure(settings);
    this.loop = new GameLoop((dt) => this.update(dt), () => this.render());
    new ResizeObserver(() => this.resize()).observe(this.ui.stage);
    window.addEventListener('blur', () => { if (this.screen === 'playing') this.pause(); });
    this.configure(this.preferences);
    this.resize();
    if (import.meta.env.DEV &&
        new URLSearchParams(window.location.search).get('testDrive') === '1') {
      // Browser acceptance tests must advance actual fixed-step gameplay, not
      // wall time: CI's software WebGL renderer may display only a few frames
      // in several real seconds. This test-only bridge reads ordinary keyboard
      // input and executes the same update method as the production game loop.
      type TestWindow = Window & {
        __spy27AdvanceDriving?: (frames: number) => {
          z: number; speed: number; screen: Screen;
        };
      };
      (window as TestWindow).__spy27AdvanceDriving = (frames: number) => {
        const count = Number.isFinite(frames) ?
          Math.min(360, Math.max(0, Math.floor(frames))) : 0;
        for (let i = 0; i < count; i++) this.update(1 / 60);
        this.renderer.domElement.dataset.playerZ = this.player.z.toFixed(2);
        return { z: this.player.z, speed: this.player.speed, screen: this.screen };
      };
    }
    this.loop.start();
  }

  private resize(): void {
    const width = Math.max(1, this.ui.stage.clientWidth);
    const height = Math.max(1, this.ui.stage.clientHeight);
    this.renderer.setSize(width, height, false);
    this.composer?.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private configure(settings: GamePreferences): void {
    this.preferences = settings;
    this.audio.configure(settings.musicVolume, settings.effectsVolume);
    this.input.setBindings(settings.bindings);
    this.input.setGamepadBindings(settings.gamepadBindings);
    this.weather.setQuality(settings.quality);
    this.air.setPreferences(settings.quality, settings.reducedMotion);
    this.road.setQuality(settings.quality);
    this.visuals.configure(settings.quality);
    this.streaks.setPreferences(settings.quality, settings.reducedMotion);
    this.headlights.setQuality(settings.quality);
    this.skidTrails.setQuality(settings.quality);
    this.wake.setQuality(settings.quality);
    const ratio = settings.quality === 'low' ? 1 : settings.quality === 'high' ? 2 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, ratio));
    if (settings.quality === 'high' && !this.composer) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      const grade = highlightBloom(this.road.biome);
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(1, 1), grade.strength, grade.radius, grade.threshold,
      );
      this.composer.addPass(this.bloomPass);
      this.filmic = createFilmicPass();
      this.composer.addPass(this.filmic);
      this.composer.addPass(new OutputPass());
    }
    if (this.filmic) setFilmicReducedMotion(this.filmic, settings.reducedMotion);
    this.resize();
  }

  private start(mode: GameMode = this.mode): void {
    this.mode = mode;
    this.dailyDate = mode === 'daily' ? challengeDate() : '';
    this.random = mode === 'daily' ? seededGenerator(challengeSeed(this.dailyDate)) : Math.random;
    this.dailyBest = 0;
    if (this.dailyDate) {
      try { this.dailyBest = Number(localStorage.getItem(dailyRecordKey(this.dailyDate))) || 0; }
      catch { /* Storage optional. */ }
    }
    void this.audio.unlock();
    for (const car of this.traffic) car.dispose(this.scene);
    this.traffic.length = 0;
    this.nextSquadId = 1;
    this.ui.tactics(false);
    this.clearExplosions();
    this.bullets.reset();
    this.specials.reset();
    this.air.reset();
    this.enemyShots.reset();
    this.van.reset();
    this.road.reset();
    this.wake.reset();
    this.waterHazards.reset();
    this.streaks.reset();
    this.skidTrails.reset();
    this.headlights.step('forest', false);
    this.player.reset();
    this.scoring.reset();
    this.routes.reset();
    this.distance = 0;
    if (import.meta.env.DEV) {
      const seek = Number(new URLSearchParams(window.location.search).get('testDistance') ?? 0);
      if (Number.isFinite(seek) && seek >= 0 && seek <= 100000 && seek > 0) {
        this.road.seek(seek);
        this.distance = seek;
        this.player.setBoat(this.road.biome === 'water');
      }
      // Deterministic E2E fork setup: align a test vehicle before simulation.
      const laneParam = new URLSearchParams(window.location.search).get('testLane');
      if (laneParam !== null) {
        const lane = Number(laneParam);
        if (Number.isFinite(lane)) {
          this.player.x = Math.max(-7.1, Math.min(7.1, lane));
          this.player.mesh.position.x = this.player.x;
        }
      }
      // Screenshot-only deterministic aerial encounter. Production bundles do
      // not enter this dev harness, so normal threat timing stays unchanged.
      const testHelicopter = new URLSearchParams(window.location.search).get('testHelicopter');
      if (testHelicopter === 'patrol' || testHelicopter === 'ace') {
        this.air.spawn(0, testHelicopter, -34);
      }
      if (new URLSearchParams(window.location.search).get('testHeadOn') === '1') {
        this.traffic.push(new TrafficVehicle(this.scene, 0, -47, true, 0, 0xb93d53, 26, null, true));
      }
      if (new URLSearchParams(window.location.search).get('testTail') === '1') {
        this.traffic.push(new TrafficVehicle(this.scene, 0, 34, true, 0, 0xc58235, 48, null, false, true));
      }
    }
    this.lives = GAME_MODES[mode].lives;
    this.grace = mode === 'modern' ? 5 : 3;
    this.dockingTimer = 0;
    this.dockingEntryX = 0;
    this.dockingEntryZ = PLAYER_Z;
    this.boundaryCooldown = 0;
    this.gateWarned = false;
    this.splitWarnAt = -1;
    this.bridgeWarnAt = -1;
    this.splitInProgress = false;
    this.splitClean = true;
    this.spawnClock = 0.8;
    this.airSpawnClock = 9;
    this.tailSpawnClock = 15;
    if (import.meta.env.DEV &&
        new URLSearchParams(window.location.search).get('testDrive') === '1') {
      // Isolate throttle/brake acceptance from randomly timed enemy collisions.
      // Normal release builds and every other test retain full encounter AI.
      this.spawnClock = 999;
      this.airSpawnClock = 999;
      this.tailSpawnClock = 999;
    }
    this.shotClock = 0;
    this.toastClock = 0;
    this.survivalSeconds = 0;
    this.roundsFired = 0;
    this.roundsHit = 0;
    this.ui.message('');
    this.screen = 'playing';
    this.ui.show(this.screen);
    this.refreshHUD();
    this.audio.confirm();
  }

  private pause(): void {
    this.audio.silence();
    this.screen = 'paused';
    this.ui.show(this.screen);
  }

  private resume(): void {
    if (this.screen !== 'paused') return;
    this.screen = 'playing';
    this.ui.show(this.screen);
    void this.audio.unlock();
  }

  private update(dt: number): void {
    const controls = this.input.read();
    if (controls.mutePressed) this.ui.mute(this.audio.toggleMute());
    if (this.screen === 'menu' || this.screen === 'gameover') {
      if (controls.startPressed) this.start();
      return;
    }
    if (controls.pausePressed) {
      if (this.screen === 'paused') this.resume();
      else this.pause();
      return;
    }
    if (this.screen !== 'playing') return;
    this.survivalSeconds += dt;

    if (this.dockingTimer > 0) {
      this.dockingTimer = Math.max(0, this.dockingTimer - dt);
      this.van.step(dt, this.player.speed, this.player.x, this.player.z);
      const progress = 1 - this.dockingTimer / 1.3;
      // Move the visible car up the deployed ramp and into the support van.
      this.player.mesh.position.x = this.dockingEntryX + (6.4 - this.dockingEntryX) * progress;
      this.player.mesh.position.z = this.dockingEntryZ - progress * 7;
      this.player.mesh.position.y = 0.12 + Math.sin(progress * Math.PI) * 0.68;
      this.player.mesh.scale.setScalar(1 - progress * 0.13);
      this.camera.position.x = approach(this.camera.position.x, 3.4, 5, dt);
      if (this.dockingTimer === 0) {
        this.player.mesh.position.set(this.player.x, 0.12, this.player.z);
        this.player.mesh.scale.setScalar(1);
        this.player.invulnerability = 3.4;
        this.grace = 2.2;
        this.enemyShots.reset();
        // The deployment zone must be clear before control is returned.
        for (let i = this.traffic.length - 1; i >= 0; i--) {
          const car = this.traffic[i];
          if (Math.abs(car.z - this.player.z) < 13 && Math.abs(car.x - this.player.x) < 3.4) this.removeVehicle(i);
        }
        this.announce('INTERCEPTOR REDEPLOYED — WEAPONS ONLINE');
      }
      this.stepExplosions(dt);
      this.refreshHUD();
      return;
    }

    if (controls.gearPressed) {
      const gear = this.player.shiftGear();
      if (gear !== null) {
        this.announce(gear === 'high' ? 'HIGH GEAR ENGAGED — FULL SPEED' : 'LOW GEAR ENGAGED — FAST ACCELERATION');
        this.audio.confirm();
      }
    }
    this.player.step(dt, controls, this.road.biome, GAME_MODES[this.mode].speedScale,
      this.preferences.reducedMotion);
    const targetFov = cinematicFov(this.player.speed, this.preferences.reducedMotion);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, Math.min(1, dt * 0.9));
    this.camera.updateProjectionMatrix();
    this.streaks.step(dt, this.player.speed);
    this.headlights.step(this.road.biome, this.player.isBoat);
    this.skidTrails.step(dt, this.player.speed, this.player.x,
      controls.steer, controls.brake, this.road.biome, this.player.isBoat, this.player.z);
    this.boundaryCooldown = Math.max(0, this.boundaryCooldown - dt);
    if (this.boundaryCooldown === 0 && boundaryStrike(
      this.player.x, controls.steer, this.player.speed, this.player.isBoat
    )) {
      this.boundaryCooldown = 3;
      this.damagePlayer(this.player.isBoat ? 'RIVERBANK COLLISION' : 'GUARDRAIL COLLISION');
    }
    if (this.lives <= 0) return;
    this.camera.position.x = approach(this.camera.position.x, this.player.x * 0.13, 3.2, dt);
    const biomeChanged = this.road.step(this.player.speed, dt);
    if (biomeChanged) {
      const transfer = gradeBoathouseEntry(this.player.x, this.player.speed);
      if (transfer === 'scrape') {
        this.damagePlayer('BOATHOUSE WALL COLLISION');
        if (this.lives <= 0) return;
        this.player.x = 0;
        this.player.mesh.position.x = 0;
        this.scoring.resetCombo();
      } else {
        this.scoring.bonus(350);
      }
      const onWater = this.road.biome === 'water';
      this.player.setBoat(onWater);
      this.player.invulnerability = 3.5;
      this.grace = 2;
      // Road/river portals are momentary level transitions: clear the old
      // encounter, player bullets and aerial bombs before entering the new mode.
      for (const car of this.traffic) car.dispose(this.scene);
      this.traffic.length = 0;
      this.air.reset();
      this.enemyShots.reset();
      this.bullets.reset();
      this.van.reset();
      this.waterHazards.reset();
      this.announce(transfer === 'scrape'
        ? 'BOATHOUSE MISALIGNED — WALL IMPACT / RECOVERY'
        : onWater
          ? 'BOATHOUSE DOCKED — SPEEDBOAT DEPLOYED +350'
          : 'BOATHOUSE DOCKED — INTERCEPTOR RESTORED +350');
    }
    this.wake.step(dt, this.player.speed, this.player.x, this.player.isBoat, controls.steer, this.player.z);
    this.weather.step(dt, this.player.speed, this.road.biome);
    this.visuals.step(dt, this.road.biome, this.distance / 22, this.preferences.reducedMotion);
    this.sky.step(dt, this.road.biome);
    this.distance += this.player.speed * dt;
    const bridge = bridgeAhead(this.distance);
    if (bridge && bridge.start !== this.bridgeWarnAt) {
      this.bridgeWarnAt = bridge.start;
      this.announce(bridge.type === 'canyon'
        ? 'CANYON BRIDGE AHEAD — STAY BETWEEN GUARDRAILS'
        : 'CITY VIADUCT AHEAD — KEEP SPEED & WATCH TRAFFIC');
    }
    const forkWarning = upcomingSplit(this.distance);
    if (forkWarning !== null) {
      const marker = Math.round(this.distance + forkWarning);
      if (marker !== this.splitWarnAt) {
        this.splitWarnAt = marker;
        this.announce('DIVIDED HIGHWAY AHEAD — CHOOSE LEFT OR RIGHT BRANCH');
      }
    }
    const gap = splitMedianHalfWidth(this.distance);
    if (gap > 1.16 && !this.splitInProgress) {
      this.splitInProgress = true;
      this.splitClean = true;
    }
    if (splitDangerous(this.distance, this.player.x)) {
      this.splitClean = false;
      this.damagePlayer('DIVIDED HIGHWAY CENTER MEDIAN IMPACT');
      if (this.lives <= 0) return;
      this.player.x = escapeFromMedian(this.player.x, this.distance);
      this.player.mesh.position.x = this.player.x;
    }
    if (this.splitInProgress && gap < 0.08) {
      this.splitInProgress = false;
      if (this.splitClean) this.scoring.bonus(200);
    }
    const routeEvent = this.routes.step(this.distance, this.player.x);
    if (routeEvent?.type === 'selected') {
      const route = ROUTE_CHOICES[routeEvent.side];
      this.announce('ROUTE SELECTED — ' + route.label + ' // ' + route.risk);
    } else if (routeEvent?.type === 'completed' && this.splitClean) {
      const route = ROUTE_CHOICES[routeEvent.side];
      const earned = this.scoring.bonus(route.score);
      const ammo = this.specials.grantAmmo(route.ammo);
      this.announce(route.label + ' CLEARED ' + (earned ? '+' + earned : 'NO POINTS') +
        (ammo ? ' // ' + route.ammo.toUpperCase() + ' +1' : ''));
    }
    const toGate = 1000 - (this.distance % 1000);
    const nextBiome = biomeAt(this.distance + toGate + 1);
    const waterTransfer = this.road.biome === 'water' || nextBiome === 'water';
    if (toGate > 125) this.gateWarned = false;
    if (toGate < 85 && waterTransfer && !this.gateWarned) {
      this.gateWarned = true;
      this.announce('BOATHOUSE AHEAD — ALIGN CENTER & MAINTAIN 11–52 SPEED');
    }
    this.scoring.tick(dt, distancePoints(this.player.speed, dt));
    this.airSpawnClock -= dt;
    if (!this.player.isBoat && this.distance > 260 && this.airSpawnClock <= 0) {
      if (this.air.helicopters.length === 0) {
        const profile = chooseHelicopterProfile(this.distance, this.random);
        this.air.spawn((this.random() - 0.5) * 9, profile);
        this.announce(profile === 'ace'
          ? 'ACE GUNSHIP DETECTED — EVASIVE STRAFING / ARMORED'
          : 'AIR THREAT DETECTED — MISSILES RECOMMENDED');
      }
      this.airSpawnClock = 17 + this.random() * 8;
    }
    this.grace = Math.max(0, this.grace - dt);
    this.tailSpawnClock -= dt;
    if (this.tailSpawnClock <= 0) {
      const pursuit = planRearPursuit(
        this.traffic, this.distance, this.player.x, this.player.isBoat,
        splitMedianHalfWidth(this.distance + 42) > 0.1 || this.routes.side !== null,
        this.van.mesh.visible || this.dockingTimer > 0,
        this.random,
      );
      if (pursuit) {
        this.traffic.push(new TrafficVehicle(
          this.scene, pursuit.x, pursuit.z, true, 0, 0xd7a64e,
          pursuit.speed, null, false, true,
        ));
        this.announce('REAR PURSUIT — SHIFT HIGH OR EVADE');
        this.audio.warning();
        this.tailSpawnClock = 22 + this.random() * 8;
      } else {
        // Retry after transient terrain/traffic restrictions without flooding.
        this.tailSpawnClock = 3;
      }
    }
    this.spawnClock -= dt;
    if (this.spawnClock <= 0) {
      this.spawnEncounter();
      const branchPace = this.routes.side === 'left' ? 1.35 : this.routes.side === 'right' ? 0.74 : 1;
      this.spawnClock += spawnInterval(this.distance) * GAME_MODES[this.mode].spawnScale * branchPace * (0.8 + this.random() * 0.4);
    }

    this.handleWeapons(controls.missilePressed, controls.oilPressed, controls.smokePressed);
    if (controls.vanPressed) {
      if (!this.player.isBoat && this.van.call()) this.announce('SUPPORT VAN INBOUND — ALIGN WITH REAR RAMP');
      else this.announce('SUPPORT VAN NOT READY');
    }
    const vanEvent = this.player.isBoat ? null : this.van.step(dt, this.player.speed, this.player.x, this.player.z);
    if (vanEvent === 'docked') {
      this.specials.refill();
      this.dockingEntryX = this.player.x;
      this.dockingEntryZ = this.player.z;
      const resupplyBonus = this.scoring.bonus(500);
      this.player.invulnerability = 2.5;
      this.dockingTimer = 1.3;
      this.announce(resupplyBonus ? 'DOCKING SUCCESS — WEAPONS REPLENISHED  +500'
        : 'WEAPONS REPLENISHED — NO POINTS DURING CIVILIAN PENALTY');
      this.audio.resupply();
    } else if (vanEvent === 'align-lane') {
      this.announce('DOCKING ALIGNMENT — MOVE INTO RIGHT LANE');
      this.audio.warning();
    } else if (vanEvent === 'adjust-speed') {
      this.announce('DOCKING SPEED — MAINTAIN 15–49');
      this.audio.warning();
    } else if (vanEvent === 'missed') {
      this.announce('SUPPORT VAN MISSED — TRY ANOTHER APPROACH');
    }

    this.shotClock -= dt;
    if (controls.fire && this.shotClock <= 0 && this.dockingTimer <= 0) {
      this.roundsFired += this.bullets.fire(this.player.x, this.player.z);
      this.audio.fire();
      this.shotClock = 0.115;
    }
    this.bullets.step(dt);
    if (this.player.isBoat) {
      for (const event of this.waterHazards.step(
        dt, this.player.speed, this.player.hitbox(), (target) => {
          const hit = this.bullets.hitTest(target);
          if (hit) this.roundsHit++;
          return hit;
        }
      )) {
        this.flash(event.x, event.z, 0.57, 0xff6a31);
        this.debris.emit(event.x, event.z, true, 0.7);
        this.audio.explode();
        if (event.kind === 'barrel-impact') this.damagePlayer('EXPLOSIVE BARREL IMPACT');
        else {
          const points = this.scoring.bonus(100);
          if (points) this.announce('WATER HAZARD NEUTRALIZED +100');
        }
      }
    }
    const squadOrders = planSquadTactics(this.traffic, this.player.x,
      this.player.isBoat || splitMedianHalfWidth(this.distance) > 0.1);
    const pincerActive = [...squadOrders.values()].some(order => order.type === 'pincer');
    const retreatActive = [...squadOrders.values()].some(order => order.type === 'retreat');
    const rear = this.traffic.find(car => car.rearPursuer && car.hp > 0);
    const forbidFlank = this.player.isBoat ||
      splitMedianHalfWidth(this.distance + 30) > 0.1 || this.routes.side !== null ||
      this.van.mesh.visible || this.dockingTimer > 0;
    const flank = rear ? planRearFlank(
      this.traffic, rear, this.player.x, this.player.z, forbidFlank,
    ) : null;
    this.ui.tactics(pincerActive, retreatActive,
      rear !== undefined && rear.z > this.player.z - 55,
      rear?.state === 'overtaking', rear?.state === 'screening');
    for (const car of this.traffic) {
      const wasRetreating = car.state === 'retreating';
      const order = car === rear && flank
        ? { type: 'overtake' as const, targetX: flank.targetX }
        : squadOrders.get(car);
      car.step(dt, this.player.speed, this.player.x, order, this.player.z);
      if (!wasRetreating && car.state === 'retreating')
        this.announce('ENEMY SQUAD BROKEN — SURVIVOR DISENGAGING');
      if (splitDangerous(this.distance - car.z, car.x, car.halfWidth)) {
        car.x = escapeFromMedian(car.x, this.distance - car.z, car.halfWidth);
        car.mesh.position.x = car.x;
      }
      if (car.tryFire(this.player.x, this.player.z)) {
        this.enemyShots.spawn(car.x, car.z + car.halfLength, this.player.x, car.role === 'boat');
        this.flash(car.x, car.z + car.halfLength, 0.14, 0xff563b);
      }
    }
    if (this.enemyShots.step(dt, this.player.speed, this.player.hitbox()) > 0) {
      this.damagePlayer('ENFORCER WEAPON IMPACT');
    }
    for (const event of this.air.step(dt, this.player.x, this.player.speed, this.player.hitbox())) {
      if (event.kind === 'bomb-warning') {
        this.announce('WARNING — INCOMING AERIAL BOMB');
        this.audio.warning();
      }
      if (event.kind === 'bomb-detonated') {
        this.flash(event.x, event.z, 0.76, 0xff7134);
        this.audio.explode();
        if (event.playerHit) this.damagePlayer('HELICOPTER BOMB IMPACT');
      }
    }
    for (const impact of this.specials.step(dt, this.player.speed, this.traffic, this.air.helicopters)) {
      if ('aircraft' in impact) {
        this.flash(impact.aircraft.x, impact.aircraft.z, 0.84, 0xffc65d);
        this.audio.explode();
        if (impact.aircraft.hp <= 0) {
          this.debris.emit(impact.aircraft.x, impact.aircraft.z, true, 8.7);
          const points = this.scoring.enemyDestroyed(impact.aircraft instanceof Helicopter &&
            impact.aircraft.profile === 'ace' ? 1250 : 750);
          this.announce(points ? `AIR THREAT NEUTRALIZED +${points}` : 'AIR THREAT NEUTRALIZED — NO POINTS');
        }
      } else if (impact.kind === 'missile') {
        this.flash(impact.vehicle.x, impact.vehicle.z, 0.52, 0xffaa42);
        this.audio.explode();
      } else {
        this.flash(impact.vehicle.x, impact.vehicle.z, impact.kind === 'flame' ? 0.65 : 0.22,
          impact.kind === 'flame' ? 0xff7130 : impact.kind === 'oil' ? 0x47c3ff : 0xd7f7ff);
        if (impact.kind === 'flame') this.audio.explode();
      }
    }

    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const car = this.traffic[i];
      if (car.z > 55 || car.z < -120) {
        if (car.role === 'rear-pursuer' && car.z > 55) {
          const points = this.scoring.bonus(125);
          if (points > 0) this.announce('TAIL SHAKEN — +125');
          else this.announce('TAIL SHAKEN — ESCAPE CONFIRMED');
        }
        this.removeVehicle(i);
        continue;
      }
      while (car.hp > 0 && this.bullets.hitTest(car.hitbox())) {
        car.hp--;
        this.roundsHit++;
        this.audio.impact();
        this.flash(car.x, car.z, 0.22, 0xffd57c);
      }
      if (car.hp <= 0) {
        this.flash(car.x, car.z, 0.55, car.hostile ? 0xff8b34 : 0xff5252);
        this.debris.emit(car.x, car.z, car.hostile);
        if (car.hostile) {
          const awarded = this.scoring.enemyDestroyed(car.role === 'motorcycle' ? 400 : scoreForTarget(true));
          if (awarded) this.announce(`HOSTILE NEUTRALIZED  +${awarded}`);
          else this.announce('NO POINTS — CIVILIAN PENALTY');
        } else {
          this.scoring.civilianDestroyed();
          this.announce('CIVILIAN CASUALTY — NO POINTS FOR 5 SECONDS');
        }
        this.audio.explode();
        this.removeVehicle(i);
        continue;
      }
      if (this.player.invulnerability <= 0 && this.grace <= 0 && intersects(this.player.hitbox(), car.hitbox())) {
        if (!car.hostile) this.scoring.civilianDestroyed();
        this.removeVehicle(i);
        this.damagePlayer('VEHICLE COLLISION');
        if (this.lives <= 0) break;
      }
    }
    if (this.lives <= 0) return;
    const extraLives = this.scoring.checkExtraLives();
    if (extraLives > 0) {
      this.lives = Math.min(5, this.lives + extraLives);
      this.announce('EXTRA INTERCEPTOR AWARDED');
      this.audio.confirm();
    }
    this.stepExplosions(dt);
    this.audio.step(dt, this.player.speed,
      this.traffic.length + this.air.helicopters.length * 2, this.player.isBoat, this.road.biome);
    if (this.toastClock > 0) {
      this.toastClock -= dt;
      if (this.toastClock <= 0) this.ui.message('');
    }
    this.refreshHUD();
  }

  private handleWeapons(missile: boolean, oil: boolean, smoke: boolean): void {
    const attempt = (kind: WeaponKind): void => {
      if (this.specials.use(kind, this.player.x, this.player.isBoat, this.player.z)) {
        this.announce(kind === 'oil' && this.player.isBoat ? 'FLAMING WAKE DEPLOYED' : kind.toUpperCase() + ' DEPLOYED');
        this.audio.confirm();
      } else this.announce('WEAPON UNAVAILABLE — REQUEST RESUPPLY [F]');
    };
    if (missile) attempt('missile');
    if (oil) attempt('oil');
    if (smoke) attempt('smoke');
  }

  private spawnEncounter(): void {
    const route = this.routes.side;
    // Vehicles spawned during the fork are reserved to the chosen corridor.
    // Avoid placing new traffic on the impassable middle median.
    const routeAhead = splitMedianHalfWidth(this.distance + 90) > 1.15 ? route : null;
    const lanes = routeAhead ? [routeAhead === 'left' ? -6.4 : 6.4] : undefined;
    const encounter = planEncounter(this.traffic, this.distance, this.random, route, lanes);
    const squadId = encounter.type === 'pursuit-pair' && !this.player.isBoat
      ? this.nextSquadId++ : null;
    if (squadId !== null) this.announce('SQUAD INBOUND — ATTACKERS COORDINATING');
    for (const spawn of encounter.spawns) {
      const oncoming = Boolean(spawn.oncoming && !this.player.isBoat);
      if (oncoming) this.announce('HEAD-ON HOSTILE APPROACHING — EVADE OR FIRE');
      const variant = this.player.isBoat ? 5 : spawn.variant;
      const colors = spawn.hostile
        ? [0x902d3e, 0x4c182b, 0x9e553e, 0xaf3048]
        : [0x7495a7, 0xc5bda9, 0x647c73, 0x8e9bae];
      const color = colors[Math.floor(this.random() * colors.length)];
      const speed = oncoming ? 23 + this.random() * 7 : variant === 4 ? 16 + this.random() * 9
        : spawn.hostile ? 8 + this.random() * 7 : 12 + this.random() * 7;
      this.traffic.push(new TrafficVehicle(
        this.scene, spawn.x, spawn.z, spawn.hostile, variant, color, speed, squadId, oncoming,
      ));
    }
  }

  private removeVehicle(index: number): void {
    const [vehicle] = this.traffic.splice(index, 1);
    vehicle.dispose(this.scene);
  }

  private damagePlayer(reason: string): void {
    if (this.player.invulnerability > 0 || this.grace > 0 || this.screen !== 'playing' || this.dockingTimer > 0) return;
    this.flash(this.player.x, this.player.z, 0.72, 0xffa342);
    this.debris.emit(this.player.x, this.player.z, true);
    this.audio.explode();
    this.lives--;
    this.scoring.resetCombo();
    if (this.lives <= 0) { this.gameOver(); return; }
    this.player.invulnerability = 2.6;
    this.announce(reason + ' — INTERCEPTOR REDEPLOYED');
  }

  private flash(x: number, z: number, duration: number, color: number): void {
    this.effects.emit(x, z, this.preferences.reducedMotion ? Math.min(duration, 0.22) : duration, color);
  }

  private stepExplosions(dt: number): void {
    this.effects.step(dt);
    this.debris.step(dt, this.player.speed);
  }
  private clearExplosions(): void {
    this.effects.reset();
    this.debris.reset();
  }

  private announce(message: string): void { this.ui.message(message); this.toastClock = 1.6; }

  private refreshHUD(): void {
    this.ui.stats(this.scoring.score, Math.max(this.best, this.scoring.score), this.lives, this.player.speed);
    this.ui.gearStatus(this.player.gear, this.player.isBoat);
    this.ui.armory(this.specials.counts, this.player.isBoat ? 'NO VAN / WATER' : this.van.status, this.scoring.lockoutRemaining);
    this.ui.threats(this.air.helicopters.length, this.enemyShots.activeCount);
    this.ui.combo(this.scoring.comboMultiplier, this.scoring.comboRemaining);
    this.ui.environment(this.road.biome, this.player.isBoat);
    this.ui.route(this.routes.side, this.routes.leftCompletions, this.routes.rightCompletions);
    this.ui.dailyChallenge(this.dailyDate, this.dailyBest);
  }

  private gameOver(): void {
    this.screen = 'gameover';
    this.audio.silence();
    this.best = Math.max(this.best, Math.floor(this.scoring.score));
    try { localStorage.setItem('spyhunter27-best', String(this.best)); } catch { /* optional persistence */ }
    if (this.dailyDate) {
      this.dailyBest = bestDailyScore(this.dailyBest, this.scoring.score);
      try { localStorage.setItem(dailyRecordKey(this.dailyDate), String(this.dailyBest)); }
      catch { /* Storage optional. */ }
    }
    this.ui.result(this.scoring.score, this.best, this.scoring.hostileEliminations,
      this.scoring.civilianCasualties, this.scoring.bestCombo, this.distance,
      this.survivalSeconds, accuracyPercent(this.roundsFired, this.roundsHit));
    this.ui.dailyChallenge(this.dailyDate, this.dailyBest);
    this.ui.route(null, this.routes.leftCompletions, this.routes.rightCompletions);
    this.ui.show(this.screen);
  }

  private render(): void {
    if (import.meta.env.DEV) {
      // Minimal observable state for deterministic Playwright composition and
      // moving-hitbox coverage. No debug DOM updates ship in production.
      this.renderer.domElement.dataset.playerZ = this.player.z.toFixed(2);
      this.renderer.domElement.dataset.headOn = this.traffic.some(car => car.oncoming) ? '1' : '0';
      this.renderer.domElement.dataset.rearPursuit = this.traffic.some(car => car.rearPursuer) ? '1' : '0';
      this.renderer.domElement.dataset.rearState = this.traffic.find(car => car.rearPursuer)?.state ?? 'none';
    }
    const center = (z: number): number => this.road.centerAt(z);
    // Road tiles scroll around a stable reference Z. The interceptor itself
    // moves through that curved corridor as acceleration/braking changes Z.
    if (this.dockingTimer === 0) this.player.mesh.position.x = this.player.x + center(this.player.z);
    // Simulation runs in a stable lane-relative coordinate system. Only the
    // presentation layer bends positions along the generated centerline.
    for (const car of this.traffic) car.mesh.position.x = car.x + center(car.z);
    this.bullets.renderAt(center);
    this.specials.renderAt(center);
    this.air.renderAt(center);
    this.enemyShots.renderAt(center);
    this.effects.renderAt(center);
    this.debris.renderAt(center);
    this.wake.renderAt(center);
    this.waterHazards.renderAt(center);
    this.streaks.renderAt(center);
    this.headlights.renderAt(center, this.player.x, this.player.z);
    this.skidTrails.renderAt(center);
    this.van.mesh.position.x = 6.4 + center(this.van.mesh.position.z);
    if (this.bloomPass) {
      const target = highlightBloom(this.road.biome);
      const blend = 0.04;
      this.bloomPass.strength += (target.strength - this.bloomPass.strength) * blend;
      this.bloomPass.radius += (target.radius - this.bloomPass.radius) * blend;
      this.bloomPass.threshold += (target.threshold - this.bloomPass.threshold) * blend;
    }
    this.sky.follow(this.camera);
    if (this.filmic) this.filmic.uniforms.uTime.value = performance.now() * 0.001;
    if (this.preferences.quality === 'high' && this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
    const now = performance.now();
    if (this.renderTime > 0) {
      const instantaneous = 1000 / Math.max(1, now - this.renderTime);
      this.averageFps = this.averageFps * 0.92 + instantaneous * 0.08;
    }
    this.renderTime = now;
    this.ui.diagnostics(this.averageFps, this.renderer.info.render.calls, this.traffic.length);
  }
}
