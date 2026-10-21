import * as THREE from 'three';
import type { Biome } from '../world/WorldPlan';

export interface SkyPalette {
  readonly zenith: number;
  readonly horizon: number;
  readonly groundHaze: number;
  readonly sun: number;
  readonly sunlight: number;
}

export const SKY_PALETTES: Readonly<Record<Biome, SkyPalette>> = {
  forest: { zenith: 0x102d43, horizon: 0x6b9b8e, groundHaze: 0x9c9b77,
    sun: 0xffe4b5, sunlight: 0.45 },
  desert: { zenith: 0x304a79, horizon: 0xeaa678, groundHaze: 0xfdca8a,
    sun: 0xffdfac, sunlight: 0.85 },
  snow: { zenith: 0x356489, horizon: 0xc1d8e5, groundHaze: 0xe1e9e9,
    sun: 0xe4f7ff, sunlight: 0.47 },
  city: { zenith: 0x090e26, horizon: 0x423272, groundHaze: 0x744483,
    sun: 0xbc71e2, sunlight: 0.08 },
  water: { zenith: 0x115276, horizon: 0x83b8bb, groundHaze: 0xcee2c6,
    sun: 0xfff1b9, sunlight: 0.62 },
};

/** One sky draw call with stable camera-relative geometry and no remote HDRI. */
export class SkyAtmosphere {
  readonly mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private readonly work = new THREE.Color();

  constructor(scene: THREE.Scene) {
    const profile = SKY_PALETTES.forest;
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      toneMapped: true,
      uniforms: {
        uZenith: { value: new THREE.Color(profile.zenith) },
        uHorizon: { value: new THREE.Color(profile.horizon) },
        uHaze: { value: new THREE.Color(profile.groundHaze) },
        uSunColor: { value: new THREE.Color(profile.sun) },
        uSunPower: { value: profile.sunlight },
        uSunDir: { value: new THREE.Vector3(-0.38, 0.22, -0.9).normalize() },
      },
      vertexShader: `
        varying vec3 vDirection;
        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vDirection;
        uniform vec3 uZenith;
        uniform vec3 uHorizon;
        uniform vec3 uHaze;
        uniform vec3 uSunColor;
        uniform vec3 uSunDir;
        uniform float uSunPower;
        void main() {
          vec3 ray = normalize(vDirection);
          float skyHeight = smoothstep(-0.10, 0.78, ray.y);
          vec3 color = mix(uHorizon, uZenith, skyHeight);
          float haze = exp(-pow(ray.y * 4.5, 2.0)) * (1.0 - skyHeight);
          color = mix(color, uHaze, clamp(haze * 0.57, 0.0, 0.63));
          float align = max(0.0, dot(ray, normalize(uSunDir)));
          float aureole = pow(align, 16.0) * 0.14 * uSunPower;
          float disc = pow(align, 1800.0) * 0.9 * uSunPower;
          color += uSunColor * (aureole + disc);
          gl_FragColor = vec4(color, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(310, 32, 20), material);
    this.mesh.name = 'SkyAtmosphere';
    this.mesh.renderOrder = -1000;
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  step(dt: number, biome: Biome): void {
    const target = SKY_PALETTES[biome];
    const lerp = Math.min(1, Math.max(0, dt) * 1.25);
    const uniforms = this.mesh.material.uniforms;
    (uniforms.uZenith.value as THREE.Color).lerp(this.work.setHex(target.zenith), lerp);
    (uniforms.uHorizon.value as THREE.Color).lerp(this.work.setHex(target.horizon), lerp);
    (uniforms.uHaze.value as THREE.Color).lerp(this.work.setHex(target.groundHaze), lerp);
    (uniforms.uSunColor.value as THREE.Color).lerp(this.work.setHex(target.sun), lerp);
    uniforms.uSunPower.value += (target.sunlight - uniforms.uSunPower.value) * lerp;
  }

  follow(camera: THREE.Camera): void {
    this.mesh.position.copy(camera.position);
  }
}
