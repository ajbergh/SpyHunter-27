export interface HeadlampFactors {
  readonly left: number;
  readonly right: number;
}

/**
 * Damage reduces the struck headlamp without changing gameplay visibility or
 * adding point lights. The opposite lamp remains at full brightness.
 * A centered collision dims both to the same bounded level.
 */
export function damagedHeadlampFactors(stage: number, side: number): HeadlampFactors {
  const level = Number.isFinite(stage) ?
    Math.max(0, Math.min(3, Math.floor(stage))) : 0;
  const intensity = [1, 0.78, 0.46, 0.18][level];
  if (level === 0) return { left: 1, right: 1 };
  const direction = Number.isFinite(side) ? Math.sign(side) : 0;
  return {
    left: direction <= 0 ? intensity : 1,
    right: direction >= 0 ? intensity : 1,
  };
}
