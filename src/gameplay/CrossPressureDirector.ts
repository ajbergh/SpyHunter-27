import { LANES } from './SpawnDirector';

export interface CrossPressureTraffic {
  readonly x: number;
  readonly z: number;
  readonly hp: number;
  readonly role: string;
}
export interface CrossPressurePlan {
  readonly front: { readonly x: number; readonly z: number; readonly speed: number };
  readonly rear: { readonly x: number; readonly z: number; readonly speed: number };
  readonly escapeLane: number;
}

/**
 * Stage a readable two-direction formation. The forward armored blocker and
 * pursuing tail occupy opposite OUTSIDE lanes; the center is never assigned
 * to either vehicle. Require a clear nearby road before staging so existing
 * civilian traffic cannot create an accidental three-lane wall.
 *
 * The guaranteed lane refers to the planned two-car formation, not a promise
 * that every future arbitrary steering choice avoids collisions.
 */
export function planCrossPressure(
  traffic: readonly CrossPressureTraffic[],
  distance: number,
  playerX: number,
  onWater: boolean,
  nearFork: boolean,
  supportVanActive: boolean,
  random: () => number,
): CrossPressurePlan | null {
  if (distance < 1150 || Math.abs(playerX) > 2.4 || onWater ||
      nearFork || supportVanActive ||
      traffic.some(car => car.hp > 0 && car.z > -120 && car.z < 58)) return null;

  const left = random() < 0.5;
  const frontLane = left ? LANES[0] : LANES[2];
  const rearLane = left ? LANES[2] : LANES[0];
  return {
    front: { x: frontLane, z: -79, speed: 11 },
    rear: { x: rearLane, z: 36, speed: 47.5 },
    escapeLane: LANES[1],
  };
}
