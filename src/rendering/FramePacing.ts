const WINDOW = 120;

/** Bounded, allocation-free frame interval recorder for the optional overlay.
 * Measures wall-clock render intervals, not GPU execution time. Long inactive
 * tab gaps are excluded; individual interval samples are otherwise preserved.
 */
export class FramePacing {
  private readonly history = new Float32Array(WINDOW);
  private readonly scratch = new Float32Array(WINDOW);
  private cursor = 0;
  private count = 0;
  private previous = 0;

  sample(timestampMs: number): void {
    if (!Number.isFinite(timestampMs) || timestampMs <= 0) return;
    if (this.previous > 0 && timestampMs > this.previous) {
      const interval = timestampMs - this.previous;
      // A backgrounded tab can sleep for seconds; it is not a rendering frame.
      if (interval <= 500) {
        this.history[this.cursor] = interval;
        this.cursor = (this.cursor + 1) % WINDOW;
        this.count = Math.min(WINDOW, this.count + 1);
      }
    }
    this.previous = timestampMs;
  }

  get samples(): number { return this.count; }
  get p95Ms(): number {
    if (this.count === 0) return 0;
    this.scratch.fill(Number.POSITIVE_INFINITY);
    for (let i = 0; i < this.count; i++) this.scratch[i] = this.history[i];
    // The unused entries sort after the live samples, keeping the
    // percentile correct even before the 120-frame window fills.
    this.scratch.sort();
    return this.scratch[Math.ceil(this.count * 0.95) - 1];
  }

  reset(): void {
    this.cursor = 0;
    this.count = 0;
    this.previous = 0;
    this.history.fill(0);
    this.scratch.fill(0);
  }
}
