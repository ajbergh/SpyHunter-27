import * as THREE from 'three';
import { biomeAt, roadCenterAt, seededRandom, type Biome } from './WorldPlan';
import { PLAYER_Z } from '../core/logic';
import { splitMedianHalfWidth, SPLIT_PERIOD, SPLIT_START } from './SplitRoad';

const LENGTH = 30;
const COUNT = 10;
const ROAD_HALF = 10;
const BACKGROUND: Record<Biome, number> = {
  forest: 0x162d29, desert: 0x795039, snow: 0xd6e2e4, city: 0x121b2e, water: 0x123b50,
};
const ROAD_COLOR: Record<Biome, number> = {
  forest: 0x273039, desert: 0x464347, snow: 0x5b6874, city: 0x1c2639, water: 0x176388,
};
type Tile = { anchor: number; group: THREE.Group; biome: Biome };

function strip(anchor: number, halfWidth: number, fromZ: number, toZ: number, y: number, steps = 20): THREE.BufferGeometry {
  const vertices: number[] = [], indices: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const z = fromZ + (toZ - fromZ) * i / steps;
    const center = roadCenterAt(anchor - z) - roadCenterAt(anchor);
    vertices.push(center - halfWidth, y, z, center + halfWidth, y, z);
    if (i < steps) {
      const n = i * 2;
      indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}


/**
 * Center hazard overlay follows the same curved world-space geometry as road
 * ribbons. Geometry collapses to zero width as two drivable paths rejoin.
 */
function medianRibbon(anchor: number, side: -1 | 0 | 1, width = 0): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];
  const n = 30;
  for (let i = 0; i <= n; i++) {
    const z = -15.03 + i * 30.06 / n;
    const world = anchor - z;
    const gap = splitMedianHalfWidth(world);
    const center = roadCenterAt(world) - roadCenterAt(anchor);
    const left = side === 0 ? center - gap : center + side * gap - width / 2;
    const right = side === 0 ? center + gap : center + side * gap + width / 2;
    vertices.push(left, side === 0 ? 0.055 : 0.063, z, right, side === 0 ? 0.055 : 0.063, z);
    if (i < n) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export class Road {
  readonly root = new THREE.Group();
  readonly waterMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: 'varying vec3 p; void main(){ p=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform float uTime; varying vec3 p;
      void main() {
        float wave=sin(p.z*.55+uTime*2.)*.055+sin(p.x*1.4-p.z*.19-uTime*1.6)*.04;
        vec3 c=mix(vec3(.035,.21,.29),vec3(.08,.43,.51),.42+wave*2.7);
        gl_FragColor=vec4(c,1.);
      }`,
    side: THREE.DoubleSide,
  });
  private readonly tiles: Tile[] = [];
  private travelled = 0;
  private time = 0;
  private lastBiome: Biome = 'forest';

  constructor(scene: THREE.Scene) {
    for (let i = 0; i < COUNT; i++) {
      const anchor = 145 - i * LENGTH;
      const group = this.makeTile(anchor);
      this.root.add(group);
      this.tiles.push({ anchor, group, biome: biomeAt(anchor) });
    }
    scene.add(this.root);
    this.applyPositions();
  }

  get biome(): Biome { return biomeAt(this.travelled - PLAYER_Z); }
  get distance(): number { return this.travelled; }
  centerAt(z: number): number {
    return roadCenterAt(this.travelled - z) - roadCenterAt(this.travelled - PLAYER_Z);
  }

  private makeTile(anchor: number): THREE.Group {
    const biome = biomeAt(anchor);
    const group = new THREE.Group();
    const earth = new THREE.Mesh(strip(anchor, 85, -15, 15, -0.22),
      new THREE.MeshStandardMaterial({ color: BACKGROUND[biome], roughness: 1, side: THREE.DoubleSide }));
    group.add(earth);
    const lane = new THREE.Mesh(strip(anchor, ROAD_HALF, -15.07, 15.07, -0.055),
      biome === 'water' ? this.waterMaterial :
        new THREE.MeshStandardMaterial({ color: ROAD_COLOR[biome], roughness: 0.84, side: THREE.DoubleSide }));
    lane.receiveShadow = true;
    group.add(lane);
    const white = new THREE.MeshBasicMaterial({ color: biome === 'water' ? 0x7ad2e2 : biome === 'snow' ? 0xe8f2f6 : 0xbccfd2, side: THREE.DoubleSide });
    const amber = new THREE.MeshBasicMaterial({ color: biome === 'water' ? 0x9bdfec : 0xe5b964, side: THREE.DoubleSide });
    for (const x of [-9.65, 9.65]) {
      group.add(this.line(anchor, x, -15, 15, 0.015, 0.13, amber));
    }
    if (biome !== 'water') for (const x of [-3.3, 3.3]) {
      for (const z of [-11, -3.5, 4, 11.5]) {
        group.add(this.line(anchor, x, z, z + 3.2, 0.02, 0.11, white));
      }
    }
    if (biome !== 'water' && Array.from({ length: 10 }, (_, i) =>
      splitMedianHalfWidth(anchor - (-15 + i * (30 / 9)))).some(gap => gap > 0.03)) {
      const hazard = new THREE.Mesh(medianRibbon(anchor, 0),
        new THREE.MeshStandardMaterial({ color: biome === 'snow' ? 0x314957 : 0x382d24,
          roughness: 1, side: THREE.DoubleSide }));
      group.add(hazard);
      const warning = new THREE.MeshBasicMaterial({ color: 0xffbf47, side: THREE.DoubleSide });
      for (const side of [-1, 1] as const) {
        group.add(new THREE.Mesh(medianRibbon(anchor, side, 0.16), warning));
      }
      // Repeating retro-reflectors at the divider provide depth and warning.
      for (const z of [-10, 0, 10]) {
        const half = splitMedianHalfWidth(anchor - z);
        if (half < 1.7) continue;
        for (const side of [-1, 1]) {
          const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.45),
            new THREE.MeshBasicMaterial({ color: 0xffdb67 }));
          reflector.position.set(roadCenterAt(anchor - z) - roadCenterAt(anchor) + side * (half - 0.2), 0.24, z);
          group.add(reflector);
        }
      }
    }
    if (biome !== 'water') {
      const start = Math.floor(anchor / SPLIT_PERIOD) * SPLIT_PERIOD + SPLIT_START;
      const localZ = anchor - start;
      if (Math.abs(localZ) <= 14 && splitMedianHalfWidth(start + 65) > 0) {
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xb9cdd1, metalness: 0.7 });
        const signMaterial = new THREE.MeshBasicMaterial({ color: 0xffcb59 });
        for (const side of [-1, 1]) {
          const pole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 0.18), poleMaterial);
          pole.position.set(side * 4.25 + roadCenterAt(start) - roadCenterAt(anchor), 1.6, localZ);
          group.add(pole);
          const sign = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.75, 0.16), signMaterial);
          sign.position.set(pole.position.x, 3.2, localZ);
          group.add(sign);
        }
      }
    }
    // Each entry or exit from the river is framed by a recognizable boathouse
    // portal. The playable vehicle changes mode as its center crosses the gate.
    if (biomeAt(anchor - LENGTH / 2) !== biomeAt(anchor + LENGTH / 2) &&
      (biomeAt(anchor - LENGTH / 2) === 'water' || biomeAt(anchor + LENGTH / 2) === 'water')) {
      const frame = new THREE.MeshStandardMaterial({ color: 0x718896, metalness: 0.58, roughness: 0.5 });
      const roof = new THREE.Mesh(new THREE.BoxGeometry(14.8, 1.6, 7), frame);
      const crossing = Math.round(anchor / 1000) * 1000;
      const zCross = anchor - crossing;
      roof.position.set(roadCenterAt(crossing) - roadCenterAt(anchor), 6.2, zCross);
      group.add(roof);
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(1.8, 6, 7), frame);
        post.position.set(side * 6.55 + roadCenterAt(crossing) - roadCenterAt(anchor), 2.8, zCross);
        group.add(post);
      }
    }
    for (const side of [-1, 1]) {
      if (biome !== 'water') {
        const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.3, LENGTH - 0.2),
          new THREE.MeshStandardMaterial({ color: biome === 'city' ? 0x86b7d6 : 0x80909c, metalness: 0.55, roughness: 0.36 }));
        barrier.position.set(side * 10.6, 0.31, 0);
        group.add(barrier);
      }
      for (let i = 0; i < 4; i++) {
        const z = -11 + 7.3 * i;
        const seed = seededRandom(Math.floor(anchor * 100) + i * 197 + (side + 2) * 211);
        const x = side * (13.5 + 11 * seed);
        const prop = this.makeProp(biome, seed, i);
        prop.position.set(x + roadCenterAt(anchor - z) - roadCenterAt(anchor), 0, z);
        group.add(prop);
      }
    }
    return group;
  }

  private line(anchor: number, x: number, fromZ: number, toZ: number, y: number, width: number, material: THREE.Material): THREE.Mesh {
    const geom = strip(anchor, width / 2, fromZ, toZ, y, 4);
    const positions = geom.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i++) positions.setX(i, positions.getX(i) + x);
    positions.needsUpdate = true;
    return new THREE.Mesh(geom, material);
  }

  private makeProp(biome: Biome, seed: number, index: number): THREE.Group {
    const group = new THREE.Group();
    const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z = 0): void => {
      const object = new THREE.Mesh(geometry, material);
      object.position.set(x, y, z);
      group.add(object);
    };
    if (biome === 'forest' || biome === 'snow') {
      mesh(new THREE.CylinderGeometry(0.18, 0.27, 2.3, 5),
        new THREE.MeshStandardMaterial({ color: 0x554537 }), 0, 1.15);
      mesh(new THREE.ConeGeometry(1.6 + seed * 0.6, 5.5 + seed * 2, 7),
        new THREE.MeshStandardMaterial({ color: biome === 'snow' ? 0xbed9d9 : seed > 0.5 ? 0x315943 : 0x254d3c, roughness: 1 }), 0, 4.2);
    } else if (biome === 'desert') {
      mesh(new THREE.DodecahedronGeometry(1.5 + seed, 0),
        new THREE.MeshStandardMaterial({ color: seed > 0.5 ? 0x996747 : 0xb08059 }), 0, 0.8);
    } else if (biome === 'city') {
      const h = 5 + 13 * seed;
      mesh(new THREE.BoxGeometry(5, h, 5),
        new THREE.MeshStandardMaterial({ color: index % 2 ? 0x263548 : 0x344354, roughness: 0.8 }), 0, h / 2);
      mesh(new THREE.BoxGeometry(3.8, 0.14, 0.15),
        new THREE.MeshBasicMaterial({ color: 0x3daccb }), 0, h * 0.6, -2.59);
    } else {
      mesh(new THREE.ConeGeometry(0.8, 2.5, 5),
        new THREE.MeshStandardMaterial({ color: 0x66885a }), 0, 1.2);
      mesh(new THREE.TorusGeometry(1.4, 0.12, 5, 20),
        new THREE.MeshBasicMaterial({ color: 0x65c8d2 }), 0, 0.15);
    }
    return group;
  }

  step(speed: number, dt: number): boolean {
    this.travelled += speed * dt;
    this.time += dt;
    this.waterMaterial.uniforms.uTime.value = this.time;
    for (const tile of this.tiles) {
      if (this.travelled - tile.anchor > 104) {
        tile.anchor += LENGTH * COUNT;
        this.root.remove(tile.group);
        this.disposeTile(tile.group);
        tile.biome = biomeAt(tile.anchor);
        tile.group = this.makeTile(tile.anchor);
        this.root.add(tile.group);
      }
    }
    this.applyPositions();
    const changed = this.lastBiome !== this.biome;
    this.lastBiome = this.biome;
    return changed;
  }

  private applyPositions(): void {
    this.root.position.x = -roadCenterAt(this.travelled - PLAYER_Z);
    for (const tile of this.tiles) {
      tile.group.position.x = roadCenterAt(tile.anchor);
      tile.group.position.z = this.travelled - tile.anchor;
    }
  }

  private disposeTile(group: THREE.Group): void {
    group.traverse(item => {
      if (item instanceof THREE.Mesh) {
        item.geometry.dispose();
        const materials = Array.isArray(item.material) ? item.material : [item.material];
        for (const material of materials) {
          if (material !== this.waterMaterial) material.dispose();
        }
      }
    });
  }

  /** Deterministic seek for development-only biome/transition acceptance tests. */
  seek(distance: number): void {
    this.travelled = Math.max(0, distance);
    this.time = 0;
    this.lastBiome = this.biome;
    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i];
      tile.anchor = this.travelled + 145 - i * LENGTH;
      this.root.remove(tile.group);
      this.disposeTile(tile.group);
      tile.biome = biomeAt(tile.anchor);
      tile.group = this.makeTile(tile.anchor);
      this.root.add(tile.group);
    }
    this.applyPositions();
  }

  reset(): void { this.seek(0); }
}
