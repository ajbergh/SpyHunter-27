/** Purely visual, fixed-step interceptor chassis loading. This never updates
 * game coordinates, hitboxes, contact friction or propulsion. Three independent
 * critically damped springs turn control forces into subtle body motion.
 */
export class SuspensionDynamics {
  private pitchValue = 0;
  private pitchVelocity = 0;
  private rollValue = 0;
  private rollVelocity = 0;
  private heaveValue = 0;
  private heaveVelocity = 0;

  get pitch(): number { return this.pitchValue; }
  get roll(): number { return this.rollValue; }
  get heave(): number { return this.heaveValue; }

  step(dt: number, acceleration: number, steering: number,
    braking: boolean, speed: number, reducedMotion = false): void {
    if (reducedMotion) { this.reset(); return; }
    if (!Number.isFinite(dt) || dt <= 0) return;
    const frame = Math.min(dt, 0.05);
    const accel = Number.isFinite(acceleration)
      ? Math.max(-1, Math.min(1, acceleration / 28)) : 0;
    const steer = Number.isFinite(steering)
      ? Math.max(-1, Math.min(1, steering)) : 0;
    const velocity = Number.isFinite(speed) ? Math.max(0, speed) : 0;

    // Positive pitch loads rear suspension under throttle; braking dives
    // slightly at the nose. Lean rises with steering and actual road speed.
    const targetPitch = Math.max(-0.061, Math.min(0.046,
      accel * 0.036 - (braking ? 0.019 : 0)));
    const targetRoll = -steer * 0.049 * Math.min(1, velocity / 45);
    const targetHeave = -Math.min(0.028,
      Math.abs(accel) * 0.014 + Math.abs(steer) * 0.008);
    const omega = 11;
    const damped = (position: number, velocityNow: number, target: number) => {
      const accelerationNow = omega * omega * (target - position) -
        2 * omega * velocityNow;
      const nextVelocity = velocityNow + accelerationNow * frame;
      return [position + nextVelocity * frame, nextVelocity] as const;
    };
    [this.pitchValue, this.pitchVelocity] =
      damped(this.pitchValue, this.pitchVelocity, targetPitch);
    [this.rollValue, this.rollVelocity] =
      damped(this.rollValue, this.rollVelocity, targetRoll);
    [this.heaveValue, this.heaveVelocity] =
      damped(this.heaveValue, this.heaveVelocity, targetHeave);
    this.pitchValue = Math.max(-0.065, Math.min(0.05, this.pitchValue));
    this.rollValue = Math.max(-0.052, Math.min(0.052, this.rollValue));
    this.heaveValue = Math.max(-0.032, Math.min(0.006, this.heaveValue));
  }

  reset(): void {
    this.pitchValue = this.pitchVelocity = 0;
    this.rollValue = this.rollVelocity = 0;
    this.heaveValue = this.heaveVelocity = 0;
  }
}
