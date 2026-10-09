/* ============================================================
   FEATURE: Carrom phase-N placeholder slide (1 image for now)
   ============================================================ */
import { $ } from '../core/utils.js';

let modal, backdrop, closeBtn, continueBtn;
let onCloseCb = null;

export function openCarromSlide({ onClose } = {}) {
  if (!modal) return;
  onCloseCb = typeof onClose === 'function' ? onClose : null;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => modal.classList.add('is-open'));
}

export function closeCarromSlide() {
  if (!modal || !modal.classList.contains('is-open')) return false;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    if (!modal.classList.contains('is-open')) modal.hidden = true;
  }, 350);
  const cb = onCloseCb;
  onCloseCb = null;
  if (cb) setTimeout(() => cb(), 300);
  return true;
}

export function setupCarromSlide() {
  modal = $('carromSlideModal');
  backdrop = $('carromSlideBackdrop');
  closeBtn = $('carromSlideClose');
  continueBtn = $('carromSlideContinue');

  if (closeBtn) closeBtn.addEventListener('click', () => closeCarromSlide());
  if (continueBtn) continueBtn.addEventListener('click', () => closeCarromSlide());
  if (backdrop) backdrop.addEventListener('click', () => closeCarromSlide());

  window.addEventListener('keydown', (e) => {
    if (!modal || !modal.classList.contains('is-open')) return;
    if (e.key === 'Escape' || e.key === 'Enter') closeCarromSlide();
  });
}
