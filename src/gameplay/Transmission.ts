/** Manual two-range transmission inspired by classic arcade driving controls.
 *  Road speed is an internal world-space unit, not a physical MPH measurement.
 *  Low responds quickly off the line; High reaches a higher maximum but is
 *  deliberately sluggish until the car has gathered momentum.
 */
export type DriveGear = 'low' | 'high';
export const INITIAL_GEAR: DriveGear = 'low';

export interface TransmissionResponse {
  readonly targetSpeed: number;
  readonly responseRate: number;
}

export function nextGear(gear: DriveGear): DriveGear {
  return gear === 'low' ? 'high' : 'low';
}

export function transmissionResponse(
  gear: DriveGear, speed: number, throttle: boolean, brake: boolean,
): TransmissionResponse {
  if (brake) return { targetSpeed: 10, responseRate: 4.2 };
  if (!throttle) return { targetSpeed: 30, responseRate: 1.6 };
  if (gear === 'low') return { targetSpeed: 41, responseRate: 2.45 };
  return { targetSpeed: 58, responseRate: speed < 29 ? 0.68 : 1.4 };
}

/** Boats use separate fixed-speed handling and do not have transmission gears. */
export function transmissionLabel(gear: DriveGear, boat: boolean): string {
  return boat ? 'BOAT' : gear.toUpperCase();
}
