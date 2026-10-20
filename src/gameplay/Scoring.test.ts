import { describe, it, expect } from 'vitest';
import { Scoring } from './Scoring';

describe('civilian penalty and scoring', () => {
  it('blocks travel and enemy scoring for five seconds', () => {
    const s = new Scoring();
    s.tick(1, 50);
    expect(s.score).toBe(50);
    s.civilianDestroyed();
    expect(s.civilianCasualties).toBe(1);
    s.tick(2, 200);
    expect(s.enemyDestroyed(250)).toBe(0);
    expect(s.score).toBe(50);
    s.tick(3, 100);
    expect(s.lockoutRemaining).toBe(0);
    expect(s.enemyDestroyed(250)).toBe(250);
    expect(s.score).toBe(400);
  });
  it('does not repeatedly grant extra lives at same threshold', () => {
    const s = new Scoring();
    s.enemyDestroyed(20050);
    expect(s.checkExtraLives()).toBe(2);
    expect(s.checkExtraLives()).toBe(0);
    s.reset();
    expect(s.score).toBe(0);
    expect(s.checkExtraLives()).toBe(0);
  });
  it('builds a timed x1–x4 combo and expires without a late bonus', () => {
    const s = new Scoring();
    expect(s.enemyDestroyed(250)).toBe(250);
    expect(s.enemyDestroyed(250)).toBe(500);
    expect(s.enemyDestroyed(250)).toBe(750);
    expect(s.enemyDestroyed(250)).toBe(1000);
    expect(s.enemyDestroyed(250)).toBe(1000);
    expect(s.bestCombo).toBe(4);
    s.tick(5.1, 0);
    expect(s.comboMultiplier).toBe(1);
    expect(s.enemyDestroyed(250)).toBe(250);
  });
  it('resets the chain on civilian casualties and player damage', () => {
    const s = new Scoring();
    s.enemyDestroyed(250);
    s.enemyDestroyed(250);
    s.resetCombo();
    expect(s.comboMultiplier).toBe(1);
    s.enemyDestroyed(250);
    s.civilianDestroyed();
    expect(s.comboMultiplier).toBe(1);
    expect(s.enemyDestroyed(250)).toBe(0);
  });
  it('awards truck bonuses without changing elimination counts or combos', () => {
    const s = new Scoring();
    expect(s.bonus(500)).toBe(500);
    expect(s.hostileEliminations).toBe(0);
    expect(s.comboMultiplier).toBe(1);
  });
});
