/* ============================================================
   AUDIO CORE — Web Audio Context, Synthetic Cues & Sfx
   ============================================================ */
import { isRecord } from './utils.js';

let audioCtx = null;

export function getAudioContext() {
  return audioCtx;
}

export function initAudioContext() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

window.addEventListener('pointerdown', () => { initAudioContext(); }, { once: true });
window.addEventListener('keydown', () => { initAudioContext(); }, { once: true });

/* Recorder cue log for reproducible soundtrack sync */
if (isRecord) window.bdayCues = [];
let recT0 = 0;

export function setRecordT0(t) {
  recT0 = t;
}

export function cue(name) {
  if (isRecord && recT0) {
    window.bdayCues.push({ cue: name, t: (performance.now() - recT0) / 1000 });
  }
}

/* Celestial Star Chimes for constellation connections */
export function playStarChime(pitchIdx) {
  initAudioContext();
  if (!audioCtx) return;
  const freqs = [369.99, 415.30, 466.16, 554.37, 622.25, 739.99, 830.61];
  const freq = freqs[pitchIdx % freqs.length];
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.75);
}
