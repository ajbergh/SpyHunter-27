import { clamp } from '../core/logic';

/**
 * Arcade throttle gives the car meaningful travel through the camera's road
 * window. The scenery keeps scrolling; only the player's actual Z changes.
 * No separate reverse gear: brake moves the car down-screen by reducing speed.
 *
 * Road-space -Z is forward (toward the van/traffic horizon).
 * -10 keeps its nose visible; +12 preserves its tail at the viewport bottom.
 */
export const DRIVE_Z_MIN = -10;
export const DRIVE_Z_MAX = 12;
export const DRIVE_Z_NEUTRAL = 8;

export function drivingTargetZ(speed: number, boat = false, speedScale = 1): number {
  const normalized = Number.isFinite(speed) ? speed / Math.max(0.2, speedScale) : 30;
  const cruise = boat ? 29 : 30;
  return clamp(DRIVE_Z_NEUTRAL - (normalized - cruise) * 0.88,
    DRIVE_Z_MIN, DRIVE_Z_MAX);
}
