/* ============================================================
   FEATURE: Carrom phase-N — Promise slides
   Three stacked rows slide in (R → L → R), then copy blocks
   land (R → L → R). All stay visible. Ref: elegant split cards.
   ============================================================ */
import gsap from 'gsap';
import { $ } from '../core/utils.js';
import { pushModalHistory, popModalHistory, registerModalCloser } from './ModalsManager.js';

const FLOAT_ITEMS = [
  { icon: '♥', type: 'heart' }, { icon: '✦', type: 'spark' }, { icon: '💍', type: 'ring' },
  { icon: '♡', type: 'heart' }, { icon: '✧', type: 'spark' }, { icon: '♥', type: 'heart' },
  { icon: '✨', type: 'spark' }, { icon: '💍', type: 'ring' }, { icon: '♡', type: 'heart' },
  { icon: '✦', type: 'spark' }, { icon: '♥', type: 'heart' }, { icon: '✧', type: 'spark' },
  { icon: '💍', type: 'ring' }, { icon: '♡', type: 'heart' }, { icon: '✨', type: 'spark' },
  { icon: '♥', type: 'heart' }, { icon: '✦', type: 'spark' }, { icon: '💍', type: 'ring' },
  { icon: '♡', type: 'heart' }, { icon: '✧', type: 'spark' }, { icon: '♥', type: 'heart' },
  { icon: '✨', type: 'spark' }, { icon: '💍', type: 'ring' }, { icon: '♡', type: 'heart' },
];

let modal, backdrop, closeBtn, continueBtn, stage, floaters, footer;
let onCloseCb = null;
let openTl = null;
let closing = false;

function renderFloaters() {
  if (!floaters) return;
  floaters.innerHTML = FLOAT_ITEMS.map(
    (item, i) =>
      `<span class="promise-float pf-${item.type} pf-c${i + 1}" style="animation-delay:-${(i * 0.42).toFixed(1)}s">${item.icon}</span>`
  ).join('');
}

function resetVisualState() {
  if (!stage) return;
  const panels = Array.from(stage.querySelectorAll('.promise-panel'));
  const copies = Array.from(stage.querySelectorAll('.promise-copy'));
  const floats = floaters ? Array.from(floaters.querySelectorAll('.promise-float')) : [];

  panels.forEach((panel) => {
    const from = panel.dataset.enter === 'left' ? -120 : 120;
    gsap.set(panel, { autoAlpha: 0, xPercent: from });
  });
  copies.forEach((copy) => {
    const from = copy.dataset.enter === 'left' ? -70 : 70;
    gsap.set(copy, { autoAlpha: 0, xPercent: from, y: 6 });
  });
  if (floats.length) gsap.set(floats, { autoAlpha: 0, scale: 0.5 });
  if (continueBtn) gsap.set(continueBtn, { autoAlpha: 0, y: 12, pointerEvents: 'none' });
  if (footer) gsap.set(footer, { autoAlpha: 0 });
  if (closeBtn) gsap.set(closeBtn, { autoAlpha: 0 });
}

function playOpenSequence() {
  if (!modal || !stage) return;
  if (openTl) openTl.kill();

  const panels = Array.from(stage.querySelectorAll('.promise-panel'));
  const copies = Array.from(stage.querySelectorAll('.promise-copy'));
  const floats = floaters ? Array.from(floaters.querySelectorAll('.promise-float')) : [];
  const decor = modal.querySelectorAll(
    '.promise-hang, .promise-wire, .promise-curtain, .promise-bloom'
  );

  resetVisualState();
  gsap.set(modal, { autoAlpha: 0 });
  if (decor.length) gsap.set(decor, { autoAlpha: 0 });

  openTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  openTl.to(modal, { autoAlpha: 1, duration: 0.45 }, 0);

  if (decor.length) {
    openTl.to(decor, { autoAlpha: 1, duration: 0.7, stagger: 0.04 }, 0.08);
  }

  if (floats.length) {
    openTl.to(
      floats,
      { autoAlpha: 0.85, scale: 1, duration: 0.55, stagger: 0.03, ease: 'back.out(1.3)' },
      0.12
    );
  }

  panels.forEach((panel, i) => {
    openTl.to(
      panel,
      {
        autoAlpha: 1,
        xPercent: 0,
        duration: 0.78,
        ease: 'power3.out',
      },
      0.28 + i * 0.42
    );
  });

  // Copy blocks land after all panels are in (same R → L → R order)
  const copyStart = 0.28 + panels.length * 0.42 + 0.12;
  copies.forEach((copy, i) => {
    openTl.to(
      copy,
      {
        autoAlpha: 1,
        xPercent: 0,
        y: 0,
        duration: 0.62,
        ease: 'power3.out',
      },
      copyStart + i * 0.32
    );
  });

  if (closeBtn) openTl.to(closeBtn, { autoAlpha: 1, duration: 0.35 }, copyStart);
  if (footer) openTl.to(footer, { autoAlpha: 1, duration: 0.35 }, copyStart + copies.length * 0.32);
  if (continueBtn) {
    openTl.to(
      continueBtn,
      { autoAlpha: 1, y: 0, pointerEvents: 'auto', duration: 0.4, ease: 'power2.out' },
      copyStart + copies.length * 0.32 + 0.05
    );
  }
}

export function openCarromSlide({ onClose } = {}) {
  if (!modal) return;
  closing = false;
  onCloseCb = typeof onClose === 'function' ? onClose : null;

  pushModalHistory('promise');
  modal.hidden = false;
  modal.removeAttribute('hidden');
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('is-open');
  modal.style.display = 'flex';

  renderFloaters();
  playOpenSequence();
}

export function closeCarromSlide(shouldPopHistory = true) {
  if (!modal || !modal.classList.contains('is-open') || closing) return false;
  closing = true;

  if (shouldPopHistory) popModalHistory('promise');
  if (openTl) openTl.kill();

  const cb = onCloseCb;
  onCloseCb = null;

  openTl = gsap.timeline({
    defaults: { ease: 'power2.in' },
    onComplete: () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      modal.hidden = true;
      modal.style.display = '';
      gsap.set(modal, { clearProps: 'opacity,visibility' });
      closing = false;
      if (cb) cb();
    },
  });

  if (continueBtn) openTl.to(continueBtn, { autoAlpha: 0, y: 10, duration: 0.2 }, 0);
  if (footer) openTl.to(footer, { autoAlpha: 0, duration: 0.2 }, 0);
  if (closeBtn) openTl.to(closeBtn, { autoAlpha: 0, duration: 0.2 }, 0);
  openTl.to(modal, { autoAlpha: 0, duration: 0.35 }, 0.05);
  return true;
}

function preloadSlides() {
  ['/photos/Slide1.jpg', '/photos/Slide2.jpg', '/photos/Slide3.jpg'].forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

export function setupCarromSlide() {
  modal = $('carromSlideModal');
  backdrop = $('carromSlideBackdrop');
  closeBtn = $('carromSlideClose');
  continueBtn = $('carromSlideContinue');
  stage = $('promiseStage');
  floaters = $('promiseFloaters');
  footer = modal?.querySelector?.('.promise-footer') || null;

  registerModalCloser('promise', () => closeCarromSlide(false));
  preloadSlides();

  if (closeBtn) closeBtn.addEventListener('click', () => closeCarromSlide(true));
  if (continueBtn) continueBtn.addEventListener('click', () => closeCarromSlide(true));

  window.addEventListener('keydown', (e) => {
    if (!modal || !modal.classList.contains('is-open')) return;
    if (e.key === 'Escape' || e.key === 'Enter') closeCarromSlide(true);
  });
}
