import * as THREE from 'three';
import { roadCenterAt, seededRandom, type Biome } from './WorldPlan';
import type { Quality } from '../gameplay/Settings';

type Mark = { x: number; z: number; length: number; width: number };
export function roadMarkings(anchor: number, biome: Biome, quality: Quality): Mark[] {
  if (biome === 'water') return [];
  const marks: Mark[] = [];
  const lanes = [-6.3, 0, 6.3];
  const chunks = quality === 'high' ? 5 : quality === 'medium' ? 4 : 2;
  for (let lane = 0; lane < 3; lane++) {
    for (const offset of [-0.9, 0.9]) {
      for (let i = 0; i < chunks; i++) {
        const seed = Math.round(anchor * 13) + lane * 397 + i * 1597 + Math.round(offset * 11);
        const vary = seededRandom(seed);
        marks.push({
          x: lanes[lane] + offset + (vary - 0.5) * 0.14,
          z: -13.6 + i * 27 / chunks + (vary - 0.5) * 0.2,
          length: Math.max(2.4, 27 / chunks * (0.72 + vary * 0.19)),
          width: 0.12 + seededRandom(seed + 31) * 0.23,
        });
      }
    }
  }
  return marks;
}

/** Quad-packed faint rubber tracks and asphalt patching, one draw call. */
export function makeRoadSurfaceDetail(anchor: number, biome: Biome, quality: Quality): THREE.Group {
  const group = new THREE.Group();
  group.name = 'RoadSurfaceDetail:' + biome;
  if (biome === 'water') return group;
  const marks = roadMarkings(anchor, biome, quality);
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const add = (x: number, z: number, width: number, length: number, tone: number): void => {
    const initial = positions.length / 3;
    for (const [dx, dz] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
      const zz = z + dz * length / 2;
      const center = roadCenterAt(anchor - zz) - roadCenterAt(anchor);
      positions.push(x + dx * width / 2 + center, -0.026, zz);
      colors.push(tone, tone, tone);
    }
    indices.push(initial, initial + 2, initial + 1,
      initial + 1, initial + 2, initial + 3);
  };
  for (const mark of marks) {
    const v = 0.45 + seededRandom(Math.floor((anchor + mark.z) * 113)) * 0.30;
    add(mark.x, mark.z, mark.width, mark.length, v);
  }
  // Road maintenance patches are shaped as connected staggered lines rather
  // than square planes. Snow has darker salt ruts; city reads as wet tire wear.
  if (quality !== 'low') {
    const crackCount = quality === 'high' ? 13 : 7;
    for (let i = 0; i < crackCount; i++) {
      const seed = Math.round(anchor * 17) + 853 * i;
      const z = -13.3 + 26.6 * seededRandom(seed + 17);
      const x = -8.1 + 16.2 * seededRandom(seed + 39);
      const w = 0.035 + seededRandom(seed + 51) * 0.085;
      const length = 0.36 + seededRandom(seed + 67) * 1.18;
      add(x, z, w, length, biome === 'snow' ? 0.65 : 0.26);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const traces = new THREE.Mesh(geometry,
    new THREE.MeshBasicMaterial({
      color: 0x282a30, vertexColors: true, transparent: true,
      opacity: biome === 'snow' ? 0.27 : biome === 'city' ? 0.20 : 0.24,
      side: THREE.DoubleSide, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -1,
    }));
  traces.renderOrder = 2;
  group.add(traces);

  if (quality !== 'low') {
    const count = quality === 'high' ? 22 : 12;
    const studs = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.19, 0.045, 0.31),
      new THREE.MeshStandardMaterial({
        color: biome === 'city' ? 0x8ff1ff : 0xffdaa2,
        emissive: biome === 'city' ? 0x46c5e3 : 0xff973b,
        emissiveIntensity: biome === 'city' ? 2 : 0.8,
        metalness: 0.45, roughness: 0.25,
      }), count);
    studs.name = 'ReflectiveRoadStuds';
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const z = -14.3 + Math.floor(i / 2) * 28.6 / (count / 2 - 1);
      const side = i % 2 === 0 ? -1 : 1;
      dummy.position.set(
        side * 9.25 + roadCenterAt(anchor - z) - roadCenterAt(anchor),
        0.063, z,
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      studs.setMatrixAt(i, dummy.matrix);
    }
    studs.computeBoundingSphere();
    group.add(studs);
  }
  return group;
}
