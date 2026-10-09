export type Vec3 = [number, number, number];

const DEFAULT_SPEED = 0.05;

export function bodyPosition(
  body: { orbitRadius: number; startAngleDeg: number },
  timeSec: number,
  speed = DEFAULT_SPEED
): Vec3 {
  const angle = (body.startAngleDeg * Math.PI) / 180 + timeSec * speed;
  return [Math.cos(angle) * body.orbitRadius, 0, Math.sin(angle) * body.orbitRadius];
}

export function cameraTargetFor(bodyPos: Vec3, distance = 4): { position: Vec3; lookAt: Vec3 } {
  const [x, y, z] = bodyPos;
  const len = Math.hypot(x, z) || 1;
  // Stand off from the body toward the outside of the orbit, slightly above it.
  const position: Vec3 = [x + (x / len) * distance, y + distance * 0.35, z + (z / len) * distance];
  return { position, lookAt: [x, y, z] };
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function lerpVec(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function flightDurationMs(from: Vec3, to: Vec3): number {
  const dist = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  return Math.min(1400, Math.max(600, 600 + dist * 60));
}

/** Orbit angle (radians) of a body at time t; same maths as bodyPosition. */
export function orbitAngle(body: { startAngleDeg: number }, timeSec: number, speed = DEFAULT_SPEED): number {
  return (body.startAngleDeg * Math.PI) / 180 + timeSec * speed;
}

/** Rotate v about the Y axis by `angle` radians, in the direction orbitAngle increases. */
export function rotateY(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c];
}
