import * as THREE from 'three';

const LENGTH = 30;
const COUNT = 8;
const FOREST_COLORS = [0x1c3b38, 0x224946, 0x26433b, 0x315244];

export class Road {
  readonly root = new THREE.Group();
  private segments: THREE.Group[] = [];

  constructor(scene: THREE.Scene) {
    const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0x142b2b, roughness: 1 }));
    shoulder.rotation.x = -Math.PI / 2;
    shoulder.position.y = -0.18;
    this.root.add(shoulder);
    for (let i = 0; i < COUNT; i++) {
      const segment = this.makeSegment(i);
      segment.position.z = -125 + LENGTH * i;
      this.segments.push(segment);
      this.root.add(segment);
    }
    scene.add(this.root);
  }

  private makeSegment(seed: number): THREE.Group {
    const group = new THREE.Group();
    const asphalt = new THREE.MeshStandardMaterial({ color: seed % 2 ? 0x242b33 : 0x222a31, roughness: 0.94, metalness: 0.03 });
    const road = new THREE.Mesh(new THREE.BoxGeometry(20, 0.16, LENGTH + 0.15), asphalt);
    road.position.y = -0.07;
    road.receiveShadow = true;
    group.add(road);
    const white = new THREE.MeshBasicMaterial({ color: 0xd3e5df });
    const yellow = new THREE.MeshBasicMaterial({ color: 0xfad572 });
    for (const x of [-9.55, 9.55]) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.18, LENGTH), yellow);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x, 0.025, 0);
      group.add(stripe);
    }
    for (const x of [-3.25, 3.25]) {
      for (let z = -12; z <= 12; z += 7.5) {
        const marking = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 3.5), white);
        marking.rotation.x = -Math.PI / 2;
        marking.position.set(x, 0.03, z);
        group.add(marking);
      }
    }
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x8d9eaa, metalness: 0.64, roughness: 0.4 });
    for (const side of [-1, 1]) {
      const guardrail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.33, LENGTH), railMaterial);
      guardrail.position.set(side * 10.5, 0.33, 0);
      group.add(guardrail);
      for (let j = 0; j < 4; j++) {
        const seedValue = ((seed * 37 + j * 29 + (side + 2) * 17) % 101) / 101;
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 2.7, 5), new THREE.MeshStandardMaterial({ color: 0x594437 }));
        trunk.position.y = 1.28;
        tree.add(trunk);
        const foliage = new THREE.Mesh(new THREE.ConeGeometry(1.5 + seedValue, 6 + seedValue * 3, 6), new THREE.MeshStandardMaterial({ color: FOREST_COLORS[(seed + j) % FOREST_COLORS.length], roughness: 1 }));
        foliage.position.y = 4.5;
        tree.add(foliage);
        tree.position.set(side * (13 + seedValue * 11), 0, -12 + j * 8);
        group.add(tree);
      }
    }
    return group;
  }

  step(speed: number, dt: number): void {
    for (const segment of this.segments) {
      segment.position.z += speed * dt;
      if (segment.position.z > 100) segment.position.z -= LENGTH * COUNT;
    }
  }

  reset(): void {
    this.segments.forEach((segment, i) => { segment.position.z = -125 + LENGTH * i; });
  }
}
