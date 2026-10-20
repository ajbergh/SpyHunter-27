import * as THREE from 'three';
import type { Biome } from '../world/WorldPlan';
import type { Quality } from '../gameplay/Settings';

const TOTAL = 320;

/** Single-draw-call GPU particles for snowfall, desert dust, city rain, and river mist. */
export class Weather {
  private readonly positions = new Float32Array(TOTAL * 3);
  readonly geometry = new THREE.BufferGeometry();
  readonly material = new THREE.PointsMaterial({
    size: 0.26, sizeAttenuation: true, color: 0xe9f5fc,
    transparent: true, opacity: 0.6, depthWrite: false,
  });
  readonly points: THREE.Points;
  private quality: Quality = 'medium';
  private biome: Biome = 'forest';
  private tick = 0;

  constructor(scene: THREE.Scene) {
    for (let i = 0; i < TOTAL; i++) this.resetParticle(i, i * 19);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);
    this.setQuality('medium');
    this.setBiome('forest');
  }

  setQuality(quality: Quality): void {
    this.quality = quality;
    this.geometry.setDrawRange(0, quality === 'low' ? 55 : quality === 'medium' ? 160 : TOTAL);
  }

  setBiome(biome: Biome): void {
    this.biome = biome;
    const palette: Record<Biome, number> = {
      forest: 0x94abb6, desert: 0xefb37b, snow: 0xf6fdff, city: 0x8ddef3, water: 0xc2f5fd,
    };
    this.material.color.setHex(palette[biome]);
    this.material.opacity = biome === 'forest' ? 0.14 : biome === 'city' ? 0.64 : 0.54;
    this.material.size = biome === 'city' ? 0.16 : biome === 'snow' ? 0.34 : 0.22;
    this.points.visible = biome !== 'forest';
  }

  step(dt: number, speed: number, biome: Biome): void {
    if (biome !== this.biome) this.setBiome(biome);
    if (!this.points.visible) return;
    this.tick += dt;
    const fall = biome === 'snow' ? 8.5 : biome === 'desert' ? 1.3 : biome === 'city' ? 28 : 6;
    const drift = biome === 'desert' ? 4 : 1;
    for (let i = 0; i < this.geometry.drawRange.count; i++) {
      const k = i * 3;
      this.positions[k] += drift * dt;
      this.positions[k + 1] -= fall * dt;
      this.positions[k + 2] += speed * 0.22 * dt;
      if (this.positions[k + 1] < 0 || this.positions[k + 2] > 64 || this.positions[k] > 24) {
        this.resetParticle(i, i * 31 + Math.floor(this.tick * 3));
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
  }

  get active(): number { return this.points.visible ? this.geometry.drawRange.count : 0; }

  private resetParticle(i: number, seed: number): void {
    // Integer hash keeps initialization and recycling deterministic.
    const hash = (x: number): number => {
      let v = x | 0;
      v = Math.imul(v ^ (v >>> 16), 0x45d9f3b);
      v = Math.imul(v ^ (v >>> 16), 0x45d9f3b);
      return ((v ^ (v >>> 16)) >>> 0) / 0xffffffff;
    };
    const k = i * 3;
    this.positions[k] = (hash(seed + 1) - .5) * 44;
    this.positions[k + 1] = 2 + hash(seed + 7) * 21;
    this.positions[k + 2] = -84 + hash(seed + 19) * 145;
  }
}
