/* ============================================================
   FEATURE: 3D GOLDEN RIBBON GIFT BOX & MINION CELEBRATION
   Gift box unboxing, minion cheerleader animations, golden pass.
   ============================================================ */
import { $ } from '../core/utils.js';
import { initAudioContext, getAudioContext } from '../core/audio.js';
import { pushModalHistory, popModalHistory, registerModalCloser } from './ModalsManager.js';

let giftBoxOpened = false;
let minionTunePlaying = false;
let fireworkAtCallback = null;

export function openGiftModal() {
  const modal = $('giftModal');
  if (!modal) return;
  pushModalHistory('gift');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

export function closeGiftModal(shouldPopHistory = true) {
  const modal = $('giftModal');
  if (!modal || !modal.classList.contains('is-open')) return false;
  if (shouldPopHistory) popModalHistory('gift');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  return true;
}

function playGiftChimes() {
  initAudioContext();
  const audioCtx = getAudioContext();
  if (!audioCtx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    }, idx * 80);
  });
}

function playMinionGiggle() {
  initAudioContext();
  const audioCtx = getAudioContext();
  if (!audioCtx) return;
  const pitches = [620, 840, 1120, 780, 1250, 980, 1420];
  pitches.forEach((freq, i) => {
    setTimeout(() => {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.06);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }, i * 55);
  });
}

export function playMinionBirthdayTune() {
  initAudioContext();
  const audioCtx = getAudioContext();
  if (!audioCtx || minionTunePlaying) return;
  minionTunePlaying = true;

  const tune = [
    { f: 523.25, d: 0.18, g: 0.04 },
    { f: 523.25, d: 0.18, g: 0.04 },
    { f: 587.33, d: 0.36, g: 0.06 },
    { f: 523.25, d: 0.36, g: 0.06 },
    { f: 698.46, d: 0.36, g: 0.06 },
    { f: 659.25, d: 0.65, g: 0.12 },

    { f: 523.25, d: 0.18, g: 0.04 },
    { f: 523.25, d: 0.18, g: 0.04 },
    { f: 587.33, d: 0.36, g: 0.06 },
    { f: 523.25, d: 0.36, g: 0.06 },
    { f: 783.99, d: 0.36, g: 0.06 },
    { f: 698.46, d: 0.65, g: 0.12 },

    { f: 523.25, d: 0.18, g: 0.04 },
    { f: 523.25, d: 0.18, g: 0.04 },
    { f: 1046.5, d: 0.36, g: 0.06 },
    { f: 880.00, d: 0.36, g: 0.06 },
    { f: 698.46, d: 0.36, g: 0.06 },
    { f: 659.25, d: 0.36, g: 0.06 },
    { f: 587.33, d: 0.55, g: 0.12 },

    { f: 932.33, d: 0.22, g: 0.04 },
    { f: 932.33, d: 0.22, g: 0.04 },
    { f: 880.00, d: 0.36, g: 0.06 },
    { f: 698.46, d: 0.36, g: 0.06 },
    { f: 783.99, d: 0.36, g: 0.06 },
    { f: 698.46, d: 0.80, g: 0.15 },
  ];

  let cumulativeTime = 0;
  tune.forEach((note, index) => {
    setTimeout(() => {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = index % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(note.f, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.d);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + note.d + 0.02);

      if (index === tune.length - 1) {
        setTimeout(() => { minionTunePlaying = false; }, 300);
      }
    }, cumulativeTime * 1000);
    cumulativeTime += note.d + note.g;
  });
}

function spawnGiftBurst() {
  const burstContainer = $('giftBurst');
  if (!burstContainer) return;
  burstContainer.innerHTML = '';
  const symbols = ['🦋', '✨', '💜', '🌟', '💖', '👑', '🎉', '🎈'];
  const count = 36;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'gift-burst-item';
    particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];

    const angle = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 160;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist - 40;
    const rot = (Math.random() - 0.5) * 360;
    const scale = 0.7 + Math.random() * 0.8;
    const dur = 1.2 + Math.random() * 0.8;

    particle.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      font-size: ${18 + Math.random() * 14}px;
      transform: translate(-50%, -50%) scale(0);
      pointer-events: none;
      transition: transform ${dur}s cubic-bezier(0.1, 0.9, 0.2, 1), opacity ${dur}s ease-out;
      opacity: 1;
      will-change: transform, opacity;
      filter: drop-shadow(0 0 8px rgba(192, 132, 252, 0.8));
    `;
    burstContainer.appendChild(particle);

    requestAnimationFrame(() => {
      particle.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${scale}) rotate(${rot}deg)`;
      particle.style.opacity = '0';
    });
  }

  if (fireworkAtCallback) {
    const rect = burstContainer.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    fireworkAtCallback(cx - 60, cy - 80);
    setTimeout(() => fireworkAtCallback(cx + 60, cy - 100), 200);
  }
}

