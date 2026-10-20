import { ROAD_HALF_WIDTH } from '../core/logic';

export const VEHICLE_HALF_WIDTH = 1.45;

/**
 * Boundary collision is evaluated against the actual player clamp, not an
 * arbitrary visual position. Requires deliberate outward steering at speed.
 */
export function boundaryStrike(
  laneX: number, steering: number, speed: number, boat: boolean,
): boolean {
  const limit = ROAD_HALF_WIDTH - VEHICLE_HALF_WIDTH;
  return Math.abs(laneX) >= limit - 0.06 &&
    steering * Math.sign(laneX) > 0.35 &&
    speed > (boat ? 21 : 24);
}

export type BoathouseTransfer = 'clean' | 'scrape';
/**
 * The center boathouse opening is narrower than the main three-lane highway.
 * The player can recover after a scraped transfer, but loses a life.
 */
export function gradeBoathouseEntry(laneX: number, speed: number): BoathouseTransfer {
  return Math.abs(laneX) <= 4.35 && speed >= 11 && speed <= 52 ? 'clean' : 'scrape';
}
