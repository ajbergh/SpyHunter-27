import * as THREE from 'three';
import { sculptMesh, bodyPaint, glassPaint, addWheelAssembly, addDecalBar } from './VehicleSculpt';

const metal = (color: number, roughness = 0.38): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, metalness: 0.68, roughness });

function addGroundShadow(group: THREE.Group, width: number, length: number): void {
  // Smooth contact occlusion grounds the vehicle even with shadows disabled
  // on Low. Radial shader prevents the hard circular black patch of a disc.
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, polygonOffset: true,
      polygonOffsetFactor: -2,
      uniforms: { uOpacity: { value: 0.30 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uOpacity;
        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float r = dot(p, p);
          float alpha = pow(1.0 - smoothstep(0.03, 1.0, r), 1.6) * uOpacity;
          gl_FragColor = vec4(0.008, 0.017, 0.029, alpha);
        }
      `,
    }),
  );
  shadow.name = 'GroundContactOcclusion';
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(width, length, 1);
  shadow.position.y = 0.014;
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
  const pearl = bodyPaint(0x849bab, true);
  const carbon = new THREE.MeshStandardMaterial({
    color: 0x101923, metalness: 0.46, roughness: 0.58,
  });
  const glass = glassPaint(0x19374f);
  const chrome = new THREE.MeshStandardMaterial({
    color: 0x78949f, metalness: 0.76, roughness: 0.27,
  });
  // Purpose-sculpted wedge shell: the shoulder line tapers into a narrow nose
  // and broad, muscular haunches rather than reading as stacked cuboids.
  sculptMesh(group, [
    { z: -2.85, halfWidth: 0.70, deck: 0.53 },
    { z: -2.62, halfWidth: 1.04, deck: 0.70 },
    { z: -1.82, halfWidth: 1.20, deck: 0.84 },
    { z: -0.92, halfWidth: 1.23, deck: 0.86 },
    { z: 0.38, halfWidth: 1.24, deck: 0.88 },
    { z: 1.60, halfWidth: 1.27, deck: 0.87 },
    { z: 2.29, halfWidth: 1.12, deck: 0.73 },
    { z: 2.79, halfWidth: 0.88, deck: 0.57 },
  ], pearl);
  sculptMesh(group, [
    { z: -1.06, halfWidth: 0.70, deck: 0.90, floor: 0.83 },
    { z: -0.55, halfWidth: 0.90, deck: 1.42, floor: 0.89 },
    { z: 0.69, halfWidth: 0.88, deck: 1.44, floor: 0.89 },
    { z: 1.36, halfWidth: 0.60, deck: 0.91, floor: 0.82 },
  ], glass);
  // Black panoramic spine and visible roof armor segments.
  box(group, [0.12, 0.09, 2.02], [0, 1.47, 0.08], chrome);
  box(group, [0.95, 0.045, 0.82], [0, 1.53, 0.41], carbon);
  // Dark carbon roof-to-bonnet center spine reads even at arcade camera scale.
  box(group, [0.55, 0.035, 1.53], [0, 0.901, -1.77], carbon);
  box(group, [0.83, 0.04, 0.5], [0, 0.93, 1.83], carbon);
  box(group, [0.9, 0.055, 1.18], [0, 0.93, -1.86], carbon);
  for (const side of [-1, 1]) {
    // Radiused wheel arches and deep side intake pockets.
    box(group, [0.22, 0.24, 0.94], [side * 1.15, 0.76, -1.76], pearl);
    box(group, [0.22, 0.25, 1.06], [side * 1.16, 0.78, 1.68], pearl);
    addWheelAssembly(group, side * 1.28, -1.79, 0.53);
    addWheelAssembly(group, side * 1.30, 1.66, 0.54);
    addDecalBar(group, [0.10, 0.07, 3.42], [side * 1.23, 0.91, -0.20], 0x238db0);
    addDecalBar(group, [0.37, 0.16, 0.18], [side * 0.92, 0.67, -2.81], 0x9ecdda, true);
    addDecalBar(group, [0.41, 0.17, 0.14], [side * 0.94, 0.66, 2.78], 0xc83c51, true).name = 'BrakeLamp';
    addDecalBar(group, [0.47, 0.10, 0.32], [side * 0.75, 0.93, -2.06], 0xbed9e2);
    addDecalBar(group, [0.07, 0.08, 1.2], [side * 0.45, 0.96, -1.67], 0x6d8b99);
    addDecalBar(group, [0.22, 0.30, 0.82], [side * 1.13, 0.54, 0.43], 0x111b28);
  }
  // Distinct layered diffusers, canards and rear aero package.
  box(group, [2.24, 0.17, 0.31], [0, 0.47, -2.77], carbon);
  box(group, [1.64, 0.11, 0.15], [0, 0.65, -2.93], chrome);
  for (const z of [2.12, 2.42]) box(group, [1.48, 0.08, 0.16], [0, 0.86, z], carbon);
  box(group, [2.33, 0.10, 0.54], [0, 1.04, 2.27], carbon);
  for (const side of [-1, 1]) box(group, [0.16, 0.25, 0.45], [side * 1.06, 0.91, 2.18], chrome);
  box(group, [1.45, 0.10, 0.29], [0, 0.59, 2.85], chrome);
  addGroundShadow(group, 1.58, 3.10);
  return group;
}

export function makeTrafficVehicle(hostile: boolean, color: number, variant = 0): THREE.Group {
  if (variant === 4) return makeMotorcycle(hostile, color);
  if (variant === 5) return makeSpeedboat(hostile, color);
  if (variant === 6) return makeSwitchblade(color);
  const group = new THREE.Group();
  const body = bodyPaint(color);
  const dark = metal(0x151b27);
  const windows = glassPaint(hostile ? 0x401e31 : 0x234b64);
  const width = variant === 2 ? 2.8 : variant === 1 ? 1.8 : 2.25;
  const length = variant === 3 ? 6.7 : variant === 2 ? 6.3 : variant === 1 ? 4 : 4.8;
  const half = width / 2;
  const h = length / 2;
  sculptMesh(group, [
    { z: -h, halfWidth: half * 0.7, deck: 0.60 },
    { z: -h + 0.25, halfWidth: half * 0.94, deck: 0.79 },
    { z: -h * 0.48, halfWidth: half, deck: 0.94 },
    { z: h * 0.58, halfWidth: half, deck: 0.92 },
    { z: h - 0.27, halfWidth: half * 0.95, deck: 0.76 },
    { z: h, halfWidth: half * 0.79, deck: 0.60 },
  ], body);
  sculptMesh(group, [
    { z: -h * 0.42, halfWidth: half * 0.64, deck: 0.95, floor: 0.89 },
    { z: -h * 0.20, halfWidth: half * 0.76, deck: variant === 2 ? 1.78 : 1.47, floor: 0.90 },
    { z: h * 0.27, halfWidth: half * 0.75, deck: variant === 2 ? 1.78 : 1.47, floor: 0.90 },
    { z: h * 0.56, halfWidth: half * 0.62, deck: 0.96, floor: 0.88 },
  ], windows);
  box(group, [width * 0.85, 0.12, 0.20], [0, 0.66, -h], dark);
  for (const side of [-1, 1]) {
    for (const z of [-length * 0.31, length * 0.31]) {
      addWheelAssembly(group, side * (half + 0.10), z, 0.49);
    }
    addDecalBar(group, [0.10, 0.06, length * 0.62],
      [side * (half - 0.13), 0.95, 0], hostile ? 0xb23e56 : 0x78abbf);
    addDecalBar(group, [0.29, 0.18, 0.13],
      [side * half * 0.75, 0.74, -h - 0.03], hostile ? 0xff4c60 : 0xffe5a7, true);
    addDecalBar(group, [0.27, 0.17, 0.14],
      [side * half * 0.73, 0.72, h + 0.03], 0xff324d, true).name = 'BrakeLamp';
  }
  if (hostile) box(group, [width * 0.68, 0.12, 0.57], [0, 1.56, length * 0.15], dark);
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
    const pivot = new THREE.Group();
    pivot.name = z < 0 ? 'FrontWheelPivot' : 'RearWheelPivot';
    pivot.userData.wheelRadius = 0.55;
    pivot.position.set(0, 0.54, z);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.22, 14), tire);
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    pivot.add(wheel);
    group.add(pivot);
  }
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.15),
    new THREE.MeshStandardMaterial({
      color: hostile ? 0xff344f : 0xffb96e,
      emissive: hostile ? 0xff344f : 0xffb96e,
      emissiveIntensity: 0.95, roughness: 0.32,
    }));
  lamp.name = 'BrakeLamp';
  lamp.position.set(0, 0.92, 1.4);
  group.add(lamp);
  return group;
}

/** Original low-poly speedboat: streamlined hull, glazed cockpit and wake fins. */
export function makeSpeedboat(hostile: boolean, color = 0xe7f1f3): THREE.Group {
  const group = new THREE.Group();
  const hull = bodyPaint(color, true);
  const dark = new THREE.MeshStandardMaterial({ color: 0x111e2d, metalness: 0.45, roughness: 0.43 });
  const glass = glassPaint(hostile ? 0x452a3c : 0x1e6d90);
  const chrome = metal(0x92c9d5, 0.19);
  const accent = hostile ? 0xff3c64 : 0x4ff1f6;
  // Sculpted waterline, flared chines, V-shaped keel and knife-like bow.
  sculptMesh(group, [
    { z: -3.12, halfWidth: 0.06, deck: 0.89, floor: 0.29 },
    { z: -2.72, halfWidth: 0.49, deck: 0.94, floor: -0.03 },
    { z: -2.10, halfWidth: 0.88, deck: 1.00, floor: -0.32 },
    { z: -1.00, halfWidth: 1.13, deck: 1.03, floor: -0.49 },
    { z: 0.50, halfWidth: 1.25, deck: 0.98, floor: -0.51 },
    { z: 1.75, halfWidth: 1.23, deck: 0.89, floor: -0.45 },
    { z: 2.55, halfWidth: 1.16, deck: 0.80, floor: -0.26 },
    { z: 2.83, halfWidth: 1.06, deck: 0.75, floor: -0.18 },
  ], hull);
  sculptMesh(group, [
    { z: -0.95, halfWidth: 0.60, deck: 1.04, floor: 0.96 },
    { z: -0.60, halfWidth: 0.78, deck: 1.58, floor: 1.03 },
    { z: 0.72, halfWidth: 0.81, deck: 1.62, floor: 1.03 },
    { z: 1.26, halfWidth: 0.65, deck: 1.05, floor: 0.94 },
  ], glass);
  box(group, [0.98, 0.07, 1.64], [0, 1.01, -1.95], dark);
  box(group, [1.16, 0.07, 1.26], [0, 1.09, 1.72], dark);
  box(group, [0.12, 0.08, 2.0], [0, 1.65, 0.25], chrome);
  for (const side of [-1, 1]) {
    addDecalBar(group, [0.075, 0.065, 3.5],
      [side * 1.16, 0.76, 0.42], accent, true);
    addDecalBar(group, [0.07, 0.095, 2.1],
      [side * 1.01, 1.08, -0.49], 0xaccdd5);
    addDecalBar(group, [0.23, 0.11, 0.31],
      [side * 0.37, 0.99, -2.87], side < 0 ? 0xff4c4b : 0x49ff99, true);
    box(group, [0.35, 0.10, 0.8], [side * 0.74, 1.13, 1.49], dark);
    // Raised safety stanchions alongside the gunwale.
    for (const z of [-1.8, -0.6, 0.9]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.28, 7), chrome);
      post.position.set(side * 1.10, 1.13, z);
      group.add(post);
    }
    // Compact sculpted propulsion housings and luminous exhaust rings.
    const motor = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.75, 5, 10), dark);
    motor.rotation.x = Math.PI / 2;
    motor.position.set(side * 0.69, 0.55, 3.04);
    motor.castShadow = true;
    group.add(motor);
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.23, 0.55, 10), dark);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(side * 0.69, 0.46, 3.44);
    group.add(exhaust);
    const nozzle = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.03, 6, 15),
      new THREE.MeshBasicMaterial({ color: accent }));
    nozzle.position.set(side * 0.69, 0.46, 3.74);
    group.add(nozzle);
  }
  box(group, [2.15, 0.09, 0.64], [0, 0.80, 2.95], chrome);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.035, 1.3, 6), chrome);
  antenna.position.set(0.56, 2.07, 1.05);
  antenna.rotation.z = 0.15;
  group.add(antenna);
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
