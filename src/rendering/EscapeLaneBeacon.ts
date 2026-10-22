import * as THREE from 'three';
import type { Quality } from '../gameplay/Settings';
import { PLAYER_Z } from '../core/logic';

/**
 * One pooled road-plane shader quad, active only for an unobstructed planned
 * center escape. This is navigational guidance, never a collision-free cheat.
 * No geometry/material allocations in the simulation or render loop.
 */
export class EscapeLaneBeacon {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private reducedMotion = false;
  private quality: Quality = 'medium';
  private elapsed = 0;
  private active = false;

  constructor(scene: THREE.Scene) {
    const material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uStrength: { value: 0.3 },
        uTime: { value: 0 },
        uMotion: { value: 1 },
        uTint: { value: new THREE.Color(0x65dfe0) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uStrength;
        uniform float uTime;
        uniform float uMotion;
        uniform vec3 uTint;
        void main() {
          // Soft tapered lane edges; dotted guide moves ONLY when motion is
          // enabled. Reduced Motion has stationary chevrons.
          float edge = 1.0 - smoothstep(0.19, 0.49, abs(vUv.x - 0.5));
          float ends = smoothstep(0.0, 0.18, vUv.y) *
            (1.0 - smoothstep(0.79, 1.0, vUv.y));
          float phase = fract(vUv.y * 6.0 + uTime * 0.40 * uMotion);
          float dash = 1.0 - smoothstep(0.18, 0.37, phase);
          float center = 1.0 - smoothstep(0.0, 0.12, abs(vUv.x - 0.5));
          float sideLine = 1.0 - smoothstep(0.014, 0.049,
            abs(abs(vUv.x - 0.5) - 0.32));
          float intensity = edge * ends * (0.12 + dash * center * 0.8 +
            sideLine * 0.38) * uStrength;
          gl_FragColor = vec4(uTint * intensity, intensity);
        }
      `,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 29), material);
    this.mesh.name = 'EscapeLaneGuidance';
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.065;
    this.mesh.renderOrder = 5;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  setPreferences(quality: Quality, reducedMotion: boolean): void {
    this.quality = quality;
    this.reducedMotion = reducedMotion;
    this.mesh.material.uniforms.uMotion.value = reducedMotion ? 0 : 1;
    this.mesh.material.uniforms.uStrength.value =
      quality === 'low' ? 0.4 : quality === 'high' ? 0.62 : 0.52;
    this.mesh.material.uniforms.uTime.value = reducedMotion ? 0 : this.elapsed;
  }

  step(dt: number, active: boolean, boat: boolean): void {
    this.active = active && !boat;
    this.mesh.visible = this.active;
    if (this.active && !this.reducedMotion) this.elapsed += Math.max(0, dt);
    this.mesh.material.uniforms.uTime.value = this.reducedMotion ? 0 : this.elapsed;
  }

  renderAt(centerAt: (z: number) => number, playerZ = PLAYER_Z): void {
    if (!this.active) return;
    const z = playerZ - 11.5;
    this.mesh.position.set(centerAt(z), 0.065, z);
  }

  reset(): void {
    this.active = false;
    this.elapsed = 0;
    this.mesh.visible = false;
    this.mesh.material.uniforms.uTime.value = 0;
  }
}
