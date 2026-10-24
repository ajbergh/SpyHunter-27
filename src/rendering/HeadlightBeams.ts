import * as THREE from 'three';
import type { Quality } from '../gameplay/Settings';
import type { Biome } from '../world/WorldPlan';
import { PLAYER_Z } from '../core/logic';
import { damagedHeadlampFactors } from './HeadlightDamage';

export function beamStrength(biome: Biome, quality: Quality, boat: boolean): number {
  if (boat || quality === 'low') return 0;
  const sceneStrength: Record<Biome, number> = {
    forest: 0.25, desert: 0.12, snow: 0.21, city: 0.46, water: 0,
  };
  return sceneStrength[biome] * (quality === 'high' ? 1 : 0.58);
}

/**
 * Dual feathered beams projected on the asphalt. Uses one transparent shader
 * quad, no point lights, shadow passes, external textures or per-frame meshes.
 */
export class HeadlightBeams {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private quality: Quality = 'medium';
  private readonly tint = new THREE.Color();

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.PlaneGeometry(13, 25);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uStrength: { value: 0 },
        uColor: { value: new THREE.Color(0xa5daff) },
        uLeftLamp: { value: 1 },
        uRightLamp: { value: 1 },
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
        uniform vec3 uColor;
        uniform float uLeftLamp;
        uniform float uRightLamp;
        void main() {
          float distanceAhead = vUv.y;
          float spread = mix(0.027, 0.32, pow(distanceAhead, 0.85));
          float leftBeam = abs(vUv.x - mix(0.43, 0.34, distanceAhead)) / spread;
          float rightBeam = abs(vUv.x - mix(0.57, 0.66, distanceAhead)) / spread;
          float leftFeather = 1.0 - smoothstep(0.43, 1.0, leftBeam);
          float rightFeather = 1.0 - smoothstep(0.43, 1.0, rightBeam);
          float attenuation = smoothstep(0.0, 0.06, distanceAhead) *
            (1.0 - smoothstep(0.24, 1.0, distanceAhead));
          float hotspot = pow(max(leftFeather * uLeftLamp,
            rightFeather * uRightLamp), 1.65);
          float brightness = hotspot * attenuation * uStrength;
          gl_FragColor = vec4(uColor * brightness, brightness);
        }
      `,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.renderOrder = 3;
    this.mesh.frustumCulled = false;
    this.mesh.name = 'HeadlightProjection';
    scene.add(this.mesh);
    this.renderAt(() => 0, 0);
  }

  setQuality(quality: Quality): void {
    this.quality = quality;
    this.mesh.visible = quality !== 'low';
  }

  step(biome: Biome, boat: boolean, wearStage = 0, impactSide = 0): void {
    const intensity = beamStrength(biome, this.quality, boat);
    this.mesh.visible = intensity > 0;
    this.mesh.material.uniforms.uStrength.value = intensity;
    const factors = damagedHeadlampFactors(wearStage, impactSide);
    this.mesh.material.uniforms.uLeftLamp.value = factors.left;
    this.mesh.material.uniforms.uRightLamp.value = factors.right;
    const color = biome === 'city' ? 0x96dfff : biome === 'snow' ? 0xe0f5ff : 0xffe4ae;
    (this.mesh.material.uniforms.uColor.value as THREE.Color).copy(this.tint.setHex(color));
  }

  renderAt(center: (z: number) => number, playerX: number, playerZ = PLAYER_Z): void {
    const z = playerZ - 12;
    this.mesh.position.set(playerX + center(z), 0.052, z);
  }
}
