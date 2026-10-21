import * as THREE from 'three';
import type { Quality } from '../gameplay/Settings';
import type { HelicopterProfile } from '../combat/FlightDirector';

// Geometry is built once for the full session, not on helicopter spawn or frame.
const CONE_GEOMETRY = new THREE.ConeGeometry(3.25, 1, 28, 1, true);
const FOOTPRINT_GEOMETRY = new THREE.CircleGeometry(1, 32);
const UP = new THREE.Vector3(0, 1, 0);

/**
 * A non-damaging, original GPU searchlight for aerial threats.
 *
 * The beam is a feathered, translucent cone while its soft ground footprint
 * follows the projected (curved) road. It does not create real-time lights or
 * shadow maps and is visually distinct from the orange bomb warning.
 *
 * High: cone + ground footprint (2 draws). Medium: footprint (1 draw).
 * Low: hidden. Reduced Motion: scan and pulsation are held still.
 */
export class HelicopterSearchlight {
  readonly cone: THREE.Mesh<THREE.ConeGeometry, THREE.ShaderMaterial>;
  readonly footprint: THREE.Mesh<THREE.CircleGeometry, THREE.ShaderMaterial>;
  private readonly vector = new THREE.Vector3();
  private phase = 0;
  private quality: Quality = 'medium';
  private reducedMotion = false;
  private readonly scanRange: number;

  constructor(private readonly scene: THREE.Scene, profile: HelicopterProfile) {
    const color = new THREE.Color(profile === 'ace' ? 0xf6a0a9 : 0x82d7eb);
    this.scanRange = profile === 'ace' ? 1.8 : 1.2;

    const coneMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: color.clone() },
        uPulse: { value: 1 },
      },
      vertexShader: `
        varying float vHeight;
        void main() {
          vHeight = uv.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uPulse;
        varying float vHeight;
        void main() {
          // Tiny halo near the nose, brightest at mid/low altitude.
          float falloff = smoothstep(0.0, 0.18, vHeight) *
                          (1.0 - smoothstep(0.48, 1.0, vHeight));
          gl_FragColor = vec4(uColor, 0.075 * falloff * uPulse);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const groundMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: color.clone() },
        uPulse: { value: 1 },
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
        uniform vec3 uColor;
        uniform float uPulse;
        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float r = length(p);
          float halo = (1.0 - smoothstep(0.10, 1.0, r));
          float hotSpot = 1.0 - smoothstep(0.0, 0.35, r);
          float alpha = (0.22 * halo + 0.12 * hotSpot) * uPulse;
          gl_FragColor = vec4(uColor, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    this.cone = new THREE.Mesh(CONE_GEOMETRY, coneMaterial);
    this.cone.name = 'HelicopterSearchlightCone';
    this.cone.frustumCulled = false;
    // Draw before translucent hazard rings so orange bomb telegraphs win.
    this.cone.renderOrder = -2;
    this.footprint = new THREE.Mesh(FOOTPRINT_GEOMETRY, groundMaterial);
    this.footprint.name = 'HelicopterSearchlightFootprint';
    this.footprint.rotation.x = -Math.PI / 2;
    this.footprint.scale.setScalar(3.25);
    this.footprint.renderOrder = -1;
    scene.add(this.cone, this.footprint);
    this.setPreferences('medium', false);
  }

  setPreferences(quality: Quality, reducedMotion: boolean): void {
    this.quality = quality;
    this.reducedMotion = reducedMotion;
    this.cone.visible = quality === 'high';
    this.footprint.visible = quality !== 'low';
    if (reducedMotion) {
      this.cone.material.uniforms.uPulse.value = 1;
      this.footprint.material.uniforms.uPulse.value = 1;
    }
  }

  step(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.phase += Math.min(dt, 0.05);
    const pulse = this.reducedMotion ? 1 : 0.91 + 0.09 * Math.sin(this.phase * 2.1);
    this.cone.material.uniforms.uPulse.value = pulse;
    this.footprint.material.uniforms.uPulse.value = pulse;
  }

  /**
   * Transform-only pass; no per-frame mesh/geometry/vector allocations.
   * Both ends use road centerline projection, preserving curve alignment.
   */
  renderAt(
    helicopterX: number, helicopterZ: number, altitude: number,
    center: (z: number) => number,
  ): void {
    if (this.quality === 'low') return;
    const sweep = this.reducedMotion ? 0 :
      Math.sin(this.phase * (this.scanRange > 1.3 ? 1.8 : 1.25)) * this.scanRange;
    const targetX = THREE.MathUtils.clamp(helicopterX + sweep, -7.4, 7.4);
    const targetZ = helicopterZ - 4.1;
    const groundX = targetX + center(targetZ);
    const groundY = 0.105;
    const emitX = helicopterX + center(helicopterZ);
    const emitY = altitude - 1.45;
    const emitZ = helicopterZ - 2.1;
    this.footprint.position.set(groundX, groundY, targetZ);

    if (this.cone.visible) {
      this.vector.set(emitX - groundX, emitY - groundY, emitZ - targetZ);
      const height = this.vector.length();
      if (height <= 0.01) {
        this.cone.visible = false;
        return;
      }
      this.vector.multiplyScalar(1 / height);
      this.cone.quaternion.setFromUnitVectors(UP, this.vector);
      this.cone.position.set((groundX + emitX) / 2,
        (groundY + emitY) / 2, (targetZ + emitZ) / 2);
      this.cone.scale.set(1, height, 1);
    }
  }

  dispose(): void {
    this.scene.remove(this.cone, this.footprint);
    this.cone.material.dispose();
    this.footprint.material.dispose();
    // Shared geometries remain cached for later helicopters.
  }
}
