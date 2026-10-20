/**
 * Fair, deterministic paired-enemy tactics. Two vehicles try to flank the
 * interceptor but preserve a drivable gap through the center of the pincer.
 * Orders are never assigned across a waterway, fork median or civilian shield.
 */
export interface SquadThreat {
  readonly squadId: number | null;
  readonly hostile: boolean;
  readonly hp: number;
  readonly role: string;
  readonly state: string;
  readonly x: number;
  readonly z: number;
}
export interface SquadOrder { readonly type: 'pincer'; readonly targetX: number }

const ELIGIBLE = new Set(['interceptor', 'switchblade', 'weaver', 'enforcer', 'motorcycle']);
export const PINCER_HALF_SPREAD = 3.8;

export function planSquadTactics<T extends SquadThreat>(
  vehicles: readonly T[],
  playerX: number,
  suppressTactics = false,
): Map<T, SquadOrder> {
  const orders = new Map<T, SquadOrder>();
  if (suppressTactics || Math.abs(playerX) > 3.2) return orders;
  const squads = new Map<number, T[]>();
  for (const vehicle of vehicles) {
    if (vehicle.squadId === null || !vehicle.hostile || vehicle.hp <= 0 ||
      !ELIGIBLE.has(vehicle.role) || (vehicle.state !== 'approach' && vehicle.state !== 'intercept') ||
      vehicle.z < -48 || vehicle.z > 4) continue;
    const members = squads.get(vehicle.squadId) ?? [];
    members.push(vehicle);
    squads.set(vehicle.squadId, members);
  }
  for (const members of squads.values()) {
    if (members.length !== 2) continue;
    const centerZ = (members[0].z + members[1].z) * 0.5;
    // Leave the center free whenever an innocent driver is navigating it.
    if (vehicles.some(vehicle => !vehicle.hostile && vehicle.hp > 0 &&
      Math.abs(vehicle.z - centerZ) < 18 && Math.abs(vehicle.x - playerX) < 3)) continue;
    const sorted = [...members].sort((a, b) => a.x - b.x);
    orders.set(sorted[0], { type: 'pincer', targetX: playerX - PINCER_HALF_SPREAD });
    orders.set(sorted[1], { type: 'pincer', targetX: playerX + PINCER_HALF_SPREAD });
  }
  return orders;
}
