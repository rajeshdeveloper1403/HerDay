/* ============================================================
   FEATURE: BIRTHDAY SONG PLAYER ("Happy Birthday")
   Plays 30s to 1m20s chorus loop with animated equalizer bars.
   ============================================================ */
import { $ } from '../core/utils.js';
import { initAudioContext, getAudioContext } from '../core/audio.js';

let bdayAudio = null;
let isMusicBoxPlaying = false;
let audioListenersAttached = false;

export function handleUserActivation() {
  if (!isMusicBoxPlaying) {
    startMusicBox();
  }
}

export function attachAutoPlayListeners() {
  if (audioListenersAttached) return;
  audioListenersAttached = true;
  window.addEventListener('pointerdown', handleUserActivation, { passive: true });
  window.addEventListener('touchstart', handleUserActivation, { passive: true });
  window.addEventListener('touchend', handleUserActivation, { passive: true });
  window.addEventListener('click', handleUserActivation, { passive: true });
  window.addEventListener('keydown', handleUserActivation, { passive: true });
}

export function detachAutoPlayListeners() {
  if (!audioListenersAttached) return;
  audioListenersAttached = false;
  window.removeEventListener('pointerdown', handleUserActivation);
  window.removeEventListener('touchstart', handleUserActivation);
  window.removeEventListener('touchend', handleUserActivation);
  window.removeEventListener('click', handleUserActivation);
  window.removeEventListener('keydown', handleUserActivation);
}

function initAudioElement() {
  if (!bdayAudio) {
    bdayAudio = new Audio('./happy-birthday.mp3');
    bdayAudio.loop = true;
    bdayAudio.preload = 'auto';

    const setChorusTime = () => {
      if (bdayAudio.duration > 65 && bdayAudio.currentTime < 30) {
        bdayAudio.currentTime = 30;
      }
    };
    bdayAudio.addEventListener('loadedmetadata', setChorusTime);
    bdayAudio.addEventListener('canplay', setChorusTime);

    bdayAudio.addEventListener('timeupdate', () => {
      if (bdayAudio.duration > 65) {
        if (bdayAudio.currentTime < 30) {
          bdayAudio.currentTime = 30;
        } else if (bdayAudio.currentTime >= 80) {
          bdayAudio.currentTime = 30;
        }
      }
    });

    bdayAudio.addEventListener('ended', () => {
      if (bdayAudio.duration > 65) bdayAudio.currentTime = 30;
      bdayAudio.play().catch(() => {});
    });

    bdayAudio.addEventListener('play', () => {
      isMusicBoxPlaying = true;
      const btn = $('musicBoxBtn');
      if (btn) btn.classList.add('is-playing');
      detachAutoPlayListeners();
    });

    bdayAudio.addEventListener('pause', () => {
      isMusicBoxPlaying = false;
      const btn = $('musicBoxBtn');
      if (btn) btn.classList.remove('is-playing');
    });
  }
}

export function startMusicBox() {
  initAudioElement();
  initAudioContext();
  if (!bdayAudio) return;

  if (bdayAudio.readyState >= 1 && bdayAudio.duration > 65 && bdayAudio.currentTime < 30) {
    bdayAudio.currentTime = 30;
  }

  const p = bdayAudio.play();
  if (p !== undefined) {
    p.then(() => {
      isMusicBoxPlaying = true;
      const btn = $('musicBoxBtn');
      if (btn) btn.classList.add('is-playing');
      detachAutoPlayListeners();
    }).catch(() => {
      attachAutoPlayListeners();
    });
  }
}

export function stopMusicBox() {
  if (bdayAudio) {
    bdayAudio.pause();
  }
  isMusicBoxPlaying = false;
  const btn = $('musicBoxBtn');
  if (btn) btn.classList.remove('is-playing');
}

export function toggleMusicBox() {
  if (isMusicBoxPlaying) stopMusicBox();
  else startMusicBox();
}

export function playMagicalChime() {
  initAudioContext();
  const ctx = getAudioContext();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.50];
  const now = ctx.currentTime;
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
    gain.gain.setValueAtTime(0, now + idx * 0.08);
    gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.65);
  });
}

export function setupMusicBox() {
  const btn = $('musicBoxBtn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMusicBox();
    });
  }
}
