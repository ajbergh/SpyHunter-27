import * as THREE from 'three';
import type { Quality } from '../gameplay/Settings';

const STREAK_COUNT = 72;

export function streakOpacity(speed: number): number {
  return Math.min(0.47, Math.max(0, (speed - 24) / 65));
}

/** Lightweight 1-draw-call cinematic edge motion streaks above cruising speed. */
export class SpeedStreaks {
  readonly lines: THREE.LineSegments;
  private readonly positions = new Float32Array(STREAK_COUNT * 2 * 3);
  private readonly geometry = new THREE.BufferGeometry();
  private readonly material = new THREE.LineBasicMaterial({
    color: 0x9cc8dc, transparent: true, opacity: 0,
    depthWrite: false, fog: true,
  });
  private distance = 0;
  private quality: Quality = 'medium';
  private reducedMotion = false;

  constructor(scene: THREE.Scene) {
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3)
      .setUsage(THREE.DynamicDrawUsage));
    this.lines = new THREE.LineSegments(this.geometry, this.material);
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 2;
    scene.add(this.lines);
    this.setPreferences('medium', false);
  }

  setPreferences(quality: Quality, reducedMotion: boolean): void {
    this.quality = quality;
    this.reducedMotion = reducedMotion;
    this.lines.visible = quality !== 'low' && !reducedMotion && this.material.opacity > 0;
  }

  step(dt: number, speed: number): void {
    this.distance = (this.distance + speed * Math.max(0, dt)) % 165;
    this.material.opacity = streakOpacity(speed);
    // Fully transparent streaks still cost geometry updates and a draw call
    // if left visible. Skip them completely until their threshold is crossed.
    this.lines.visible = this.quality !== 'low' &&
      !this.reducedMotion && this.material.opacity > 0;
  }

  renderAt(center: (z: number) => number): void {
    if (!this.lines.visible) return;
    const count = this.quality === 'high' ? STREAK_COUNT : STREAK_COUNT / 2;
    this.geometry.setDrawRange(0, count * 2);
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      const z = ((row * 4.4 + this.distance) % 160) - 102;
      const x = side * (12.4 + row % 4 * 2.6);
      const n = i * 6;
      this.positions[n] = x + center(z);
      this.positions[n + 1] = 0.06;
      this.positions[n + 2] = z;
      this.positions[n + 3] = x + center(z + 1.9);
      this.positions[n + 4] = 0.06;
      this.positions[n + 5] = z + 1.9;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }

  reset(): void { this.distance = 0; }
}
