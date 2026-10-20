import { describe, expect, it } from 'vitest';
import { RouteDirector, ROUTE_CHOICES } from './RouteDirector';
import { SPLIT_PERIOD } from '../world/SplitRoad';

describe('consequential two-route highway director', () => {
  it('commits to the physically chosen lane and does not flicker when steering', () => {
    const director = new RouteDirector();
    expect(director.step(610, -6.4)).toBeNull();
    expect(director.step(620, -6.4)).toEqual({ type: 'selected', side: 'left', splitIndex: 0 });
    expect(director.side).toBe('left');
    expect(director.step(700, 6.4)).toBeNull();
    expect(director.side).toBe('left');
  });
  it('completes exactly once and tracks both route choices', () => {
    const d = new RouteDirector();
    d.step(625, -6.4);
    expect(d.step(794, -6.4)).toEqual({ type: 'completed', side: 'left', splitIndex: 0 });
    expect(d.step(795, -6.4)).toBeNull();
    expect(d.leftCompletions).toBe(1);
    d.step(SPLIT_PERIOD + 625, 6.4);
    expect(d.step(SPLIT_PERIOD + 795, 6.4)).toEqual({ type: 'completed', side: 'right', splitIndex: 1 });
    expect(d.rightCompletions).toBe(1);
  });
  it('does not spawn a split choice inside water biome and can reset', () => {
    const d = new RouteDirector();
    expect(d.step(2 * SPLIT_PERIOD + 630, 6.4)).toBeNull();
    expect(d.side).toBeNull();
    d.step(620, 6.4);
    d.reset();
    expect(d.side).toBeNull();
    expect(d.leftCompletions + d.rightCompletions).toBe(0);
  });
  it('uses an explicit risk/reward distinction', () => {
    expect(ROUTE_CHOICES.right.score).toBeGreaterThan(ROUTE_CHOICES.left.score);
    expect(ROUTE_CHOICES.right.ammo).toBe('missile');
    expect(ROUTE_CHOICES.left.ammo).toBe('smoke');
  });
});