function spawnBananaBurst() {
  const stage = $('minionStage');
  if (!stage) return;
  const emojis = ['🎉', '💜', '✨', '💖', '🌟', '🎂', '🎈'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('span');
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    p.style.cssText = `
      position:absolute;
      left:50%;
      top:50%;
      font-size:${16 + Math.random() * 16}px;
      pointer-events:none;
      z-index:99;
      transform:translate(-50%, -50%) scale(0.5);
      transition:all 1s cubic-bezier(0.15, 0.9, 0.25, 1);
      opacity:1;
      filter:drop-shadow(0 2px 6px rgba(0,0,0,0.2));
    `;
    stage.appendChild(p);

    const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.4;
    const dist = 60 + Math.random() * 80;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist - 30;
    const rot = (Math.random() - 0.5) * 360;

    requestAnimationFrame(() => {
      p.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(1.1) rotate(${rot}deg)`;
      p.style.opacity = '0';
    });

    setTimeout(() => p.remove(), 1100);
  }
}

export function triggerMinionCheer() {
  const stage = $('minionStage');
  if (stage) {
    stage.classList.remove('is-cheering');
    void stage.offsetWidth;
    stage.classList.add('is-cheering');
    setTimeout(() => stage.classList.remove('is-cheering'), 900);
  }
  playMinionGiggle();
  spawnBananaBurst();
  if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
}

export function replayGiftBox() {
  const giftBox = $('giftBox');
  if (!giftBox) return;
  giftBoxOpened = false;
  giftBox.classList.remove('is-opened');

  const tabMinion = $('tabMinionBtn');
  const tabPass = $('tabPassBtn');
  const viewMinion = $('viewMinion');
  const viewPass = $('viewPass');
  if (tabMinion && tabPass && viewMinion && viewPass) {
    tabMinion.classList.add('is-active');
    tabPass.classList.remove('is-active');
    viewMinion.classList.add('is-active');
    viewPass.classList.remove('is-active');
  }
}

export function setupGiftBox(options = {}) {
  fireworkAtCallback = options.fireworkAt;
  registerModalCloser('gift', () => closeGiftModal(false));

  const giftBox = $('giftBox');
  const closeBtn = $('giftCloseBtn');
  const backdrop = $('giftBackdrop');
  const modal = $('giftModal');
  if (!modal) return;

  if (closeBtn) closeBtn.addEventListener('click', () => closeGiftModal(true));
  if (backdrop) backdrop.addEventListener('click', () => closeGiftModal(true));

  window.addEventListener('keydown', (e) => {
    if (modal.classList.contains('is-open') && e.key === 'Escape') {
      closeGiftModal(true);
    }
  });

  let touchStartX = 0;
  let touchStartY = 0;
  modal.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });
  modal.addEventListener('touchend', (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (dx > 65 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        closeGiftModal(true);
      }
    }
  }, { passive: true });

  function unbox() {
    if (giftBoxOpened) return;
    giftBoxOpened = true;
    if (giftBox) giftBox.classList.add('is-opened');

    if (navigator.vibrate) navigator.vibrate([40, 60, 80]);

    playGiftChimes();
    spawnGiftBurst();

    setTimeout(() => {
      playMinionGiggle();
      spawnBananaBurst();
    }, 450);
  }

  if (giftBox) {
    giftBox.addEventListener('click', () => {
      if (giftBoxOpened) return;
      unbox();
    });

    let boxTouchY = 0;
    giftBox.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) boxTouchY = e.touches[0].clientY;
    }, { passive: true });

    giftBox.addEventListener('touchend', (e) => {
      if (giftBoxOpened) return;
      if (e.changedTouches && e.changedTouches[0]) {
        const diffY = boxTouchY - e.changedTouches[0].clientY;
        if (diffY > 30 || Math.abs(boxTouchY - e.changedTouches[0].clientY) < 15) {
          unbox();
        }
      }
    }, { passive: true });
  }

  const minionStage = $('minionStage');
  if (minionStage) {
    minionStage.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerMinionCheer();
    });
    minionStage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerMinionCheer();
      }
    });
  }

  const tabMinion = $('tabMinionBtn');
  const tabPass = $('tabPassBtn');
  const viewMinion = $('viewMinion');
  const viewPass = $('viewPass');

  if (tabMinion && tabPass && viewMinion && viewPass) {
    tabMinion.addEventListener('click', (e) => {
      e.stopPropagation();
      tabMinion.classList.add('is-active');
      tabPass.classList.remove('is-active');
      viewMinion.classList.add('is-active');
      viewPass.classList.remove('is-active');
    });

    tabPass.addEventListener('click', (e) => {
      e.stopPropagation();
      tabPass.classList.add('is-active');
      tabMinion.classList.remove('is-active');
      viewPass.classList.add('is-active');
      viewMinion.classList.remove('is-active');
    });
  }
}
