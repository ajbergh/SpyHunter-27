export type ThreatDirection = 'none' | 'front' | 'rear' | 'both';

export interface ObservedVehicle {
  readonly x: number;
  readonly z: number;
  readonly hp: number;
  readonly hostile: boolean;
  readonly halfWidth: number;
}

export interface CombatCue {
  readonly direction: ThreatDirection;
  /** True only if the middle corridor is unoccupied by ANY living traffic. */
  readonly centerClear: boolean;
  /** Only show the roadway guide for the deliberate two-car formation. */
  readonly guideCenter: boolean;
}

/** Evaluate real traffic and current player depth, not attack spawn intentions. */
export function combatCue(
  traffic: readonly ObservedVehicle[], playerZ: number,
  crossPressure: boolean, boat: boolean,
): CombatCue {
  if (boat) return { direction: 'none', centerClear: false, guideCenter: false };
  let front = false;
  let rear = false;
  let centerClear = true;
  for (const car of traffic) {
    if (car.hp <= 0) continue;
    const longitudinal = car.z - playerZ;
    if (car.hostile) {
      if (longitudinal <= -4 && longitudinal >= -86) front = true;
      if (longitudinal >= 4 && longitudinal <= 52) rear = true;
    }
    // Even a civilian blocks the guide. Width-aware clearance prevents the
    // interface from marking a lane safe when an oversized car straddles it.
    if (longitudinal > -43 && longitudinal < 35 &&
        Math.abs(car.x) < car.halfWidth + 1.95) centerClear = false;
  }
  const direction: ThreatDirection = front && rear ? 'both'
    : front ? 'front' : rear ? 'rear' : 'none';
  return { direction, centerClear, guideCenter: crossPressure && centerClear };
}

/** The one-shot cue must not spam each 60-Hz simulation update. */
export function shouldSoundThreat(
  previous: ThreatDirection, current: ThreatDirection, cooldown: number,
): boolean {
  return cooldown <= 0 && current !== 'none' && current !== previous;
}
