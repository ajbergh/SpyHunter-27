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
export type SquadOrder =
  | { readonly type: 'pincer'; readonly targetX: number }
  | { readonly type: 'retreat'; readonly targetX: number }
  | { readonly type: 'overtake'; readonly targetX: number };

const ELIGIBLE = new Set(['interceptor', 'switchblade', 'weaver', 'enforcer', 'motorcycle']);
export const PINCER_HALF_SPREAD = 3.8;

export function planSquadTactics<T extends SquadThreat>(
  vehicles: readonly T[],
  playerX: number,
  suppressTactics = false,
): Map<T, SquadOrder> {
  const orders = new Map<T, SquadOrder>();
  if (suppressTactics) return orders;
  const squads = new Map<number, T[]>();
  // Count every surviving squad member even if it is still approaching or has
  // been disrupted. Otherwise the first attacker to arrive would falsely
  // believe its partner had been destroyed and flee prematurely.
  for (const vehicle of vehicles) {
    if (vehicle.squadId === null || !vehicle.hostile || vehicle.hp <= 0) continue;
    const members = squads.get(vehicle.squadId) ?? [];
    members.push(vehicle);
    squads.set(vehicle.squadId, members);
  }
  for (const members of squads.values()) {
    if (members.length === 1) {
      const survivor = members[0];
      if (!ELIGIBLE.has(survivor.role) || survivor.z < -48 || survivor.z > 20 ||
          survivor.state === 'spinning' || survivor.state === 'disrupted') continue;
      // Flee outward, away from the player's driving corridor. This is a
      // disengagement, not a damaging attack: the vehicle heads up the road.
      const side = survivor.x < 0 ? -1 : survivor.x > 0 ? 1 : (playerX < 0 ? 1 : -1);
      orders.set(survivor, { type: 'retreat', targetX: side * 7.5 });
      continue;
    }
    if (members.length !== 2 || Math.abs(playerX) > 3.2) continue;
    if (members.some(vehicle => !ELIGIBLE.has(vehicle.role) ||
      (vehicle.state !== 'approach' && vehicle.state !== 'intercept') ||
      vehicle.z < -48 || vehicle.z > 4)) continue;
    const centerZ = (members[0].z + members[1].z) * 0.5;
    if (vehicles.some(vehicle => !vehicle.hostile && vehicle.hp > 0 &&
      Math.abs(vehicle.z - centerZ) < 18 && Math.abs(vehicle.x - playerX) < 3)) continue;
    const sorted = [...members].sort((a, b) => a.x - b.x);
    orders.set(sorted[0], { type: 'pincer', targetX: playerX - PINCER_HALF_SPREAD });
    orders.set(sorted[1], { type: 'pincer', targetX: playerX + PINCER_HALF_SPREAD });
  }
  return orders;
}
