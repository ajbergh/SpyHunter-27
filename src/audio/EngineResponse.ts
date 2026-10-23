import type { Biome } from '../world/WorldPlan';
import type { DriveGear } from '../gameplay/Transmission';
import { SOUNDSCAPES } from './Soundscape';

/** Driver intent and measured acceleration; all values from fixed-step gameplay. */
export interface DriveSoundControls {
  readonly gear: DriveGear;
  readonly throttle: boolean;
  readonly brake: boolean;
  readonly steer: number;
  readonly acceleration: number;
}
export interface EngineToneProfile {
  readonly engineHz: number;
  readonly overtoneHz: number;
  readonly filterHz: number;
  /** Gain scalar BEFORE the existing user effects volume is applied. */
  readonly engineGain: number;
  readonly overtoneGain: number;
  readonly textureHz: number;
  readonly textureGain: number;
  readonly textureFilterHz: number;
}

const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));

/** Bounded frequency/gain targets for the three oscillator layers.
 *  No random, time or browser APIs: safe for replay tests, even if the
 *  WebAudio device is unavailable or suspended.
 */
export function engineToneProfile(
  biome: Biome, speed: number, controls: DriveSoundControls,
  boat = false,
): EngineToneProfile {
  const sound = SOUNDSCAPES[boat ? 'water' : biome];
  const velocity = clamp(speed, 0, 110);
  const accel = clamp(controls.acceleration, -30, 30);
  const steer = clamp(controls.steer, -1, 1);
  const load = controls.brake ? -1 : controls.throttle ? 1 : 0;
  // The tonal gear drop must remain audible during an actual upshift.
  // High gear accelerates more rapidly at cruise, so an overly aggressive
  // acceleration-based pitch term can cancel the lower RPM ratio entirely.
  const gearOffset = boat ? 0 : controls.gear === 'low' ? 16 : -22;
  const engineHz = clamp(sound.engineBase + velocity * sound.engineRate +
    gearOffset + load * (boat ? 16 : 26) + accel * 0.30, 45, 560);
  const surface = boat ? 'water' : biome;
  const texture: Record<Biome, readonly [number, number, number]> = {
    forest: [43, 0.8, 290],
    desert: [58, 1.18, 560],
    snow: [72, 0.56, 760],
    city: [88, 0.68, 830],
    water: [54, 1.25, 380],
  };
  const [baseTexture, intensity, filter] = texture[surface];
  const slip = boat ? Math.abs(steer) * 0.1 :
    surface === 'snow' ? Math.abs(steer) * 0.43 :
      surface === 'desert' ? Math.abs(steer) * 0.19 : Math.abs(steer) * 0.10;
  const slowdown = controls.brake ? 0.32 * Math.min(1, velocity / 36) : 0;
  return {
    engineHz,
    overtoneHz: clamp(sound.undercurrent + velocity * 0.82 +
      load * 8 + accel * 0.38, 42, 300),
    filterHz: clamp(260 + velocity * 7.7 + Math.max(0, load) * 310 +
      Math.max(0, accel) * 9 - (controls.brake ? 135 : 0), 180, 1550),
    engineGain: clamp(0.011 + (controls.throttle ? 0.0055 : 0) +
      Math.max(0, accel) * 0.00015 - (controls.brake ? 0.003 : 0), 0.004, 0.024),
    overtoneGain: clamp(0.0043 + (controls.throttle ? 0.003 : 0) +
      velocity * 0.000035, 0.003, 0.012),
    textureHz: clamp(baseTexture + velocity * (boat ? 1.3 : 2.7), 42, 420),
    textureGain: clamp((0.0015 + velocity * 0.000075) *
      intensity * (1 + slip + slowdown), 0, 0.018),
    textureFilterHz: clamp(filter + velocity * 6.0, 200, 1500),
  };
}
