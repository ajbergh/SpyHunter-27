import * as THREE from 'three';
import { biomeAt, roadCenterAt, seededRandom, type Biome } from './WorldPlan';
import { PLAYER_Z } from '../core/logic';
import { splitMedianHalfWidth, SPLIT_PERIOD, SPLIT_START } from './SplitRoad';
import { bridgeZone, groundHeightAt } from './BridgePlan';
import { PavementMaterials } from '../rendering/PavementMaterials';
import type { Quality } from '../gameplay/Settings';
import { buildTerrain, terrainRelief } from './TerrainDetail';
import { landmarkAt, makeLandmark } from './Landmarks';

const LENGTH = 30;
const COUNT = 10;
const ROAD_HALF = 10;
const ROAD_COLOR: Record<Biome, number> = {
  forest: 0x273039, desert: 0x464347, snow: 0x5b6874, city: 0x1c2639, water: 0x176388,
};
type Tile = { anchor: number; group: THREE.Group; biome: Biome };

function strip(anchor: number, halfWidth: number, fromZ: number, toZ: number, y: number, steps = 20, heightAt?: (distance: number) => number): THREE.BufferGeometry {
  const vertices: number[] = [], indices: number[] = [], uv: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const z = fromZ + (toZ - fromZ) * i / steps;
    const center = roadCenterAt(anchor - z) - roadCenterAt(anchor);
    const surfaceY = heightAt ? heightAt(anchor - z) : y;
    vertices.push(center - halfWidth, surfaceY, z, center + halfWidth, surfaceY, z);
    uv.push(-halfWidth / 6, (anchor - z) / 6, halfWidth / 6, (anchor - z) / 6);
    if (i < steps) {
      const n = i * 2;
      indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
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
  private readonly pavement = new PavementMaterials();
  private quality: Quality = 'medium';
  readonly waterMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 p; varying vec2 vUv;
      void main(){ p=position; vUv=uv;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uTime; varying vec3 p; varying vec2 vUv;
      void main() {
        float a=sin(vUv.y*27.0-uTime*2.4+sin(vUv.x*9.0))*0.5+0.5;
        float b=sin(vUv.x*33.0+vUv.y*17.0+uTime*1.7)*0.5+0.5;
        float c=sin(vUv.y*68.0-uTime*3.2+vUv.x*6.0)*0.5+0.5;
        vec3 deep=vec3(0.018,0.115,0.19);
        vec3 light=vec3(0.052,0.34,0.43);
        float bands=clamp(a*0.36+b*0.28+c*0.15,0.0,1.0);
        vec3 tint=mix(deep,light,bands);
        float sunGlint=pow(max(0.0,1.0-abs(vUv.x*0.6+
          sin(vUv.y*5.0+uTime*0.7)*0.17)),8.0)*pow(b,8.0);
        vec3 color=tint+vec3(0.32,0.43,0.43)*sunGlint;
        gl_FragColor=vec4(color,1.0);
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

  setQuality(quality: Quality): void {
    this.pavement.setQuality(quality === 'high');
    if (this.quality === quality) return;
    this.quality = quality;
    for (const tile of this.tiles) {
      this.root.remove(tile.group);
      this.disposeTile(tile.group);
      tile.group = this.makeTile(tile.anchor);
      this.root.add(tile.group);
    }
    this.applyPositions();
  }
  get distance(): number { return this.travelled; }
  centerAt(z: number): number {
    return roadCenterAt(this.travelled - z) - roadCenterAt(this.travelled - PLAYER_Z);
  }

  private makeTile(anchor: number): THREE.Group {
    const biome = biomeAt(anchor);
    const group = new THREE.Group();
    const earth = new THREE.Mesh(buildTerrain(anchor, biome),
      new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 0.97,
        metalness: biome === 'city' ? 0.2 : 0,
        side: THREE.DoubleSide, flatShading: true,
      }));
    earth.receiveShadow = true;
    group.add(earth);
    const lane = new THREE.Mesh(strip(anchor, ROAD_HALF, -15.07, 15.07, -0.055),
      biome === 'water' ? this.waterMaterial : this.pavement.get(biome, ROAD_COLOR[biome]));
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
    if (Array.from({ length: 9 }, (_, i) => bridgeZone(anchor - (-15 + i * 30 / 8)))
      .some(zone => zone !== null)) {
      const deckMaterial = new THREE.MeshStandardMaterial({
        color: biome === 'city' ? 0x415267 : 0x68594e, metalness: 0.45, roughness: 0.6,
        side: THREE.DoubleSide,
      });
      const railMaterial = new THREE.MeshStandardMaterial({
        color: biome === 'city' ? 0xa3d7e5 : 0xcba77f, metalness: 0.72, roughness: 0.31,
      });
      const deck = new THREE.Mesh(strip(anchor, 10.3, -15.1, 15.1, -0.16), deckMaterial);
      group.add(deck);
      for (const side of [-1, 1]) {
        group.add(this.line(anchor, side * 10.45, -15, 15, 1.25, 0.24, railMaterial));
        for (const z of [-12, -6, 0, 6, 12]) {
          const world = anchor - z;
          if (!bridgeZone(world)) continue;
          const offsetX = roadCenterAt(world) - roadCenterAt(anchor);
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.4, 0.24), railMaterial);
          post.position.set(side * 10.45 + offsetX, 0.6, z);
          group.add(post);
          if (z === 0) {
            const supportHeight = Math.max(0.2, -0.11 - groundHeightAt(world));
            const support = new THREE.Mesh(
              new THREE.BoxGeometry(0.58, supportHeight, 0.64), deckMaterial,
            );
            support.position.set(side * 9.7 + offsetX, -0.11 - supportHeight / 2, z);
            group.add(support);
          }
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
      const propCount = this.quality === 'high' ? 4 : this.quality === 'medium' ? 3 : 2;
      for (let i = 0; i < propCount; i++) {
        const z = -11 + 7.3 * i;
        const seed = seededRandom(Math.floor(anchor * 100) + i * 197 + (side + 2) * 211);
        const x = side * (13.5 + 11 * seed);
        const prop = this.makeProp(biome, seed, i);
        const world = anchor - z;
        prop.position.set(x + roadCenterAt(world) - roadCenterAt(anchor),
          groundHeightAt(world) + terrainRelief(biome, world, x) + 0.22, z);
        group.add(prop);
      }
    }
    if (landmarkAt(anchor, this.quality)) {
      // Unique silhouette every few hundred metres, on the terrain rather
      // than colliding with the playable road/guardrail corridor.
      const seed = seededRandom(Math.round(anchor) * 109 + 17);
      const side = seed < 0.5 ? -1 : 1;
      const x = side * (19.0 + seed * 3.8);
      const world = anchor;
      const landmark = makeLandmark(biome, seed);
      landmark.position.set(x + roadCenterAt(world) - roadCenterAt(anchor),
        groundHeightAt(world) + terrainRelief(biome, world, x) + 0.22, 0);
      group.add(landmark);
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
      mesh(new THREE.CylinderGeometry(0.18, 0.27, 2.3, 6),
        new THREE.MeshStandardMaterial({ color: 0x554537 }), 0, 1.15);
      const canopy = biome === 'snow' ? 0xbed9d9 : seed > 0.5 ? 0x315943 : 0x254d3c;
      mesh(new THREE.ConeGeometry(1.6 + seed * 0.6, 5.5 + seed * 2, 7),
        new THREE.MeshStandardMaterial({ color: canopy, roughness: 1, flatShading: true }), 0, 4.2);
      if (this.quality === 'high') {
        const needle = new THREE.MeshStandardMaterial({
          color: biome === 'snow' ? 0xe7f4fa : 0x436e57,
          roughness: 1, flatShading: true,
        });
        mesh(new THREE.ConeGeometry(1.8 + seed * 0.3, 3.0, 7), needle, 0, 3.6);
        mesh(new THREE.ConeGeometry(1.45 + seed * 0.3, 3.3, 7), needle, 0, 5.05);
        mesh(new THREE.ConeGeometry(1.05 + seed * 0.3, 3.2, 7), needle, 0, 6.55);
      }
    } else if (biome === 'desert') {
      mesh(new THREE.DodecahedronGeometry(1.5 + seed, 0),
        new THREE.MeshStandardMaterial({ color: seed > 0.5 ? 0x996747 : 0xb08059,
          roughness: 0.95, flatShading: true }), 0, 0.8);
      if (this.quality === 'high') {
        mesh(new THREE.DodecahedronGeometry(0.75 + seed * 0.7, 0),
          new THREE.MeshStandardMaterial({ color: 0xd29a68, roughness: 1 }), 1.45, 0.45);
        const sandstone = new THREE.MeshStandardMaterial({
          color: seed > 0.5 ? 0xb66f4d : 0xa96545, roughness: 0.98,
          flatShading: true,
        });
        const height = 4.5 + seed * 7;
        mesh(new THREE.CylinderGeometry(2.2, 3.9, height, 7), sandstone, 2.2, height / 2);
        mesh(new THREE.CylinderGeometry(3.1, 2.35, 0.7, 7), sandstone, 2.2, height + 0.26);
      }
    } else if (biome === 'city') {
      const h = 8 + 22 * seed;
      mesh(new THREE.BoxGeometry(5, h, 5),
        new THREE.MeshStandardMaterial({
          color: index % 2 ? 0x263548 : 0x344354,
          roughness: 0.48, metalness: 0.32,
        }), 0, h / 2);
      const lightColor = seed > 0.48 ? 0x18cdf0 : 0xfd5396;
      const facade = new THREE.MeshStandardMaterial({
        color: lightColor, emissive: lightColor, emissiveIntensity: 2.8,
        metalness: 0.35, roughness: 0.24,
      });
      mesh(new THREE.BoxGeometry(4.35, 0.13, 0.16), facade, 0, h * 0.66, -2.59);
      if (this.quality !== 'low') {
        // Hundreds of independently illuminated apartment windows as a
        // single instanced draw call per building rather than per-pane meshes.
        const floors = Math.max(3, Math.floor(h / 1.45));
        const total = floors * 5;
        const windows = new THREE.InstancedMesh(
          new THREE.BoxGeometry(0.46, 0.48, 0.065),
          new THREE.MeshStandardMaterial({
            color: seed > 0.5 ? 0x74c8ff : 0xffdfaa,
            emissive: seed > 0.5 ? 0x36a8ed : 0xffb255,
            emissiveIntensity: this.quality === 'high' ? 2.0 : 1.1,
            roughness: 0.2,
          }), total);
        const dummy = new THREE.Object3D();
        let n = 0;
        for (let floor = 0; floor < floors; floor++) {
          for (let col = 0; col < 5; col++) {
            const on = seededRandom(Math.floor(seed * 10000) + floor * 71 + col * 149) > 0.24;
            dummy.position.set(-1.8 + col * 0.9, 1.5 + floor * 1.45, -2.57);
            dummy.scale.setScalar(on ? 1 : 0.03);
            dummy.updateMatrix();
            windows.setMatrixAt(n++, dummy.matrix);
          }
        }
        group.add(windows);
        mesh(new THREE.BoxGeometry(3.35, 0.11, 0.16), facade, 0, h * 0.36, -2.59);
        if (this.quality === 'high') {
          mesh(new THREE.BoxGeometry(0.16, Math.max(2.2, h * 0.72), 0.18),
            facade, -2.46, h * 0.50, -2.52);
          const rooftop = new THREE.MeshStandardMaterial({
            color: 0x1c334f, metalness: 0.65, roughness: 0.33,
          });
          mesh(new THREE.BoxGeometry(4.1, 0.26, 4.1), rooftop, 0, h + 0.2);
          mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.5, 7), facade,
            0, h + 1.9);
          // Building face sign reads as a holographic lightbox from above.
          const ad = new THREE.MeshBasicMaterial({ color: seed > 0.5 ? 0x1ecfe8 : 0xf152af });
          mesh(new THREE.BoxGeometry(1.7, 2.15, 0.2), ad, 1.05, h * 0.54, -2.75);
        }
      }
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
          if (material !== this.waterMaterial && !this.pavement.owns(material)) material.dispose();
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
