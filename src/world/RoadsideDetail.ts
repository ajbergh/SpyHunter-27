import * as THREE from 'three';
import { groundHeightAt } from './BridgePlan';
import { roadCenterAt, seededRandom, type Biome } from './WorldPlan';
import { terrainRelief } from './TerrainDetail';
import type { Quality } from '../gameplay/Settings';

export interface ScatterPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly scale: number;
  readonly hue: number;
  readonly yaw: number;
}

/** Instance budgets are per road tile, not global; no per-frame allocations. */
const HIGH: Record<Biome, number> = {
  forest: 46, snow: 36, desert: 36, city: 12, water: 38,
};
export function roadsideBudget(biome: Biome, quality: Quality): number {
  const high = HIGH[biome];
  return quality === 'high' ? high : quality === 'medium' ?
    Math.ceil(high * 0.55) : Math.ceil(high * 0.24);
}

/** Deterministic off-highway placements with curved-road alignment. */
export function scatterPoints(anchor: number, biome: Biome, quality: Quality): ScatterPoint[] {
  const count = roadsideBudget(biome, quality);
  const points: ScatterPoint[] = [];
  for (let i = 0; i < count; i++) {
    const seed = Math.round(anchor * 173) + i * 911 + 127;
    const side = i % 2 === 0 ? -1 : 1;
    const z = -14.3 + (i + seededRandom(seed + 41) * 0.9) * 29 / count;
    const spread = seededRandom(seed + 149);
    const edge = biome === 'city' ? 12.4 : biome === 'water' ? 13.2 : 12.7;
    const width = biome === 'city' ? 13.5 : 21.5;
    const x = side * (edge + spread * width);
    const world = anchor - z;
    const y = groundHeightAt(world) + terrainRelief(biome, world, x);
    points.push({
      x: x + roadCenterAt(world) - roadCenterAt(anchor),
      y, z,
      scale: 0.76 + seededRandom(seed + 293) * 0.88,
      hue: seededRandom(seed + 537),
      yaw: seededRandom(seed + 719) * Math.PI * 2,
    });
  }
  return points;
}

/** Native Three.js InstancedMesh; geometry/material are per-streamed-tile. */
function batch(
  root: THREE.Group,
  points: readonly ScatterPoint[],
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  placement: (point: ScatterPoint, obj: THREE.Object3D, index: number) => void,
  tint?: (point: ScatterPoint) => number,
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, points.length);
  const transform = new THREE.Object3D();
  const color = new THREE.Color();
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    placement(point, transform, i);
    transform.updateMatrix();
    mesh.setMatrixAt(i, transform.matrix);
    if (tint) mesh.setColorAt(i, color.setHex(tint(point)));
  }
  mesh.castShadow = false; // Hero assets and landmarks retain real-time shadows.
  mesh.receiveShadow = false;
  mesh.computeBoundingSphere();
  mesh.name = 'RoadsideInstanced';
  root.add(mesh);
  return mesh;
}

function colored(base: number, roughness = 0.94): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: base, vertexColors: false, roughness, flatShading: true,
    metalness: 0,
  });
}

