import * as THREE from 'three';
import type { Biome } from '../world/WorldPlan';
import type { Quality } from '../gameplay/Settings';

export interface VisualProfile {
  readonly sky: number;
  readonly fog: number;
  readonly fogDensity: number;
  readonly key: number;
  readonly fill: number;
  readonly ground: number;
  readonly rim: number;
  readonly keyPower: number;
  readonly hemiPower: number;
  readonly exposure: number;
}

/** Art-directed grades retain legible silhouettes and consistent collision readability. */
export const VISUAL_PROFILES: Record<Biome, VisualProfile> = {
  forest: {
    sky: 0x142b2e, fog: 0x233f3b, fogDensity: 0.0055,
    key: 0xffd6a3, fill: 0x95cdd6, ground: 0x1b2522, rim: 0x6dcabf,
    keyPower: 2.65, hemiPower: 1.55, exposure: 1.22,
  },
  desert: {
    sky: 0x563428, fog: 0xaa7450, fogDensity: 0.0062,
    key: 0xffe2aa, fill: 0xffbc93, ground: 0x433125, rim: 0xff9e63,
    keyPower: 3.0, hemiPower: 1.8, exposure: 1.36,
  },
  snow: {
    sky: 0x6888a1, fog: 0xb9d2e4, fogDensity: 0.0048,
    key: 0xe3f5ff, fill: 0xb3d4f8, ground: 0x52687d, rim: 0xb8f7ff,
    keyPower: 2.6, hemiPower: 2.0, exposure: 1.12,
  },
  city: {
    sky: 0x100f30, fog: 0x2e1d51, fogDensity: 0.0075,
    key: 0x96bcff, fill: 0x6d91cf, ground: 0x16112e, rim: 0xff4da4,
    keyPower: 1.95, hemiPower: 1.55, exposure: 1.34,
  },
  water: {
    sky: 0x164256, fog: 0x417c8c, fogDensity: 0.005,
    key: 0xd8f8f1, fill: 0x8bc6d9, ground: 0x16313d, rim: 0x69e0e9,
    keyPower: 2.75, hemiPower: 1.7, exposure: 1.2,
  },
};

export function shadowResolution(quality: Quality): number {
  return quality === 'high' ? 2048 : quality === 'medium' ? 512 : 0;
}

/** The graphics director owns the scene lights, fog and cinematic shadow quality. */
export class VisualDirector {
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly rim: THREE.DirectionalLight;
  private readonly fog: THREE.FogExp2;
  private biome: Biome = 'forest';
  private readonly tint = new THREE.Color();
  private currentExposure = VISUAL_PROFILES.forest.exposure;

  constructor(private readonly scene: THREE.Scene, private readonly renderer: THREE.WebGLRenderer) {
    const profile = VISUAL_PROFILES.forest;
    this.sun = new THREE.DirectionalLight(profile.key, profile.keyPower);
    this.sun.position.set(-20, 50, -32);
    this.sun.target.position.set(0, 0, -20);
    this.sun.castShadow = true;
    this.sun.shadow.bias = -0.00025;
    this.sun.shadow.normalBias = 0.045;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 140;
    this.sun.shadow.camera.left = -35;
    this.sun.shadow.camera.right = 35;
    this.sun.shadow.camera.top = 48;
    this.sun.shadow.camera.bottom = -65;
    this.sun.shadow.camera.updateProjectionMatrix();
    this.sun.shadow.radius = 2.5;
    this.hemi = new THREE.HemisphereLight(profile.fill, profile.ground, profile.hemiPower);
    this.rim = new THREE.DirectionalLight(profile.rim, 0.85);
    this.rim.position.set(20, 16, 13);
    this.fog = new THREE.FogExp2(profile.fog, profile.fogDensity);
    this.scene.background = new THREE.Color(profile.sky);
    this.scene.fog = this.fog;
    this.scene.add(this.sun, this.sun.target, this.hemi, this.rim);
  }

  configure(quality: Quality): void {
    const resolution = shadowResolution(quality);
    const enabled = resolution > 0;
    this.sun.castShadow = enabled;
    this.renderer.shadowMap.enabled = enabled;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (enabled && this.sun.shadow.mapSize.x !== resolution) {
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
      this.sun.shadow.mapSize.set(resolution, resolution);
      this.sun.shadow.needsUpdate = true;
    }
    this.sun.shadow.autoUpdate = enabled;
  }

  step(dt: number, biome: Biome, time: number, reducedMotion = false): void {
    const target = VISUAL_PROFILES[biome];
    this.biome = biome;
    const blend = Math.min(1, Math.max(0, dt) * 1.7);
    this.sun.color.lerp(this.tint.setHex(target.key), blend);
    this.hemi.color.lerp(this.tint.setHex(target.fill), blend);
    this.hemi.groundColor.lerp(this.tint.setHex(target.ground), blend);
    this.rim.color.lerp(this.tint.setHex(target.rim), blend);
    (this.scene.background as THREE.Color).lerp(this.tint.setHex(target.sky), blend);
    this.fog.color.lerp(this.tint.setHex(target.fog), blend);
    this.fog.density += (target.fogDensity - this.fog.density) * blend;
    this.sun.intensity += (target.keyPower - this.sun.intensity) * blend;
    this.hemi.intensity += (target.hemiPower - this.hemi.intensity) * blend;
    const pulse = biome === 'city' && !reducedMotion ? Math.sin(time * 1.3) * 0.16 : 0;
    this.rim.intensity += (0.85 + pulse - this.rim.intensity) * blend;
    this.currentExposure += (target.exposure - this.currentExposure) * blend;
    this.renderer.toneMappingExposure = this.currentExposure;
  }

  get activeBiome(): Biome { return this.biome; }
}
