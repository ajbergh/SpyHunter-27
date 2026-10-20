import * as THREE from 'three';
import { clamp, intersects, type RectHitbox } from '../core/logic';

type HostileRound = { mesh: THREE.Mesh; x: number; z: number; velocityX: number; active: boolean };

/** Enemy turret rounds are independent of traffic position once fired and remain dodgeable. */
export class EnemyProjectiles {
  private readonly rounds: HostileRound[] = [];
  private readonly geometry = new THREE.ConeGeometry(0.22, 1, 7);
  private readonly material = new THREE.MeshBasicMaterial({ color: 0xff6246 });

  constructor(private readonly scene: THREE.Scene) {
    for (let i = 0; i < 30; i++) {
      const mesh = new THREE.Mesh(this.geometry, this.material);
      mesh.rotation.x = Math.PI / 2;
      mesh.visible = false;
      this.scene.add(mesh);
      this.rounds.push({ mesh, x: 0, z: 0, velocityX: 0, active: false });
    }
  }

  get activeCount(): number { return this.rounds.filter((round) => round.active).length; }

  spawn(x: number, z: number, targetX: number): boolean {
    const round = this.rounds.find((item) => !item.active);
    if (!round) return false;
    round.x = x;
    round.z = z;
    // Direction locked at firing time. These do not magically track the player.
    round.velocityX = clamp((targetX - x) * 0.58, -7, 7);
    round.active = true;
    round.mesh.visible = true;
    round.mesh.position.set(x, 0.73, z);
    return true;
  }

  step(dt: number, playerSpeed: number, playerBox: RectHitbox): number {
    let impacts = 0;
    for (const round of this.rounds) {
      if (!round.active) continue;
      round.z += (playerSpeed + 27) * dt;
      round.x += round.velocityX * dt;
      round.mesh.position.set(round.x, 0.7, round.z);
      if (intersects({ x: round.x, z: round.z, halfWidth: 0.3, halfLength: 0.48 }, playerBox)) {
        this.deactivate(round);
        impacts++;
      } else if (round.z > 60 || Math.abs(round.x) > 13) this.deactivate(round);
    }
    return impacts;
  }

  renderAt(center: (z: number) => number): void {
    for (const round of this.rounds) {
      if (round.active) round.mesh.position.x = round.x + center(round.z);
    }
  }

  reset(): void { for (const round of this.rounds) this.deactivate(round); }

  private deactivate(round: HostileRound): void { round.active = false; round.mesh.visible = false; }
}
