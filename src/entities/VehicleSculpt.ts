import * as THREE from 'three';

export interface BodyStation {
  readonly z: number;
  readonly halfWidth: number;
  readonly deck: number;
  readonly floor?: number;
}

/**
 * Continuous watertight cross-section loft for original vehicle silhouettes.
 * Stations run nose (-Z) to tail (+Z); all materials are physically based.
 */
export function sculptBody(stations: readonly BodyStation[]): THREE.BufferGeometry {
  if (stations.length < 2) throw new Error('A sculpted hull requires at least two stations');
  const vertices: number[] = [];
  const uv: number[] = [];
  const indices: number[] = [];
  for (const station of stations) {
    const y0 = station.floor ?? 0.35;
    const w = station.halfWidth;
    vertices.push(-w, y0, station.z, -w, station.deck, station.z,
      w, station.deck, station.z, w, y0, station.z);
    uv.push(0, 0, 0, 1, 1, 1, 1, 0);
  }
  // closed prism: sides, roof and underbody form a single sealed mesh
  for (let i = 0; i < stations.length - 1; i++) {
    const a = i * 4;
    for (let side = 0; side < 4; side++) {
      const b = (side + 1) % 4;
      indices.push(a + side, a + 4 + side, a + b,
        a + b, a + 4 + side, a + 4 + b);
    }
  }
  indices.push(0, 1, 2, 0, 2, 3);
  const last = (stations.length - 1) * 4;
  indices.push(last, last + 2, last + 1, last, last + 3, last + 2);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

export function bodyPaint(color: number, hero = false): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color, metalness: hero ? 0.68 : 0.58, roughness: hero ? 0.2 : 0.31,
    clearcoat: hero ? 1 : 0.76,
    clearcoatRoughness: hero ? 0.09 : 0.17,
    envMapIntensity: 0.85,
  });
}

export function glassPaint(color = 0x1b5479): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color, metalness: 0.43, roughness: 0.1, clearcoat: 1,
    clearcoatRoughness: 0.07, envMapIntensity: 1.2,
    emissive: 0x05131e,
  });
}

export function sculptMesh(
  group: THREE.Group, stations: readonly BodyStation[], material: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(sculptBody(stations), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

export function addWheelAssembly(
  group: THREE.Group, x: number, z: number, radius = 0.49,
): void {
  const tread = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.34, 20),
    new THREE.MeshStandardMaterial({ color: 0x11151e, roughness: 0.93 }));
  tread.rotation.z = Math.PI / 2;
  tread.position.set(x, radius + 0.02, z);
  tread.castShadow = true;
  group.add(tread);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.64, radius * 0.64, 0.355, 12),
    new THREE.MeshStandardMaterial({ color: 0x93abb8, metalness: 0.89, roughness: 0.26 }));
  disc.rotation.z = Math.PI / 2;
  disc.position.copy(tread.position);
  group.add(disc);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, 0.39, 12),
    new THREE.MeshStandardMaterial({ color: 0x273744, metalness: 0.9, roughness: 0.22 }));
  hub.rotation.z = Math.PI / 2;
  hub.position.copy(tread.position);
  group.add(hub);
}

export function addDecalBar(
  group: THREE.Group, size: [number, number, number],
  position: [number, number, number], color: number, glow = false,
): THREE.Mesh {
  const material = glow
    ? new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3, roughness: 0.2 })
    : new THREE.MeshStandardMaterial({ color, metalness: 0.78, roughness: 0.3 });
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  stripe.position.set(...position);
  group.add(stripe);
  return stripe;
}
