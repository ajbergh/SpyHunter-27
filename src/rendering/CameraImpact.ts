/**
 * Short, deterministic camera recoil driven by fixed-step simulation time.
 * Visual-only offsets never modify world coordinates, collision or aiming.
 */
export class CameraImpact {
  private intensity = 0;
  private phase = 0;
  private contactSide = 0;

  hit(strength = 1, side = 0): void {
    if (!Number.isFinite(strength) || strength <= 0) return;
    this.intensity = Math.min(1.5, this.intensity + Math.min(1, strength));
    this.contactSide = Number.isFinite(side) ? Math.max(-1, Math.min(1, side)) : 0;
    this.phase = 0.9;
  }

  step(dt: number, reducedMotion: boolean): void {
    if (reducedMotion) { this.reset(); return; }
    if (!Number.isFinite(dt) || dt <= 0) return;
    const duration = Math.min(dt, 0.1);
    this.intensity *= Math.exp(-9 * duration);
    if (this.intensity < 0.001) this.intensity = 0;
    this.phase += duration * 19;
  }

  get lift(): number { return this.intensity === 0 ? 0 : Math.sin(this.phase) * this.intensity * 0.20; }
  get roll(): number { return this.intensity === 0 ? 0 : this.intensity * (Math.cos(this.phase) * 0.005 + this.contactSide * 0.006); }
  get active(): boolean { return this.intensity > 0; }

  reset(): void { this.intensity = 0; this.phase = 0; this.contactSide = 0; }
}
