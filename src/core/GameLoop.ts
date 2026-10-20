/** Fixed 60 Hz game simulation with a bounded catch-up accumulator. */
export class GameLoop {
  private readonly fixedStep = 1 / 60;
  private previous = 0;
  private accumulator = 0;
  private running = false;

  constructor(private readonly update: (dt: number) => void, private readonly render: () => void) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.previous = performance.now();
    requestAnimationFrame(this.tick);
  }

  private tick = (timestamp: number): void => {
    if (!this.running) return;
    const elapsed = Math.min((timestamp - this.previous) / 1000, 0.1);
    this.previous = timestamp;
    this.accumulator += elapsed;
    let steps = 0;
    while (this.accumulator >= this.fixedStep && steps < 6) {
      this.update(this.fixedStep);
      this.accumulator -= this.fixedStep;
      steps++;
    }
    if (steps === 6) this.accumulator = 0;
    this.render();
    requestAnimationFrame(this.tick);
  };

  stop(): void { this.running = false; }
}
