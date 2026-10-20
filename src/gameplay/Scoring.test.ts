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
});
