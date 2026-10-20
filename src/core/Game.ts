import * as THREE from 'three';
import { GameLoop } from './GameLoop';
import { Input } from './Input';
import { MAX_LIVES, PLAYER_Z, distancePoints, intersects, scoreForTarget, spawnInterval } from './logic';
import { Road } from '../world/Road';
import { Player } from '../entities/Player';
import { TrafficVehicle } from '../entities/Traffic';
import { Projectiles } from '../combat/Projectiles';
import { Interface, type Screen } from '../ui/Interface';
import { AudioManager } from '../audio/Audio';

type Explosion = { mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>; life: number; total: number };

export class Game {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-20, 20, 35, -35, 0.1, 350);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly ui: Interface;
  private readonly input = new Input();
  private readonly audio = new AudioManager();
  private readonly road: Road;
  private readonly player: Player;
  private readonly bullets: Projectiles;
  private readonly loop: GameLoop;
  private readonly traffic: TrafficVehicle[] = [];
  private readonly explosions: Explosion[] = [];
  private readonly explosionGeometry = new THREE.SphereGeometry(1, 12, 8);
  private screen: Screen = 'menu';
  private score = 0;
  private best = 0;
  private lives = MAX_LIVES;
  private distance = 0;
  private spawnClock = 0;
  private shotClock = 0;
  private grace = 0;
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
    this.player = new Player(this.scene);
    this.bullets = new Projectiles(this.scene);
    try { this.best = Number(localStorage.getItem('spyhunter27-best') || 0) || 0; } catch { /* private browsing may deny storage */ }
    this.ui.stats(0, this.best, this.lives, this.player.speed);
    this.ui.onStart = () => this.start();
    this.ui.onResume = () => this.resume();
    this.loop = new GameLoop((dt) => this.update(dt), () => this.render());
    new ResizeObserver(() => this.resize()).observe(this.ui.stage);
    window.addEventListener('blur', () => { if (this.screen === 'playing') this.pause(); });
    this.resize();
    this.loop.start();
  }

  private resize(): void {
    const width = Math.max(1, this.ui.stage.clientWidth);
    const height = Math.max(1, this.ui.stage.clientHeight);
    this.renderer.setSize(width, height, false);
    const halfHeight = 36;
    const halfWidth = halfHeight * width / height;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
  }

  private start(): void {
    this.audio.unlock();
    for (const car of this.traffic) car.dispose(this.scene);
    this.traffic.length = 0;
    this.clearExplosions();
    this.bullets.reset();
    this.road.reset();
    this.player.reset();
    this.score = 0;
    this.distance = 0;
    this.lives = MAX_LIVES;
    this.grace = 3;
    this.spawnClock = 0.8;
    this.shotClock = 0;
    this.toastClock = 0;
    this.ui.message('');
    this.screen = 'playing';
    this.ui.show(this.screen);
    this.ui.stats(this.score, this.best, this.lives, this.player.speed);
    this.audio.confirm();
  }

  private pause(): void {
    this.screen = 'paused';
    this.ui.show(this.screen);
  }

  private resume(): void {
    if (this.screen !== 'paused') return;
    this.screen = 'playing';
    this.ui.show(this.screen);
    this.audio.unlock();
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

    this.player.step(dt, controls);
    this.road.step(this.player.speed, dt);
    this.distance += this.player.speed * dt;
    this.score += distancePoints(this.player.speed, dt);
    this.grace = Math.max(0, this.grace - dt);
    this.spawnClock -= dt;
    if (this.spawnClock <= 0) {
      this.spawnVehicle();
      this.spawnClock += spawnInterval(this.distance) * (0.75 + Math.random() * 0.5);
    }

    this.shotClock -= dt;
    if (controls.fire && this.shotClock <= 0) {
      this.bullets.fire(this.player.x, PLAYER_Z);
      this.audio.fire();
      this.shotClock = 0.115;
    }
    this.bullets.step(dt);
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const car = this.traffic[i];
      car.step(dt, this.player.speed, this.player.x);
      if (car.z > 55) { this.removeVehicle(i); continue; }
      while (car.hp > 0 && this.bullets.hitTest(car.hitbox())) {
        car.hp--;
        this.audio.impact();
        this.flash(car.x, car.z, 0.26, 0xffd57c);
      }
      if (car.hp <= 0) {
        this.flash(car.x, car.z, 0.52, car.hostile ? 0xff8b34 : 0xff5252);
        if (car.hostile) {
          this.score += scoreForTarget(true);
          this.announce('HOSTILE NEUTRALIZED  +250');
        } else this.announce('CIVILIAN VEHICLE HIT');
        this.audio.explode();
        this.removeVehicle(i);
        continue;
      }
      if (this.player.invulnerability <= 0 && this.grace <= 0 && intersects(this.player.hitbox(), car.hitbox())) {
        this.flash(this.player.x, PLAYER_Z, 0.72, 0xffa342);
        this.audio.explode();
        this.removeVehicle(i);
        this.lives--;
        if (this.lives <= 0) { this.gameOver(); break; }
        this.player.invulnerability = 2.6;
        this.announce('INTERCEPTOR DAMAGED  //  REDEPLOYED');
      }
    }
    this.stepExplosions(dt);
    if (this.toastClock > 0) {
      this.toastClock -= dt;
      if (this.toastClock <= 0) this.ui.message('');
    }
    this.ui.stats(this.score, Math.max(this.best, this.score), this.lives, this.player.speed);
  }

  private spawnVehicle(): void {
    const hostile = Math.random() < 0.61;
    const variant = Math.random() < 0.16 ? 2 : Math.random() < 0.28 ? 1 : 0;
    const lanes = [-6.4, 0, 6.4];
    const x = lanes[Math.floor(Math.random() * lanes.length)];
    const colors = hostile ? [0x902d3e, 0x4c182b, 0x9e553e] : [0x7495a7, 0xc5bda9, 0x647c73, 0x8e9bae];
    const color = colors[Math.floor(Math.random() * colors.length)];
    this.traffic.push(new TrafficVehicle(this.scene, x, -90, hostile, variant, color, hostile ? 8 + Math.random() * 7 : 12 + Math.random() * 7));
  }

  private removeVehicle(index: number): void {
    const [vehicle] = this.traffic.splice(index, 1);
    vehicle.dispose(this.scene);
  }

  private flash(x: number, z: number, duration: number, color: number): void {
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.84, depthWrite: false });
    const mesh = new THREE.Mesh(this.explosionGeometry, material);
    mesh.position.set(x, 1.05, z);
    this.scene.add(mesh);
    this.explosions.push({ mesh, life: duration, total: duration });
  }

  private stepExplosions(dt: number): void {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const effect = this.explosions[i];
      effect.life -= dt;
      const progress = 1 - Math.max(0, effect.life) / effect.total;
      effect.mesh.scale.setScalar(0.3 + progress * 2.3);
      effect.mesh.material.opacity = (1 - progress) * 0.84;
      if (effect.life <= 0) {
        this.scene.remove(effect.mesh);
        effect.mesh.material.dispose();
        this.explosions.splice(i, 1);
      }
    }
  }

  private clearExplosions(): void {
    for (const effect of this.explosions) { this.scene.remove(effect.mesh); effect.mesh.material.dispose(); }
    this.explosions.length = 0;
  }

  private announce(message: string): void { this.ui.message(message); this.toastClock = 1.6; }

  private gameOver(): void {
    this.screen = 'gameover';
    this.best = Math.max(this.best, Math.floor(this.score));
    try { localStorage.setItem('spyhunter27-best', String(this.best)); } catch { /* optional persistence */ }
    this.ui.result(this.score, this.best);
    this.ui.show(this.screen);
  }

  private render(): void { this.renderer.render(this.scene, this.camera); }
}
