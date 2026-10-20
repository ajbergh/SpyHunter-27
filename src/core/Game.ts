import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GameLoop } from './GameLoop';
import { Input } from './Input';
import { MAX_LIVES, PLAYER_Z, approach, distancePoints, intersects, scoreForTarget, spawnInterval } from './logic';
import { Road } from '../world/Road';
import { BoatWake } from '../world/BoatWake';
import { WaterHazards } from '../world/WaterHazards';
import { Weather } from '../rendering/Weather';
import { Player } from '../entities/Player';
import { TrafficVehicle } from '../entities/Traffic';
import { Projectiles } from '../combat/Projectiles';
import { SpecialWeapons, type WeaponKind } from '../combat/SpecialWeapons';
import { AirThreats } from '../combat/AirThreats';
import { EnemyProjectiles } from '../combat/EnemyProjectiles';
import { Interface, type Screen } from '../ui/Interface';
import { AudioManager } from '../audio/Audio';
import { Scoring } from '../gameplay/Scoring';
import { GAME_MODES, type GameMode } from '../gameplay/GameModes';
import { loadPreferences, type GamePreferences } from '../gameplay/Settings';
import { WeaponsVan } from '../gameplay/WeaponsVan';
import { planEncounter } from '../gameplay/EncounterDirector';
import { ExplosionEffects } from '../combat/ExplosionEffects';
import { boundaryStrike, gradeBoathouseEntry } from '../gameplay/Boundary';
import { biomeAt } from '../world/WorldPlan';

