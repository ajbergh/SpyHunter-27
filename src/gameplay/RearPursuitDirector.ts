import { LANES } from './SpawnDirector';

export interface RearPursuitVehicle {
  readonly x: number;
  readonly z: number;
  readonly role: string;
}
export interface RearPursuitSpawn {
  readonly x: number;
  readonly z: number;
  readonly speed: number;
}

/**
 * A single visible threat enters from behind the interceptor, on a real road
 * lane. High gear can outrun it; braking/Low lets it close. The nearest lane
 * is preferred but never spawn-clips an existing car, and adjacent lanes remain
 * available for defensive steering. No tail attacks at junctions or on water.
 */
export function planRearPursuit(
  traffic: readonly RearPursuitVehicle[],
  distance: number,
  playerX: number,
  isBoat: boolean,
  forkHazard: boolean,
  supportVanActive: boolean,
  random: () => number,
): RearPursuitSpawn | null {
  if (distance < 550 || isBoat || forkHazard || supportVanActive ||
      traffic.some(car => car.role === 'rear-pursuer')) return null;
  const z = 34;
  const lanes = [...LANES].sort((a, b) => Math.abs(a - playerX) - Math.abs(b - playerX));
  const lane = lanes.find(x => !traffic.some(car =>
    Math.abs(car.z - z) < 16 && Math.abs(car.x - x) < 3.35));
  if (lane === undefined) return null;
  return { x: lane, z, speed: 46 + random() * 3 };
}
