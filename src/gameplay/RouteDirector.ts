import { biomeAt } from '../world/WorldPlan';
import { SPLIT_END, SPLIT_PERIOD, SPLIT_START } from '../world/SplitRoad';

export type RouteSide = 'left' | 'right';
export type RouteEvent =
  | { type: 'selected'; side: RouteSide; splitIndex: number }
  | { type: 'completed'; side: RouteSide; splitIndex: number };

export const ROUTE_CHOICES = {
  left: { label: 'SHADOW BYPASS', risk: 'STEALTH', score: 150, ammo: 'smoke' },
  right: { label: 'PURSUIT ROUTE', risk: 'ASSAULT', score: 400, ammo: 'missile' },
} as const;

/**
 * Fixed-distance fork director. The entry decision is made after the divider
 * is fully open, remains committed through the fork, and exits at the merge.
 * The player still drives/steers; no rail or teleport between branches.
 */
export class RouteDirector {
  private activeIndex = -1;
  private selected: RouteSide | null = null;
  leftCompletions = 0;
  rightCompletions = 0;

  get side(): RouteSide | null { return this.selected; }

  reset(): void {
    this.activeIndex = -1;
    this.selected = null;
    this.leftCompletions = 0;
    this.rightCompletions = 0;
  }

  step(distance: number, x: number): RouteEvent | null {
    const splitIndex = Math.floor(Math.max(0, distance) / SPLIT_PERIOD);
    const start = splitIndex * SPLIT_PERIOD + SPLIT_START;
    const local = distance - start;
    // Never route an aquatic section through the road-only fork system.
    if (biomeAt(start) === 'water') {
      this.activeIndex = -1;
      this.selected = null;
      return null;
    }

    if (this.activeIndex !== splitIndex) {
      this.activeIndex = splitIndex;
      this.selected = null;
    }
    if (local >= 70 && local < SPLIT_END - SPLIT_START && this.selected === null) {
      this.selected = x < 0 ? 'left' : 'right';
      return { type: 'selected', side: this.selected, splitIndex };
    }
    if (local >= SPLIT_END - SPLIT_START && this.selected !== null) {
      const side = this.selected;
      this.selected = null;
      // Prevent duplicate completion events on successive fixed steps.
      this.activeIndex = -1;
      if (side === 'left') this.leftCompletions++;
      else this.rightCompletions++;
      return { type: 'completed', side, splitIndex };
    }
    return null;
  }
}
