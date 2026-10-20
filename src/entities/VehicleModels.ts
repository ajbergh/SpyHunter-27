import * as THREE from 'three';

const metal = (color: number, roughness = 0.38): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, metalness: 0.68, roughness });

function addGroundShadow(group: THREE.Group, width: number, length: number): void {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 24),
    new THREE.MeshBasicMaterial({
      color: 0x01070d, transparent: true, opacity: 0.24,
      depthWrite: false, fog: true,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(width, length, 1);
  shadow.position.y = -0.015;
  shadow.renderOrder = 1;
  group.add(shadow);
}

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
  const paint = new THREE.MeshPhysicalMaterial({
    color: 0xe5f0f7, metalness: 0.75, roughness: 0.24,
    clearcoat: 0.94, clearcoatRoughness: 0.12,
  });
  const chrome = metal(0x8db9ca, 0.19);
  const accent = new THREE.MeshStandardMaterial({
    color: 0x2a627c, emissive: 0x1190bc, emissiveIntensity: 0.82,
    metalness: 0.7, roughness: 0.28,
  });
  const black = metal(0x101723);
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x16496c, metalness: 0.43, roughness: 0.09,
    clearcoat: 1, clearcoatRoughness: 0.09, emissive: 0x051e2f,
  });
  const light = new THREE.MeshStandardMaterial({ color: 0x6beaff, emissive: 0x24a9fa, emissiveIntensity: 2 });
  const tail = new THREE.MeshStandardMaterial({ color: 0xff3549, emissive: 0xe51233, emissiveIntensity: 2 });
  box(group, [2.45, 0.48, 5.2], [0, 0.55, 0], paint);
  // Flush lower diffuser and asymmetric illuminated shoulder lines.
  box(group, [2.4, 0.11, 5.22], [0, 0.37, 0], black);
  box(group, [1.85, 0.15, 2.0], [0, 0.91, -1.26], paint);
  box(group, [1.94, 0.11, 4.65], [0, 0.84, 0.02], black);
  box(group, [1.9, 0.68, 2.1], [0, 1.05, 0.22], glass);
  box(group, [1.75, 0.1, 1.05], [0, 1.01, -1.46], paint);
  for (const side of [-1, 1]) {
    box(group, [0.10, 0.075, 3.6], [side * 1.18, 0.88, -0.3], accent);
    box(group, [0.42, 0.12, 0.93], [side * 0.61, 0.91, -1.43], chrome);
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
  box(group, [1.62, 0.18, 0.22], [0, 0.8, -2.61], chrome);
  box(group, [1.82, 0.11, 0.16], [0, 0.78, 2.65], tail);
  box(group, [1.2, 0.08, 0.45], [0, 1.43, 1.08], chrome);
  addGroundShadow(group, 1.45, 2.9);
  return group;
}

export function makeTrafficVehicle(hostile: boolean, color: number, variant = 0): THREE.Group {
  if (variant === 4) return makeMotorcycle(hostile, color);
  if (variant === 5) return makeSpeedboat(hostile, color);
  if (variant === 6) return makeSwitchblade(color);
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
  for (const side of [-1, 1]) {
    box(group, [0.09, 0.07, length * 0.64], [side * (width / 2 - 0.12), 0.91, 0],
      new THREE.MeshStandardMaterial({
        color: hostile ? 0xb34955 : 0x91bcc9,
        metalness: 0.79, roughness: 0.28,
      }));
  }
  addGroundShadow(group, width * 0.66, length * 0.59);
  if (variant === 3 && hostile) {
    const red = new THREE.MeshBasicMaterial({ color: 0xff514a });
    box(group, [0.65, 0.35, 1.25], [0, 1.52, -0.5], dark);
    box(group, [0.34, 0.21, 0.8], [0, 1.62, -1.4], red);
  }
  return group;
}

