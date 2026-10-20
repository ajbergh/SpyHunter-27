/** Gameplay-only scoring rules, timed combos, civilian penalties and extra lives. */
export class Scoring {
  score = 0;
  civilianCasualties = 0;
  hostileEliminations = 0;
  bestCombo = 1;
  private lockout = 0;
  private nextLife = 10000;
  private chain = 0;
  private chainTimer = 0;

  reset(): void {
    this.score = 0;
    this.civilianCasualties = 0;
    this.hostileEliminations = 0;
    this.bestCombo = 1;
    this.lockout = 0;
    this.nextLife = 10000;
    this.chain = 0;
    this.chainTimer = 0;
  }

  tick(dt: number, travelPoints: number): void {
    this.lockout = Math.max(0, this.lockout - dt);
    if (this.lockout === 0) this.score += travelPoints;
    if (this.chainTimer > 0) {
      this.chainTimer = Math.max(0, this.chainTimer - dt);
      if (this.chainTimer === 0) this.resetCombo();
    }
  }

  get lockoutRemaining(): number { return this.lockout; }
  get comboMultiplier(): number { return this.chain ? Math.min(4, this.chain) : 1; }
  get comboRemaining(): number { return this.chainTimer; }

  enemyDestroyed(points: number): number {
    if (this.lockout > 0) return 0;
    this.chain = this.chainTimer > 0 ? this.chain + 1 : 1;
    this.chainTimer = 5;
    const multiplier = this.comboMultiplier;
    this.bestCombo = Math.max(this.bestCombo, multiplier);
    this.hostileEliminations++;
    const earned = points * multiplier;
    this.score += earned;
    return earned;
  }

  bonus(points: number): number {
    if (this.lockout > 0) return 0;
    this.score += points;
    return points;
  }

  civilianDestroyed(): void {
    this.civilianCasualties++;
    this.lockout = 5;
    this.resetCombo();
  }

  resetCombo(): void {
    this.chain = 0;
    this.chainTimer = 0;
  }

  checkExtraLives(): number {
    let earned = 0;
    while (this.score >= this.nextLife) {
      this.nextLife += 10000;
      earned++;
    }
    return earned;
  }
}
