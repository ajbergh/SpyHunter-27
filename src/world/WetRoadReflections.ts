import * as THREE from 'three';
import type { Quality } from '../gameplay/Settings';
import { roadCenterAt, seededRandom } from './WorldPlan';

export interface WetRoadPatch {
  readonly x: number;
  readonly z: number;
  readonly width: number;
  readonly length: number;
  readonly tint: number;
  readonly phase: number;
}

/**
 * Fixed, deterministic light-catching wet patches in the neon-city asphalt.
 * No mesh or shader allocations occur in the frame loop; streamed tiles each
 * contain a single packed draw. These are an inexpensive stylized reflection
 * approximation, not a screen-space reflection or physically measured puddle.
 */
export function wetRoadPatches(anchor: number, quality: Quality): WetRoadPatch[] {
  const count = quality === 'high' ? 18 : quality === 'medium' ? 9 : 0;
  const result: WetRoadPatch[] = [];
  for (let i = 0; i < count; i++) {
    const seed = Math.round(anchor * 29) + i * 991;
    const width = 0.9 + seededRandom(seed + 17) * 2.1;
    const length = 1.8 + seededRandom(seed + 31) * 3.9;
    const limitX = 9.1 - width / 2;
    const limitZ = 14.2 - length / 2;
    result.push({
      x: (seededRandom(seed + 43) * 2 - 1) * limitX,
      z: (seededRandom(seed + 59) * 2 - 1) * limitZ,
      width, length,
      tint: seededRandom(seed + 73),
      phase: seededRandom(seed + 89) * Math.PI * 2,
    });
  }
  return result;
}

/** Shared by every city tile; one draw per visible tile, and zero on Low. */
export function makeWetRoadMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: true,
    vertexShader: `
      attribute float aTint;
      attribute float aPhase;
      varying vec2 vUv;
      varying float vTint;
      varying float vPhase;
      void main() {
        vUv = uv;
        vTint = aTint;
        vPhase = aPhase;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vTint;
      varying float vPhase;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        // Smooth oval shapes with no squared, opaque sticker edges.
        float ellipse = length(vec2(p.x * 1.05, p.y * 0.90));
        float edge = 1.0 - smoothstep(0.61, 1.0, ellipse);
        float cell = sin((p.y + 0.13 * sin(p.x * 7.0)) * 20.0
                         + vPhase + uTime * 0.34);
        float streak = pow(max(0.0, 1.0 - abs(p.x * 1.45
                         + 0.12 * sin(p.y * 9.0 + vPhase))), 5.0);
        float ripple = sin(26.0 * ellipse - uTime * 1.65 + vPhase);
        vec3 cyan = vec3(0.07, 0.49, 0.63);
        vec3 magenta = vec3(0.56, 0.08, 0.38);
        vec3 accent = mix(cyan, magenta, smoothstep(0.29, 0.73, vTint));
        float shimmer = 0.54 + 0.15 * cell + 0.08 * ripple;
        float alpha = edge * (0.12 + 0.33 * streak * shimmer);
        vec3 color = accent * (0.64 + streak * 0.55);
        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

export function makeWetRoadReflections(
  anchor: number, quality: Quality, material: THREE.ShaderMaterial,
): THREE.Mesh | null {
  const patches = wetRoadPatches(anchor, quality);
  if (patches.length === 0) return null;

  const positions: number[] = [];
  const uv: number[] = [];
  const tint: number[] = [];
  const phase: number[] = [];
  const indices: number[] = [];

  for (const patch of patches) {
    const start = positions.length / 3;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const z = patch.z + sz * patch.length / 2;
      const bend = roadCenterAt(anchor - z) - roadCenterAt(anchor);
      positions.push(patch.x + sx * patch.width / 2 + bend, -0.039, z);
      uv.push((sx + 1) / 2, (sz + 1) / 2);
      tint.push(patch.tint);
      phase.push(patch.phase);
    }
    indices.push(start, start + 2, start + 1, start + 1, start + 2, start + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute('aTint', new THREE.Float32BufferAttribute(tint, 1));
  geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(phase, 1));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'NeonWetRoadReflections';
  mesh.renderOrder = 1; // beneath painted lane lines, road wear and studs
  return mesh;
}
