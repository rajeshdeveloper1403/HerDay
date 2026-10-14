/* ============================================================
   FEATURE: BACKGROUND MUSIC PLAYER
   Plays "The Love Bug Has Bitten" once, then loops Happy Birthday.
   ============================================================ */
import { $ } from '../core/utils.js';
import { initAudioContext, getAudioContext } from '../core/audio.js';

const INTRO_SRC = './The-Love-Bug-Has-Bitten.mp3';
const LOOP_SRC = './happy-birthday.mp3';

let bdayAudio = null;
let isMusicBoxPlaying = false;
let audioListenersAttached = false;
let onIntroTrack = true;
let endedBound = null;

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

function switchToLoopTrack() {
  if (!bdayAudio || !onIntroTrack) return;
  onIntroTrack = false;
  if (endedBound) {
    bdayAudio.removeEventListener('ended', endedBound);
    endedBound = null;
  }
  const btn = $('musicBoxBtn');
  bdayAudio.loop = true;
  bdayAudio.src = LOOP_SRC;
  bdayAudio.load();
  const p = bdayAudio.play();
  if (p && typeof p.then === 'function') {
    p.then(() => {
      isMusicBoxPlaying = true;
      if (btn) btn.classList.add('is-playing');
    }).catch(() => {});
  }
}

function initAudioElement() {
  if (!bdayAudio) {
    onIntroTrack = true;
    bdayAudio = new Audio(INTRO_SRC);
    bdayAudio.loop = false;
    bdayAudio.preload = 'auto';

    endedBound = () => switchToLoopTrack();
    bdayAudio.addEventListener('ended', endedBound);

    bdayAudio.addEventListener('play', () => {
      isMusicBoxPlaying = true;
      const btn = $('musicBoxBtn');
      if (btn) btn.classList.add('is-playing');
      detachAutoPlayListeners();
    });

    bdayAudio.addEventListener('pause', () => {
      // Don't mark stopped when swapping tracks briefly
      if (bdayAudio && !bdayAudio.ended && bdayAudio.paused) {
        isMusicBoxPlaying = false;
        const btn = $('musicBoxBtn');
        if (btn) btn.classList.remove('is-playing');
      }
    });
  }
}

export function startMusicBox() {
  initAudioElement();
  initAudioContext();
  if (!bdayAudio) return;

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
