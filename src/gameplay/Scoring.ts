/** Civilian penalties and extra-life milestones; independent of rendering. */
export class Scoring {
  score = 0;
  private lockout = 0;
  private nextLife = 10000;
  civilianCasualties = 0;

  reset(): void {
    this.score = 0;
    this.lockout = 0;
    this.nextLife = 10000;
    this.civilianCasualties = 0;
  }

  tick(dt: number, travelPoints: number): void {
    this.lockout = Math.max(0, this.lockout - dt);
    if (this.lockout === 0) this.score += travelPoints;
  }

  get lockoutRemaining(): number { return this.lockout; }

  enemyDestroyed(points: number): number {
    if (this.lockout > 0) return 0;
    this.score += points;
    return points;
  }

  civilianDestroyed(): void {
    this.civilianCasualties++;
    this.lockout = 5;
  }

  /** Return extra lives earned as score crosses new milestones. */
  checkExtraLives(): number {
    let earned = 0;
    while (this.score >= this.nextLife) {
      this.nextLife += 10000;
      earned++;
    }
    return earned;
  }
}
