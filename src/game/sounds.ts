let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

interface BlipOpts {
  freq: number;
  dur?: number;
  type?: OscillatorType;
  vol?: number;
  slide?: number;
}

export function blip({ freq, dur = 0.12, type = "square", vol = 0.18, slide = 0 }: BlipOpts) {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), c.currentTime + dur);
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur + 0.02);
}

export function thump() {
  blip({ freq: 90, dur: 0.18, type: "sine", vol: 0.35, slide: -50 });
  blip({ freq: 240, dur: 0.08, type: "square", vol: 0.12, slide: -150 });
}

export function boom() {
  const c = getCtx();
  if (!c) return;
  const bufferSize = 0.4 * c.sampleRate;
  const noise = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  const src = c.createBufferSource();
  src.buffer = noise;
  const g = c.createGain();
  g.gain.setValueAtTime(0.4, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 500;
  src.connect(filter).connect(g).connect(c.destination);
  src.start();
}

export function squeak() {
  blip({ freq: 1400, dur: 0.18, type: "sine", vol: 0.25, slide: -600 });
}

export function flame() {
  const c = getCtx();
  if (!c) return;
  const bufferSize = 0.25 * c.sampleRate;
  const noise = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const src = c.createBufferSource();
  src.buffer = noise;
  const g = c.createGain();
  g.gain.setValueAtTime(0.18, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1200;
  src.connect(filter).connect(g).connect(c.destination);
  src.start();
}

export function ding() {
  blip({ freq: 880, dur: 0.18, type: "triangle", vol: 0.2, slide: 220 });
}

export function hurt() {
  blip({ freq: 180, dur: 0.18, type: "sawtooth", vol: 0.25, slide: -80 });
}