export class Game {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-20, 20, 35, -35, 0.1, 350);
  private readonly renderer: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
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
  private readonly player: Player;
  private readonly bullets: Projectiles;
  private readonly specials: SpecialWeapons;
  private readonly air: AirThreats;
  private readonly enemyShots: EnemyProjectiles;
  private readonly van: WeaponsVan;
  private readonly scoring = new Scoring();
  private readonly loop: GameLoop;
  private readonly traffic: TrafficVehicle[] = [];
  private readonly effects: ExplosionEffects;
  private screen: Screen = 'menu';
  private mode: GameMode = 'classic';
  private best = 0;
  private lives = MAX_LIVES;
  private distance = 0;
  private spawnClock = 0;
  private airSpawnClock = 9;
  private shotClock = 0;
  private grace = 0;
  private dockingTimer = 0;
  private dockingEntryX = 0;
  private boundaryCooldown = 0;
  private gateWarned = false;
  private toastClock = 0;

  constructor(host: HTMLElement) {
    this.ui = new Interface(host);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.26;
    this.ui.stage.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color(0x091923);
    this.scene.fog = new THREE.FogExp2(0x091923, 0.006);
    this.camera.position.set(0, 66, 38);
    this.camera.lookAt(0, 0, -19);
    const sun = new THREE.DirectionalLight(0xb5e8ff, 2.25);
    sun.position.set(-18, 47, -28);
    this.scene.add(sun, new THREE.HemisphereLight(0x6fa8c8, 0x182526, 2.2));
    this.road = new Road(this.scene);
    this.wake = new BoatWake(this.scene);
    this.waterHazards = new WaterHazards(this.scene);
    this.weather = new Weather(this.scene);
    this.player = new Player(this.scene);
    this.bullets = new Projectiles(this.scene);
    this.specials = new SpecialWeapons(this.scene);
    this.air = new AirThreats(this.scene);
    this.enemyShots = new EnemyProjectiles(this.scene);
    this.effects = new ExplosionEffects(this.scene);
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
    this.loop.start();
  }

  private resize(): void {
    const width = Math.max(1, this.ui.stage.clientWidth);
    const height = Math.max(1, this.ui.stage.clientHeight);
    this.renderer.setSize(width, height, false);
    this.composer?.setSize(width, height);
    const halfHeight = 36;
    const halfWidth = halfHeight * width / height;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
  }

  private configure(settings: GamePreferences): void {
    this.preferences = settings;
    this.audio.configure(settings.musicVolume, settings.effectsVolume);
    this.input.setBindings(settings.bindings);
    this.weather.setQuality(settings.quality);
    const ratio = settings.quality === 'low' ? 1 : settings.quality === 'high' ? 2 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, ratio));
    if (settings.quality === 'high' && !this.composer) {
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.38, 0.84));
      this.composer.addPass(new OutputPass());
    }
    this.resize();
  }

  private start(mode: GameMode = this.mode): void {
    this.mode = mode;
    void this.audio.unlock();
    for (const car of this.traffic) car.dispose(this.scene);
    this.traffic.length = 0;
    this.clearExplosions();
    this.bullets.reset();
    this.specials.reset();
    this.air.reset();
    this.enemyShots.reset();
    this.van.reset();
    this.road.reset();
    this.wake.reset();
    this.waterHazards.reset();
    this.player.reset();
    this.scoring.reset();
    this.distance = 0;
    if (import.meta.env.DEV) {
      const seek = Number(new URLSearchParams(window.location.search).get('testDistance') ?? 0);
      if (Number.isFinite(seek) && seek >= 0 && seek <= 100000 && seek > 0) {
        this.road.seek(seek);
        this.distance = seek;
        this.player.setBoat(this.road.biome === 'water');
      }
    }
    this.lives = GAME_MODES[mode].lives;
    this.grace = mode === 'modern' ? 5 : 3;
    this.dockingTimer = 0;
    this.dockingEntryX = 0;
    this.boundaryCooldown = 0;
    this.gateWarned = false;
    this.spawnClock = 0.8;
    this.airSpawnClock = 9;
    this.shotClock = 0;
    this.toastClock = 0;
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

    if (this.dockingTimer > 0) {
      this.dockingTimer = Math.max(0, this.dockingTimer - dt);
      this.van.step(dt, this.player.speed, this.player.x);
      const progress = 1 - this.dockingTimer / 1.3;
      // Move the visible car up the deployed ramp and into the support van.
      this.player.mesh.position.x = this.dockingEntryX + (6.4 - this.dockingEntryX) * progress;
      this.player.mesh.position.z = PLAYER_Z - progress * 7;
      this.player.mesh.position.y = 0.12 + Math.sin(progress * Math.PI) * 0.68;
      this.player.mesh.scale.setScalar(1 - progress * 0.13);
      this.camera.position.x = approach(this.camera.position.x, 3.4, 5, dt);
      if (this.dockingTimer === 0) {
        this.player.mesh.position.set(this.player.x, 0.12, PLAYER_Z);
        this.player.mesh.scale.setScalar(1);
        this.player.invulnerability = 3.4;
        this.grace = 2.2;
        this.enemyShots.reset();
        // The deployment zone must be clear before control is returned.
        for (let i = this.traffic.length - 1; i >= 0; i--) {
          const car = this.traffic[i];
          if (Math.abs(car.z - PLAYER_Z) < 13 && Math.abs(car.x - this.player.x) < 3.4) this.removeVehicle(i);
        }
        this.announce('INTERCEPTOR REDEPLOYED — WEAPONS ONLINE');
      }
      this.stepExplosions(dt);
      this.refreshHUD();
      return;
    }

    this.player.step(dt, controls, this.road.biome, GAME_MODES[this.mode].speedScale);
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
    this.wake.step(dt, this.player.speed, this.player.x, this.player.isBoat);
    this.weather.step(dt, this.player.speed, this.road.biome);
    this.distance += this.player.speed * dt;
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
        this.air.spawn((Math.random() - 0.5) * 9);
        this.announce('AIR THREAT DETECTED — MISSILES RECOMMENDED');
      }
      this.airSpawnClock = 17 + Math.random() * 8;
    }
    this.grace = Math.max(0, this.grace - dt);
    this.spawnClock -= dt;
    if (this.spawnClock <= 0) {
      this.spawnEncounter();
      this.spawnClock += spawnInterval(this.distance) * GAME_MODES[this.mode].spawnScale * (0.8 + Math.random() * 0.4);
    }

    this.handleWeapons(controls.missilePressed, controls.oilPressed, controls.smokePressed);
    if (controls.vanPressed) {
      if (!this.player.isBoat && this.van.call()) this.announce('SUPPORT VAN INBOUND — ALIGN WITH REAR RAMP');
      else this.announce('SUPPORT VAN NOT READY');
    }
    const vanEvent = this.player.isBoat ? null : this.van.step(dt, this.player.speed, this.player.x);
    if (vanEvent === 'docked') {
      this.specials.refill();
      this.dockingEntryX = this.player.x;
      const resupplyBonus = this.scoring.bonus(500);
      this.player.invulnerability = 2.5;
      this.dockingTimer = 1.3;
      this.announce(resupplyBonus ? 'DOCKING SUCCESS — WEAPONS REPLENISHED  +500'
        : 'WEAPONS REPLENISHED — NO POINTS DURING CIVILIAN PENALTY');
      this.audio.confirm();
    } else if (vanEvent === 'missed') {
      this.announce('SUPPORT VAN MISSED');
    }

    this.shotClock -= dt;
    if (controls.fire && this.shotClock <= 0 && this.dockingTimer <= 0) {
      this.bullets.fire(this.player.x, PLAYER_Z);
      this.audio.fire();
      this.shotClock = 0.115;
    }
    this.bullets.step(dt);
    if (this.player.isBoat) {
      for (const event of this.waterHazards.step(
        dt, this.player.speed, this.player.hitbox(), (target) => this.bullets.hitTest(target)
      )) {
        this.flash(event.x, event.z, 0.57, 0xff6a31);
        this.audio.explode();
        if (event.kind === 'barrel-impact') this.damagePlayer('EXPLOSIVE BARREL IMPACT');
        else {
          const points = this.scoring.bonus(100);
          if (points) this.announce('WATER HAZARD NEUTRALIZED +100');
        }
      }
    }
    for (const car of this.traffic) {
      car.step(dt, this.player.speed, this.player.x);
      if (car.tryFire(this.player.x)) {
        this.enemyShots.spawn(car.x, car.z + car.halfLength, this.player.x, car.role === 'boat');
        this.flash(car.x, car.z + car.halfLength, 0.14, 0xff563b);
      }
    }
    if (this.enemyShots.step(dt, this.player.speed, this.player.hitbox()) > 0) {
      this.damagePlayer('ENFORCER WEAPON IMPACT');
    }
    for (const event of this.air.step(dt, this.player.x, this.player.speed, this.player.hitbox())) {
      if (event.kind === 'bomb-warning') this.announce('WARNING — INCOMING AERIAL BOMB');
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
          const points = this.scoring.enemyDestroyed(750);
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
      if (car.z > 55) { this.removeVehicle(i); continue; }
      while (car.hp > 0 && this.bullets.hitTest(car.hitbox())) {
        car.hp--;
        this.audio.impact();
        this.flash(car.x, car.z, 0.22, 0xffd57c);
      }
      if (car.hp <= 0) {
        this.flash(car.x, car.z, 0.55, car.hostile ? 0xff8b34 : 0xff5252);
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
    const extraLives = this.scoring.checkExtraLives();
    if (extraLives > 0) {
      this.lives = Math.min(5, this.lives + extraLives);
      this.announce('EXTRA INTERCEPTOR AWARDED');
      this.audio.confirm();
    }
    this.stepExplosions(dt);
    this.audio.step(dt, this.player.speed, this.traffic.length + this.air.helicopters.length * 2, this.player.isBoat);
    if (this.toastClock > 0) {
      this.toastClock -= dt;
      if (this.toastClock <= 0) this.ui.message('');
    }
    this.refreshHUD();
  }

  private handleWeapons(missile: boolean, oil: boolean, smoke: boolean): void {
    const attempt = (kind: WeaponKind): void => {
      if (this.specials.use(kind, this.player.x, this.player.isBoat)) {
        this.announce(kind === 'oil' && this.player.isBoat ? 'FLAMING WAKE DEPLOYED' : kind.toUpperCase() + ' DEPLOYED');
        this.audio.confirm();
      } else this.announce('WEAPON UNAVAILABLE — REQUEST RESUPPLY [F]');
    };
    if (missile) attempt('missile');
    if (oil) attempt('oil');
    if (smoke) attempt('smoke');
  }

  private spawnEncounter(): void {
    const encounter = planEncounter(this.traffic, this.distance, Math.random);
    if (encounter.type === 'pursuit-pair') this.announce('COORDINATED PURSUIT — TWO HOSTILES');
    for (const spawn of encounter.spawns) {
      const variant = this.player.isBoat ? 5 : spawn.variant;
      const colors = spawn.hostile
        ? [0x902d3e, 0x4c182b, 0x9e553e, 0xaf3048]
        : [0x7495a7, 0xc5bda9, 0x647c73, 0x8e9bae];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const speed = variant === 4 ? 16 + Math.random() * 9
        : spawn.hostile ? 8 + Math.random() * 7 : 12 + Math.random() * 7;
      this.traffic.push(new TrafficVehicle(
        this.scene, spawn.x, spawn.z, spawn.hostile, variant, color, speed,
      ));
    }
  }

  private removeVehicle(index: number): void {
    const [vehicle] = this.traffic.splice(index, 1);
    vehicle.dispose(this.scene);
  }

  private damagePlayer(reason: string): void {
    if (this.player.invulnerability > 0 || this.grace > 0 || this.screen !== 'playing' || this.dockingTimer > 0) return;
    this.flash(this.player.x, PLAYER_Z, 0.72, 0xffa342);
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

  private stepExplosions(dt: number): void { this.effects.step(dt); }
  private clearExplosions(): void { this.effects.reset(); }

  private announce(message: string): void { this.ui.message(message); this.toastClock = 1.6; }

  private refreshHUD(): void {
    this.ui.stats(this.scoring.score, Math.max(this.best, this.scoring.score), this.lives, this.player.speed);
    this.ui.armory(this.specials.counts, this.player.isBoat ? 'NO VAN / WATER' : this.van.status, this.scoring.lockoutRemaining);
    this.ui.threats(this.air.helicopters.length, this.enemyShots.activeCount);
    this.ui.combo(this.scoring.comboMultiplier, this.scoring.comboRemaining);
    this.ui.environment(this.road.biome, this.player.isBoat);
  }

  private gameOver(): void {
    this.screen = 'gameover';
    this.audio.silence();
    this.best = Math.max(this.best, Math.floor(this.scoring.score));
    try { localStorage.setItem('spyhunter27-best', String(this.best)); } catch { /* optional persistence */ }
    this.ui.result(this.scoring.score, this.best, this.scoring.hostileEliminations,
      this.scoring.civilianCasualties, this.scoring.bestCombo);
    this.ui.show(this.screen);
  }

  private render(): void {
    const center = (z: number): number => this.road.centerAt(z);
    // Simulation runs in a stable lane-relative coordinate system. Only the
    // presentation layer bends positions along the generated centerline.
    for (const car of this.traffic) car.mesh.position.x = car.x + center(car.z);
    this.bullets.renderAt(center);
    this.specials.renderAt(center);
    this.air.renderAt(center);
    this.enemyShots.renderAt(center);
    this.effects.renderAt(center);
    this.wake.renderAt(center);
    this.waterHazards.renderAt(center);
    this.van.mesh.position.x = 6.4 + center(this.van.mesh.position.z);
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