/** Slim two-wheeled hostile silhouette, with rider and distinct red tail lamp. */
export function makeMotorcycle(hostile: boolean, color: number): THREE.Group {
  const group = new THREE.Group();
  const paint = metal(color, 0.38);
  const tire = new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.9 });
  const rider = new THREE.MeshStandardMaterial({ color: hostile ? 0x2b1723 : 0x526879, roughness: 0.79 });
  const visor = new THREE.MeshStandardMaterial({ color: 0x57b5da, metalness: 0.65, roughness: 0.25 });
  box(group, [0.65, 0.38, 2.7], [0, 0.7, 0], paint);
  box(group, [0.83, 0.15, 1.1], [0, 0.83, -0.5], paint);
  box(group, [0.73, 0.68, 0.92], [0, 1.33, 0.45], rider);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 7), rider);
  helmet.position.set(0, 1.91, -0.03);
  group.add(helmet);
  box(group, [0.53, 0.2, 0.1], [0, 1.94, -0.37], visor);
  box(group, [0.98, 0.11, 0.16], [0, 1.07, -0.86], tire);
  for (const z of [-1.29, 1.3]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.22, 14), tire);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.54, z);
    group.add(wheel);
  }
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.15),
    new THREE.MeshBasicMaterial({ color: hostile ? 0xff344f : 0xffb96e }));
  lamp.position.set(0, 0.92, 1.4);
  group.add(lamp);
  return group;
}

/** Original low-poly speedboat: streamlined hull, glazed cockpit and wake fins. */
export function makeSpeedboat(hostile: boolean, color = 0xe7f1f3): THREE.Group {
  const group = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({
    color, metalness: 0.58, roughness: 0.25, flatShading: true,
  });
  const deck = metal(hostile ? 0x29364c : 0x182639);
  const glass = new THREE.MeshStandardMaterial({ color: hostile ? 0x522637 : 0x17618b, metalness: 0.6, roughness: 0.13 });
  const shape = new THREE.CylinderGeometry(0.68, 1.55, 5.3, 5, 1, false);
  const boatBody = new THREE.Mesh(shape, hull);
  boatBody.rotation.x = Math.PI / 2;
  boatBody.rotation.y = Math.PI / 2;
  boatBody.scale.set(1, 0.66, 1);
  boatBody.position.y = 0.42;
  group.add(boatBody);
  box(group, [2.3, 0.26, 4.2], [0, 0.66, 0.28], deck);
  box(group, [1.5, 0.68, 1.55], [0, 1.01, 0.6], glass);
  box(group, [1.5, 0.22, 1.0], [0, 0.77, -1.45], hull);
  for (const side of [-1, 1]) {
    box(group, [0.24, 0.17, 1.2], [side * 1.05, 0.8, -0.35], hull);
    box(group, [0.15, 0.12, 0.42], [side * 0.75, 0.84, -2.05],
      new THREE.MeshBasicMaterial({ color: hostile ? 0xff3946 : 0x82f0ff }));
    box(group, [0.26, 0.38, 1.3], [side * 0.86, 0.41, 2.0], deck);
  }
  box(group, [0.9, 0.13, 0.8], [0, 0.5, 2.55], deck);
  return group;
}

/** Original blade-car silhouette. Broad deployable-looking armored side blades. */
export function makeSwitchblade(color: number): THREE.Group {
  const group = makeTrafficVehicle(true, color, 0);
  const steel = new THREE.MeshStandardMaterial({ color: 0xa6c6cf, metalness: 0.88, roughness: 0.24 });
  for (const side of [-1, 1]) {
    box(group, [1.45, 0.15, 0.64], [side * 1.53, 0.64, -0.4], steel);
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.2, 4), steel);
    blade.rotation.z = side * Math.PI / 2;
    blade.position.set(side * 2.13, 0.62, -0.4);
    group.add(blade);
  }
  box(group, [1.25, 0.13, 0.4], [0, 1.58, -0.7],
    new THREE.MeshBasicMaterial({ color: 0xff4469 }));
  return group;
}
