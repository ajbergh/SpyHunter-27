import * as THREE from 'three';
import { groundHeightAt } from './BridgePlan';
import { roadCenterAt, type Biome } from './WorldPlan';

export const TERRAIN_COLUMNS = [
  -90, -76, -61, -48, -37, -29, -23, -17, -13, -10.8,
  10.8, 13, 17, 23, 29, 37, 48, 61, 76, 90,
] as const;

export function terrainRelief(biome: Biome, distance: number, x: number): number {
  const edge = Math.max(0, Math.abs(x) - 22);
  if (!edge) return 0;
  const side = x < 0 ? -1 : 1;
  const rough = Math.sin(distance * 0.035 + side * 2.1) * 0.45 +
    Math.sin(distance * 0.072 + x * 0.16) * 0.18 +
    Math.sin(distance * 0.013 + x * 0.27) * 0.36;
  const ramp = Math.min(1, edge / 28);
  switch (biome) {
    case 'snow':
      return edge * 0.15 + ramp * (11.0 + rough * 7.4);
    case 'forest':
      return edge * 0.11 + ramp * (5.0 + rough * 4.3);
    case 'desert': {
      const mesa = Math.max(0, Math.sin(distance / 65 + side * 1.9) * 0.5 + 0.5);
      const terrace = Math.floor(Math.min(1, edge / 32) * 4) / 4;
      return ramp * (2.7 + 12.5 * terrace * mesa) + Math.max(0, rough * 2.5) * ramp;
    }
    case 'city': return ramp * (1.2 + Math.max(0, rough) * 1.1);
    case 'water': return ramp * (2.2 + Math.max(0, rough) * 3.7);
  }
}

export function terrainColor(biome: Biome, distance: number, x: number): THREE.Color {
  const elevation = terrainRelief(biome, distance, x);
  const noise = Math.sin(distance * 0.17 + x * 0.19) * 0.048 +
    Math.sin(distance * 0.37 - x * 0.31) * 0.023;
  const palettes: Record<Biome, [number, number, number]> = {
    forest: [0x1b302c, 0x39564a, 0x6b7b63],
    desert: [0x74543d, 0xa97b56, 0xe1ae78],
    snow: [0x819aa9, 0xaec5d1, 0xe2eff3],
    city: [0x152232, 0x273249, 0x38485e],
    water: [0x244a47, 0x54796f, 0x82958c],
  };
  const [low, mid, high] = palettes[biome];
  const slope = Math.min(1, elevation / (biome === 'snow' ? 17 : 15));
  const result = new THREE.Color(low).lerp(new THREE.Color(mid), Math.min(1, slope * 1.3 + 0.1));
  if (biome === 'snow') result.lerp(new THREE.Color(high), Math.max(0, (slope - 0.28) * 1.8));
  else result.lerp(new THREE.Color(high), Math.max(0, (slope - 0.5) * 0.62));
  return result.offsetHSL(0, 0, noise);
}

/** Continuous, curved, colored, 3-D roadside terrain instead of a flat rectangle. */
export function buildTerrain(anchor: number, biome: Biome): THREE.BufferGeometry {
  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const zRows = 20;
  const cols = TERRAIN_COLUMNS.length;
  const tint = new THREE.Color();
  for (let zIndex = 0; zIndex <= zRows; zIndex++) {
    const z = -15 + zIndex * 30 / zRows;
    const world = anchor - z;
    const center = roadCenterAt(world) - roadCenterAt(anchor);
    for (const x of TERRAIN_COLUMNS) {
      vertices.push(center + x, groundHeightAt(world) + terrainRelief(biome, world, x), z);
      tint.copy(terrainColor(biome, world, x));
      colors.push(tint.r, tint.g, tint.b);
    }
  }
  for (let row = 0; row < zRows; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const a = row * cols + col;
      indices.push(a, a + 1, a + cols, a + 1, a + cols + 1, a + cols);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
