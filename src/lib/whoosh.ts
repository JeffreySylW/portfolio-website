// A short, quiet, breathy whoosh for hovering a planet: white noise through a band-pass filter whose
// centre sweeps up and settles back, under a soft swell. Made in code, so there is no audio file to load.

export const WHOOSH = {
  /** Seconds. */
  duration: 0.8,
  attack: 0.12,
  /** Peak gain (0..1). Kept low: it is a texture, not a notification. */
  peak: 0.11,
  /** Filter centre in Hz at the start, the top of the sweep (35% in) and the end. */
  sweep: [420, 2600, 900] as const,
  q: 1.6,
};

/** Gain at time t: a quick smooth swell, then a long exponential-looking tail to silence. */
export function whooshGain(t: number): number {
  const { duration, attack, peak } = WHOOSH;
  if (t <= 0 || t >= duration) return 0;
  if (t <= attack) return peak * Math.sin((t / attack) * (Math.PI / 2)) ** 2;
  const k = (t - attack) / (duration - attack);
  return peak * (1 - k) ** 3;
}

/** Filter centre at time t (log-linear between the three sweep points). */
export function whooshFrequency(t: number): number {
  const [a, b, c] = WHOOSH.sweep;
  const mid = WHOOSH.duration * 0.35;
  const lerpLog = (x: number, y: number, k: number) => Math.exp(Math.log(x) + (Math.log(y) - Math.log(x)) * k);
  if (t <= mid) return lerpLog(a, b, Math.max(0, t) / mid);
  return lerpLog(b, c, Math.min(1, (t - mid) / (WHOOSH.duration - mid)));
}

let noise: AudioBuffer | null = null;

/** Plays one whoosh on `ctx`, panned -1..1 (where the planet sits on the map). */
export function playWhoosh(ctx: AudioContext, pan = 0): void {
  const { duration, q } = WHOOSH;
  if (!noise || noise.sampleRate !== ctx.sampleRate) {
    noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = ctx.currentTime + 0.01;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = q;
  const gain = ctx.createGain();
  const steps = 24;
  const freqs = new Float32Array(steps + 1), gains = new Float32Array(steps + 1);
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * duration;
    freqs[i] = whooshFrequency(t);
    gains[i] = whooshGain(t);
  }
  filter.frequency.setValueCurveAtTime(freqs, t0, duration);
  gain.gain.setValueCurveAtTime(gains, t0, duration);
  let out: AudioNode = gain;
  if (typeof ctx.createStereoPanner === "function") {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    gain.connect(p);
    out = p;
  }
  src.connect(filter).connect(gain);
  out.connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}
