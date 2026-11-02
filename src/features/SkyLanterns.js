/* ============================================================
   FEATURE: FLOATING SKY LANTERNS SYSTEM
   Wish input, preset tags, rising illuminated lanterns with physics.
   ============================================================ */
import gsap from 'gsap';
import { $, rand } from '../core/utils.js';
import { initAudioContext, getAudioContext } from '../core/audio.js';
import { pushModalHistory, popModalHistory, registerModalCloser } from './ModalsManager.js';

let selectedLanternWish = '💜 Bright Smiles & Sweet Dreams';
let createFireworkBurstCallback = null;

export function openLanternModal() {
  const modal = $('lanternModal');
  if (!modal) return;
  pushModalHistory('lantern');
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('is-open');
  const input = $('lanternCustomInput');
  if (input) input.value = '';
  updateLanternTagPreview(selectedLanternWish);
}

export function closeLanternModal(shouldPopHistory = true) {
  const modal = $('lanternModal');
  if (!modal) return false;
  if (!modal.classList.contains('is-open')) return false;
  if (shouldPopHistory) popModalHistory('lantern');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    if (!modal.classList.contains('is-open')) modal.hidden = true;
  }, 400);
  return true;
}

export function updateLanternTagPreview(text) {
  const tag = $('lanternTagPreview');
  if (tag) {
    tag.textContent = 'Nandhana ✦ ' + (text || 'Pure Joy');
  }
}

function playLanternAscentChimes() {
  initAudioContext();
  const audioCtx = getAudioContext();
  if (!audioCtx) return;
  const notes = [523.25, 659.25, 783.99, 987.77, 1046.50];
  notes.forEach((f, idx) => {
    setTimeout(() => {
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(f * 2, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 1.4);
      osc2.stop(now + 1.4);
    }, idx * 110);
  });
}

function createSingleLantern(wishText, xPercent, isCompanion = false, delayMs = 0) {
  setTimeout(() => {
    const container = $('skyLanterns');
    if (!container) return;

    const lantern = document.createElement('div');
    lantern.className = 'sky-lantern' + (isCompanion ? ' sky-lantern--companion' : '');

    const inner = document.createElement('div');
    inner.className = 'sky-lantern__inner';

    const base = document.createElement('div');
    base.className = 'sky-lantern__base';

    lantern.appendChild(inner);
    lantern.appendChild(base);

    if (!isCompanion) {
      const tag = document.createElement('div');
      tag.className = 'sky-lantern__tag';
      tag.textContent = '💜 Nandhana ✦ ' + wishText;
      lantern.appendChild(tag);
    }

    const initScale = isCompanion ? rand(0.7, 0.9) : 1.1;
    lantern.style.left = xPercent + rand(-3, 3) + 'vw';
    lantern.style.bottom = (isCompanion ? rand(10, 16) : 14) + '%';
    lantern.style.opacity = '0';

    container.appendChild(lantern);

    gsap.set(lantern, {
      x: 0,
      y: 0,
      scale: initScale,
      rotation: 0,
    });

    gsap.to(lantern, {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out',
    });

    const floatDuration = isCompanion ? rand(10, 14) : 11;
    const driftX = rand(-60, 60);

    gsap.to(lantern, {
      y: -(window.innerHeight * 1.15 + 160),
      duration: floatDuration,
      ease: 'power1.inOut',
      onComplete: () => {
        if (lantern.parentNode) lantern.parentNode.removeChild(lantern);
      },
    });

    gsap.to(lantern, {
      x: driftX,
      duration: rand(3.5, 5.5),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    gsap.to(lantern, {
      rotation: rand(-3.5, 3.5),
      duration: rand(2.2, 3.2),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    gsap.to(lantern, {
      scale: isCompanion ? 0.25 : 0.4,
      opacity: 0.45,
      delay: floatDuration * 0.55,
      duration: floatDuration * 0.45,
      ease: 'power2.in',
    });
  }, delayMs);
}

export function spawnSkyLantern(wishText) {
  const container = $('skyLanterns');
  if (!container) return;

  const skyToast = $('skyWishToast');
  const skyToastTag = $('skyWishToastTag');
  if (skyToast && skyToastTag) {
    skyToastTag.textContent = 'Nandhana ✦ ' + wishText;
    skyToast.classList.add('is-active');
    setTimeout(() => {
      skyToast.classList.remove('is-active');
    }, 6000);
  }

  playLanternAscentChimes();

  createSingleLantern(wishText, 50, false, 0);
  createSingleLantern(wishText, 24, true, 250);
  createSingleLantern(wishText, 38, true, 550);
  createSingleLantern(wishText, 64, true, 380);
  createSingleLantern(wishText, 78, true, 700);

  setTimeout(() => {
    if (createFireworkBurstCallback) {
      const W = window.innerWidth;
      const H = window.innerHeight;
      createFireworkBurstCallback(W * 0.35, H * 0.28, 'willow');
      createFireworkBurstCallback(W * 0.65, H * 0.25, 'sunflower');
    }
  }, 2800);
}

export function setupLanterns(options = {}) {
  createFireworkBurstCallback = options.createFireworkBurst;
  registerModalCloser('lantern', () => closeLanternModal(false));

  const openBtn = $('openLanternBtn');
  if (openBtn) openBtn.addEventListener('click', openLanternModal);

  const closeBtn = $('lanternCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', () => closeLanternModal(true));

  const backdrop = $('lanternBackdrop');
  if (backdrop) backdrop.addEventListener('click', () => closeLanternModal(true));

  const presets = document.querySelectorAll('.lantern-presets .preset-btn');
  presets.forEach((btn) => {
    btn.addEventListener('click', () => {
      presets.forEach((p) => p.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      selectedLanternWish = btn.dataset.wish || btn.textContent.trim();
      updateLanternTagPreview(selectedLanternWish);
    });
  });

  const customInput = $('lanternCustomInput');
  if (customInput) {
    customInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        presets.forEach((p) => p.classList.remove('is-selected'));
        selectedLanternWish = val;
      }
      updateLanternTagPreview(val || selectedLanternWish);
    });
  }

  const submitBtn = $('lanternSubmitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (customInput) customInput.blur();
      const customVal = customInput ? customInput.value.trim() : '';
      const wishToRelease = customVal || selectedLanternWish || 'Sweet Lavender Dreams & Joy';
      closeLanternModal(true);
      spawnSkyLantern(wishToRelease);
    });
  }

  window.addEventListener('keydown', (e) => {
    const modal = $('lanternModal');
    if (modal && modal.classList.contains('is-open') && e.key === 'Escape') {
      closeLanternModal(true);
    }
  });
}
