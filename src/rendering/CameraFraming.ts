/** Production composition constants chosen against 648×680 in-game captures. */
export const CAMERA_FRAME = {
  height: 23,
  positionZ: 27,
  targetZ: -5,
  baseFov: 52,
  maxFov: 56,
} as const;

export function cinematicFov(speed: number, reducedMotion: boolean): number {
  if (reducedMotion) return CAMERA_FRAME.baseFov;
  return CAMERA_FRAME.baseFov + Math.min(
    CAMERA_FRAME.maxFov - CAMERA_FRAME.baseFov,
    Math.max(0, speed - 30) * 0.14,
  );
}

/** Predicts vertical position (0 top to 1 bottom) for camera-space objects. */
export function screenVerticalAt(worldZ: number, fov = CAMERA_FRAME.baseFov): number {
  const camera = CAMERA_FRAME;
  const centerAngle = Math.atan2(camera.height, camera.positionZ - camera.targetZ);
  const subjectAngle = Math.atan2(camera.height, camera.positionZ - worldZ);
  const deviation = subjectAngle - centerAngle;
  return 0.5 + Math.tan(deviation) / (2 * Math.tan(fov * Math.PI / 360));
}

/** A visible road width at the interceptor, preserving three-lane readability. */
export function nearRoadScreenFraction(aspect: number, playerZ: number): number {
  const d = Math.hypot(CAMERA_FRAME.height, CAMERA_FRAME.positionZ - playerZ);
  const halfVertical = Math.tan(CAMERA_FRAME.baseFov * Math.PI / 360);
  return 20 / (2 * d * halfVertical * aspect);
}
