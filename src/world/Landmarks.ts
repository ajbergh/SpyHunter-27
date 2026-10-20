import * as THREE from 'three';
import type { Biome } from './WorldPlan';
import type { Quality } from '../gameplay/Settings';

export const LANDMARK_SPACING = 240;

/** One bespoke biome set-piece per several recycled road segments. */
export function landmarkAt(anchor: number, quality: Quality): boolean {
  if (quality === 'low') return false;
  const index = Math.round(anchor / 30);
  return index % (quality === 'high' ? 8 : 12) === 0;
}

export function makeLandmark(biome: Biome, seed: number): THREE.Group {
  const root = new THREE.Group();
  root.name = 'Landmark:' + biome;
  const iron = new THREE.MeshStandardMaterial({
    color: 0x6d858c, metalness: 0.82, roughness: 0.34,
  });
  const charcoal = new THREE.MeshStandardMaterial({
    color: 0x1c303d, metalness: 0.48, roughness: 0.56,
  });
  const warm = new THREE.MeshStandardMaterial({
    color: 0xffc27b, emissive: 0xed8c32, emissiveIntensity: 2.0,
  });
  const cyan = new THREE.MeshStandardMaterial({
    color: 0x5cf2ff, emissive: 0x13aacf, emissiveIntensity: 2.8,
  });
  const pink = new THREE.MeshStandardMaterial({
    color: 0xff8aba, emissive: 0xe52b83, emissiveIntensity: 2.4,
  });
  const sandstone = new THREE.MeshStandardMaterial({
    color: 0xa97355, roughness: 0.92, metalness: 0.06,
  });
  const snow = new THREE.MeshStandardMaterial({
    color: 0xd2e3ea, roughness: 0.66, metalness: 0.22,
  });
  function box(x: number, y: number, z: number,
    w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  }
  function cylinder(x: number, y: number, z: number, r: number, h: number,
    material: THREE.Material, segments = 10): void {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, h, segments), material);
    m.position.set(x, y, z);
    m.castShadow = true;
    root.add(m);
  }
  function brace(ax: number, ay: number, az: number, bx: number, by: number, bz: number,
    radius: number, material: THREE.Material): void {
    const a = new THREE.Vector3(ax, ay, az), b = new THREE.Vector3(bx, by, bz);
    const d = b.clone().sub(a);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, d.length(), 7), material);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    root.add(m);
  }
  if (biome === 'forest') {
    // Ranger lookout built on timber stilts, with a lookout light and canopy.
    const h = 9 + seed * 3;
    for (const x of [-2.0, 2.0]) for (const z of [-2.0, 2.0]) {
      box(x, h / 2, z, 0.31, h, 0.31, charcoal);
    }
    for (const side of [-1, 1]) {
      brace(side * 2, 1.3, -2, side * -2, 7.1, -2, 0.1, iron);
      brace(side * 2, 1.3, 2, side * -2, 7.1, 2, 0.1, iron);
    }
    box(0, h + 0.05, 0, 5.1, 0.35, 5.1, charcoal);
    box(0, h + 1.65, 0, 4.5, 2.95, 4.5, sandstone);
    for (const z of [-2.28, 2.28]) box(0, h + 1.9, z, 3.4, 0.95, 0.08, cyan);
    box(0, h + 3.30, 0, 6.1, 0.42, 6.1, charcoal);
    cylinder(1.7, h + 4.5, -1.5, 0.08, 2.2, iron);
    box(1.7, h + 5.48, -1.5, 0.4, 0.27, 0.3, warm);
  } else if (biome === 'desert') {
    // Oil-field lattice derrick + counterweighted orange floodlit derrick head.
    const h = 15 + seed * 4;
    for (const x of [-2.25, 2.25]) for (const z of [-2.25, 2.25])
      brace(x, 0, z, x * 0.2, h, z * 0.2, 0.13, iron);
    for (let y = 2.5; y < h; y += 2.5) {
      const r = 2.25 * (1 - y / h) + 0.5 * (y / h);
      for (const z of [-r, r]) brace(-r, y, z, r, y, z, 0.10, iron);
      for (const x of [-r, r]) brace(x, y, -r, x, y, r, 0.10, iron);
    }
    box(0, h + 0.2, 0, 2.6, 0.42, 2.6, charcoal);
    box(0, h + 0.67, 0, 1.35, 0.66, 1.42, warm);
    cylinder(0, h + 2, 0, 0.09, 2.4, iron);
    box(-3.3, 1.15, -2.0, 2.5, 2.3, 2.0, sandstone);
    box(-3.3, 2.3, -2, 2.7, 0.18, 2.2, charcoal);
  } else if (biome === 'snow') {
    // Arctic weather station; radome + a beacon-lit telecommunications mast.
    box(0, 1.2, 0, 5.2, 2.4, 4.3, snow);
    box(0, 2.44, 0, 5.8, 0.22, 4.7, charcoal);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.2, 18, 10, 0,
      Math.PI * 2, 0, Math.PI / 2), snow);
    dome.position.y = 2.48;
    dome.castShadow = true;
    root.add(dome);
    for (const x of [-2.5, 2.5]) brace(x, 0, 0, x, 8.8, 0, 0.12, iron);
    cylinder(2.5, 9.4, 0, 0.09, 2.1, iron);
    const dish = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.13, 7, 22), iron);
    dish.position.set(2.5, 7.25, 0);
    dish.rotation.x = Math.PI / 5;
    root.add(dish);
    box(2.5, 10.5, 0, 0.5, 0.34, 0.5, warm);
  } else if (biome === 'city') {
    // Tall animated-looking digital media monolith with layered neon borders.
    box(0, 7.7, 0, 0.72, 15.4, 0.8, charcoal);
    box(0, 11.2, -0.42, 5.8, 7.7, 0.46, iron);
    const panels = [cyan, pink, cyan, warm];
    for (let y = 8.35; y <= 13.3; y += 1.55) {
      box(0, y, -0.73, 4.8, 1.22, 0.07, panels[Math.round(y) % panels.length]);
      for (const side of [-1, 1])
        box(side * 2.68, y, -0.80, 0.11, 1.28, 0.1, pink);
    }
    box(0, 15.4, -0.25, 6.4, 0.28, 1.3, cyan);
    box(0, 0.68, 0, 4.1, 1.35, 3.3, charcoal);
    for (const x of [-1.5, 1.5]) box(x, 1.46, -1.66, 0.23, 0.34, 0.1, warm);
  } else {
    // Rivermouth navigation tower, floodlit pier and coastal beacon.
    box(0, 0.40, 0, 7.4, 0.8, 8.6, charcoal);
    for (const x of [-2.6, 2.6]) for (const z of [-3.3, 3.3])
      cylinder(x, -0.9, z, 0.28, 3, iron);
    cylinder(0, 4.6, 0, 1.38, 8.3, snow, 12);
    cylinder(0, 9.35, 0, 1.72, 1.25, charcoal, 12);
    cylinder(0, 10.15, 0, 1.42, 0.35, cyan, 12);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.86, 12, 10), cyan);
    beacon.position.y = 10.46;
    root.add(beacon);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.15, 1.35, 12), iron);
    roof.position.y = 11.5;
    root.add(roof);
  }
  return root;
}
