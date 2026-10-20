import * as THREE from 'three';

const metal = (color: number, roughness = 0.38): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, metalness: 0.68, roughness });

function box(group: THREE.Group, size: [number, number, number], pos: [number, number, number], material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...pos);
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

/** Original low-poly interceptor silhouette, built entirely from geometry. Front is -Z. */
export function makeInterceptor(): THREE.Group {
  const group = new THREE.Group();
  const paint = metal(0xe9edf2, 0.26);
  const black = metal(0x101723);
  const glass = new THREE.MeshStandardMaterial({ color: 0x163657, metalness: 0.52, roughness: 0.13, emissive: 0x061828 });
  const light = new THREE.MeshStandardMaterial({ color: 0x6beaff, emissive: 0x24a9fa, emissiveIntensity: 2 });
  const tail = new THREE.MeshStandardMaterial({ color: 0xff3549, emissive: 0xe51233, emissiveIntensity: 2 });
  box(group, [2.45, 0.48, 5.2], [0, 0.55, 0], paint);
  box(group, [1.94, 0.11, 4.65], [0, 0.84, 0.02], black);
  box(group, [1.9, 0.68, 2.1], [0, 1.05, 0.22], glass);
  box(group, [1.75, 0.1, 1.05], [0, 1.01, -1.46], paint);
  for (const side of [-1, 1]) {
    box(group, [0.36, 0.37, 1.15], [side * 1.03, 0.68, -1.65], paint);
    box(group, [0.3, 0.32, 0.28], [side * 1.05, 0.55, -2.58], light);
    box(group, [0.3, 0.2, 0.25], [side * 1.06, 0.65, 2.6], tail);
    box(group, [0.2, 0.2, 1.08], [side * 0.51, 0.7, -2.41], black);
    for (const z of [-1.57, 1.57]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.28, 12), black);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 1.33, 0.52, z);
      group.add(wheel);
    }
  }
  box(group, [2.2, 0.13, 0.6], [0, 0.74, 2.28], black);
  return group;
}

export function makeTrafficVehicle(hostile: boolean, color: number, variant = 0): THREE.Group {
  const group = new THREE.Group();
  const body = metal(color, 0.49);
  const dark = metal(0x151b27);
  const windows = new THREE.MeshStandardMaterial({ color: hostile ? 0x421b2a : 0x223b49, metalness: 0.55, roughness: 0.19 });
  const width = variant === 2 ? 2.8 : variant === 1 ? 1.8 : 2.25;
  const length = variant === 3 ? 6.7 : variant === 2 ? 6.3 : variant === 1 ? 4 : 4.8;
  box(group, [width, 0.57, length], [0, 0.58, 0], body);
  box(group, [width * 0.78, 0.54, length * 0.4], [0, 1.06, 0.05], windows);
  box(group, [width * 0.85, 0.13, 0.2], [0, 0.68, -length / 2], hostile ? metal(0xff4b43) : dark);
  for (const side of [-1, 1]) {
    for (const z of [-length * 0.31, length * 0.31]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.28, 10), dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * (width / 2 + 0.13), 0.5, z);
      group.add(wheel);
    }
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.18, 0.1), new THREE.MeshBasicMaterial({ color: hostile ? 0xff334e : 0xffd9a2 }));
    lamp.position.set(side * width * 0.32, 0.65, -length / 2 - 0.04);
    group.add(lamp);
  }
  if (hostile) box(group, [width * 0.72, 0.13, 0.65], [0, 1.4, length * 0.15], dark);
  if (variant === 3 && hostile) {
    const red = new THREE.MeshBasicMaterial({ color: 0xff514a });
    box(group, [0.65, 0.35, 1.25], [0, 1.52, -0.5], dark);
    box(group, [0.34, 0.21, 0.8], [0, 1.62, -1.4], red);
  }
  return group;
}
