/**
 * Short, deterministic camera recoil driven by fixed-step simulation time.
 * Visual-only offsets never modify world coordinates, collision or aiming.
 */
export class CameraImpact {
  private intensity = 0;
  private phase = 0;

  hit(strength = 1): void {
    if (!Number.isFinite(strength) || strength <= 0) return;
    this.intensity = Math.min(1.5, this.intensity + Math.min(1, strength));
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

  get lift(): number { return Math.sin(this.phase) * this.intensity * 0.20; }
  get roll(): number { return Math.cos(this.phase) * this.intensity * 0.012; }
  get active(): boolean { return this.intensity > 0; }

  reset(): void { this.intensity = 0; this.phase = 0; }
}
