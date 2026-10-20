export const ROAD_HALF_WIDTH = 9.7;
export const PLAYER_Z = 11;
export const MAX_LIVES = 3;

export interface RectHitbox { x: number; z: number; halfWidth: number; halfLength: number }

export function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

export function approach(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}

export function intersects(a: RectHitbox, b: RectHitbox): boolean {
  return Math.abs(a.x - b.x) < a.halfWidth + b.halfWidth &&
    Math.abs(a.z - b.z) < a.halfLength + b.halfLength;
}

export function scoreForTarget(hostile: boolean): number {
  return hostile ? 250 : 0;
}

export function distancePoints(speed: number, dt: number): number {
  return Math.max(0, speed * dt * 2);
}

export function spawnInterval(distance: number): number {
  return clamp(1.5 - distance / 12000, 0.65, 1.5);
}
