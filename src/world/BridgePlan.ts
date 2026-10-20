/** Seamless bridge spans, repeated across the five-biome campaign. */
export const BRIDGE_CYCLE = 5000;
export const BRIDGE_SPANS = [
  { start: 1310, end: 1445, type: 'canyon', depth: 3.8 },
  { start: 3270, end: 3395, type: 'viaduct', depth: 2.8 },
] as const;
export type BridgeType = typeof BRIDGE_SPANS[number]['type'];

export function bridgeZone(distance: number): typeof BRIDGE_SPANS[number] | null {
  const phase = ((distance % BRIDGE_CYCLE) + BRIDGE_CYCLE) % BRIDGE_CYCLE;
  return BRIDGE_SPANS.find(s => phase >= s.start && phase <= s.end) ?? null;
}

function ease(t: number): number {
  const v = Math.max(0, Math.min(1, t));
  return v * v * (3 - 2 * v);
}

/** Ground beneath a bridge descends continuously; road deck stays at grade. */
export function groundHeightAt(distance: number): number {
  const zone = bridgeZone(distance);
  if (!zone) return -0.22;
  const phase = ((distance % BRIDGE_CYCLE) + BRIDGE_CYCLE) % BRIDGE_CYCLE;
  const ramp = 22;
  const depth = zone.depth * Math.min(
    ease((phase - zone.start) / ramp),
    ease((zone.end - phase) / ramp),
  );
  return -0.22 - depth;
}

export function bridgeAhead(distance: number): { type: BridgeType; meters: number; start: number } | null {
  const cycle = Math.floor(Math.max(0, distance) / BRIDGE_CYCLE);
  for (const zone of BRIDGE_SPANS) {
    const start = cycle * BRIDGE_CYCLE + zone.start;
    const meters = start - distance;
    if (meters > 0 && meters <= 95) return { type: zone.type, meters, start };
  }
  return null;
}
