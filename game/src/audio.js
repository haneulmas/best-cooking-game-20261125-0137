// Sizzle & Serve — Warung Rush: all sound is synthesized with WebAudio.
// One clear job: tiny bleeps and sizzles, no audio files, no network.
// Every sound is built from oscillators and filtered noise at call time.

let ctx = null;
let muted = false;

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

// Resume the context on the first user gesture; browsers block it before that.
export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

function tone(freq, dur, type = 'sine', gain = 0.12, slideTo = null) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noiseBurst(dur, filterFreq, gain = 0.1) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(g).connect(c.destination);
  src.start(t);
}

export const sfx = {
  // A soft pop when an ingredient lands on the plate.
  chop() {
    tone(520, 0.07, 'triangle', 0.14, 340);
    noiseBurst(0.05, 2400, 0.06);
  },
  // The pan hisses while a dish cooks.
  sizzle() {
    noiseBurst(0.5, 5200, 0.05);
  },
  // Two-note bell when a dish finishes cooking.
  ready() {
    tone(880, 0.12, 'sine', 0.14);
    setTimeout(() => tone(1318, 0.18, 'sine', 0.14), 110);
  },
  // A happy three-note chime when a customer is served.
  serve() {
    tone(659, 0.1, 'triangle', 0.14);
    setTimeout(() => tone(784, 0.1, 'triangle', 0.14), 90);
    setTimeout(() => tone(1046, 0.2, 'triangle', 0.16), 180);
  },
  // A low buzz for a wrong move.
  error() {
    tone(180, 0.16, 'sawtooth', 0.08, 120);
  },
  // A tick when an order ticket arrives.
  ticket() {
    tone(1200, 0.06, 'square', 0.05, 900);
  },
  // A short fanfare at the end of the shift.
  shiftEnd() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.14), i * 130));
  },
};