/** Biome art fills roadside negative space without moving collision geometry. */
export function makeRoadsideDetail(anchor: number, biome: Biome, quality: Quality): THREE.Group {
  const root = new THREE.Group();
  root.name = 'RoadsideDetail:' + biome;
  const points = scatterPoints(anchor, biome, quality);
  const pos = (obj: THREE.Object3D, p: ScatterPoint, y: number): void => {
    obj.position.set(p.x, p.y + y, p.z);
    obj.rotation.set(0, p.yaw, 0);
  };
  if (biome === 'forest' || biome === 'snow') {
    batch(root, points, new THREE.CylinderGeometry(0.22, 0.34, 1, 6),
      colored(0x75604d),
      (p, obj) => {
        const h = 2.3 * p.scale;
        pos(obj, p, h / 2);
        obj.scale.set(0.75 * p.scale, h, 0.75 * p.scale);
      },
      p => p.hue > 0.45 ? 0x665440 : 0x87735b);
    const palette: number[] = biome === 'snow'
      ? [0x55746d, 0x496a61, 0x6f918e]
      : [0x1b493d, 0x315f43, 0x376a57, 0x244c3c];
    // Three overlapping crowns produce denser irregular fir silhouettes.
    for (let layer = 0; layer < (quality === 'low' ? 2 : 3); layer++) {
      batch(root, points,
        new THREE.ConeGeometry(1, 1, quality === 'high' ? 8 : 6),
        colored(0xffffff),
        (p, obj) => {
          const width = (2.1 - layer * 0.42) * p.scale;
          const height = (2.6 - layer * 0.13) * p.scale;
          pos(obj, p, (2.4 + layer * 1.5) * p.scale);
          obj.scale.set(width, height, width);
        },
        p => {
          if (biome === 'snow' && layer === 2) return p.hue > 0.35 ? 0xc3dbda : 0xe4eef1;
          return palette[Math.min(palette.length - 1, Math.floor(p.hue * palette.length))];
        });
    }
    if (quality !== 'low') batch(root,
      points.filter((_, i) => i % 3 === 0),
      new THREE.DodecahedronGeometry(1, 0), colored(0xffffff),
      (p, obj) => {
        pos(obj, p, 0.32);
        obj.position.x += p.x > 0 ? -2.15 : 2.15;
        obj.scale.set(0.6 * p.scale, 0.3 * p.scale, 0.72 * p.scale);
      },
      p => biome === 'snow' ? 0xe5f2f1 : p.hue > 0.5 ? 0x314d3b : 0x4e5f3c);
  } else if (biome === 'desert') {
    batch(root, points, new THREE.DodecahedronGeometry(1, 0), colored(0xffffff),
      (p, obj) => {
        pos(obj, p, 0.58 * p.scale);
        obj.scale.set(1.7 * p.scale, 0.7 * p.scale, 1.3 * p.scale);
      },
      p => p.hue < 0.33 ? 0xb68563 : p.hue < 0.69 ? 0x9f6950 : 0xd2a17a);
    const cactus = points.filter((p, i) => i % 3 === 0 && p.hue > 0.19);
    batch(root, cactus,
      new THREE.CylinderGeometry(0.23, 0.32, 1, 7), colored(0xffffff),
      (p, obj) => {
        const h = 2.4 + p.scale * 2.2;
        pos(obj, p, h / 2);
        obj.scale.set(p.scale, h, p.scale);
      },
      p => p.hue > 0.65 ? 0x6a8d69 : 0x58745c);
    batch(root, cactus,
      new THREE.SphereGeometry(0.28, 7, 5), colored(0x91ad83),
      (p, obj) => {
        pos(obj, p, 2.4 + p.scale * 2.2);
        obj.scale.setScalar(p.scale);
      });
  } else if (biome === 'water') {
    batch(root, points, new THREE.ConeGeometry(0.36, 2.3, 5),
      colored(0xffffff),
      (p, obj) => {
        pos(obj, p, 0.96 * p.scale);
        obj.scale.set(p.scale, p.scale, p.scale);
      },
      p => p.hue > 0.5 ? 0x829d6c : 0x476f58);
    batch(root, points.filter((_, i) => i % 2 === 0),
      new THREE.DodecahedronGeometry(1, 0), colored(0xffffff),
      (p, obj) => {
        pos(obj, p, 0.34 * p.scale);
        obj.scale.set(p.scale * 0.88, p.scale * 0.48, p.scale * 1.5);
      },
      p => p.hue > 0.5 ? 0x667f79 : 0x4a665c);
  } else {
    // Street furniture silhouettes scale with LOD and neon-night palette.
    batch(root, points, new THREE.CylinderGeometry(0.085, 0.13, 1, 7),
      colored(0x4c6375, 0.3),
      (p, obj) => {
        const h = (5.1 + p.hue * 2.7) * p.scale;
        pos(obj, p, h / 2);
        obj.scale.set(1, h, 1);
      });
    batch(root, points, new THREE.BoxGeometry(0.64, 0.24, 0.45),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x67dfff,
        emissiveIntensity: 2.6, roughness: 0.22 }),
      (p, obj) => {
        pos(obj, p, (5.1 + p.hue * 2.7) * p.scale);
        obj.scale.setScalar(0.9 + p.hue * 0.4);
      },
      p => p.hue > 0.5 ? 0xff72c0 : 0x71effa);
  }
  return root;
}
