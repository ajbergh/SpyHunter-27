import { clamp } from '../core/logic';

export type HelicopterProfile = 'patrol' | 'ace';

/**
 * An elite aerial threat appears later in the campaign, but not on every
 * spawn. Use the passed RNG for repeatable Daily Challenge flight encounters.
 */
export function chooseHelicopterProfile(distance: number, random: () => number): HelicopterProfile {
  return distance >= 1900 && random() < 0.36 ? 'ace' : 'patrol';
}

/** Smooth lateral pursuit, not instant player tracking. */
export function helicopterTargetX(profile: HelicopterProfile, playerX: number, elapsed: number): number {
  const weave = profile === 'ace' ? Math.sin(elapsed * 1.8) * 3.6 : 0;
  return clamp(playerX * (profile === 'ace' ? 0.8 : 1) + weave, -6.4, 6.4);
}

/**
 * Ace gunships alternate offset bomb targets. Each release is still separately
 * telegraphed and leaves a nearby lateral escape route.
 */
export function bombingLane(profile: HelicopterProfile, playerX: number, volleyIndex: number): number {
  const offset = profile === 'ace' && volleyIndex % 2 === 1 ? 2.5 : 0;
  return clamp(playerX + offset * (volleyIndex % 4 === 1 ? 1 : -1), -7.5, 7.5);
}

export function helicopterCooldown(profile: HelicopterProfile): number {
  return profile === 'ace' ? 1.15 : 2.9;
}
