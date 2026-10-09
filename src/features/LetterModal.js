/* ============================================================
   FEATURE: WAX-SEALED SECRET LETTER MODAL
   Wax seal click, glowing break, envelope unfold, parchment reading.
   ============================================================ */
import gsap from 'gsap';
import { $ } from '../core/utils.js';
import { playMagicalChime } from './MusicPlayer.js';
import { pushModalHistory, popModalHistory, registerModalCloser } from './ModalsManager.js';

let isLetterUnsealed = false;

export function openLetterModal() {
  const modal = $('letterModal');
  if (!modal) return;
  pushModalHistory('letter');
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('is-open');

  const envelope = $('letterEnvelope');
  const parchment = $('letterParchment');
  if (envelope && parchment) {
    if (isLetterUnsealed) {
      envelope.hidden = true;
      parchment.hidden = false;
    } else {
      envelope.hidden = false;
      parchment.hidden = true;
    }
  }
}

export function closeLetterModal(shouldPopHistory = true) {
  const modal = $('letterModal');
  if (!modal) return false;
  if (!modal.classList.contains('is-open')) return false;
  if (shouldPopHistory) popModalHistory('letter');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    if (!modal.classList.contains('is-open')) modal.hidden = true;
  }, 400);
  return true;
}

export function unsealLetter() {
  if (isLetterUnsealed) return;
  isLetterUnsealed = true;

  const seal = $('letterSeal');
  const envelope = $('letterEnvelope');
  const parchment = $('letterParchment');

  playMagicalChime();

  if (seal) {
    gsap.to(seal, {
      scale: 1.25,
      rotation: 12,
      boxShadow: '0 0 35px #c084fc',
      duration: 0.2,
      onComplete: () => {
        gsap.to(seal, { scale: 0, opacity: 0, duration: 0.25 });
        if (envelope && parchment) {
          gsap.to(envelope, {
            scale: 0.9,
            opacity: 0,
            duration: 0.35,
            onComplete: () => {
              envelope.hidden = true;
              parchment.hidden = false;
              gsap.fromTo(
                parchment,
                { scale: 0.85, opacity: 0, y: 30 },
                { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' }
              );
            },
          });
        }
      },
    });
  }
}

export function setupLetter() {
  registerModalCloser('letter', () => closeLetterModal(false));

  const openBtn = $('openLetterBtn');
  if (openBtn) openBtn.addEventListener('click', openLetterModal);

  const seal = $('letterSeal');
  if (seal) seal.addEventListener('click', unsealLetter);

  const envelope = $('letterEnvelope');
  if (envelope) envelope.addEventListener('click', unsealLetter);

  const closeBtn = $('letterCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', () => closeLetterModal(true));

  const backdrop = $('letterBackdrop');
  if (backdrop) backdrop.addEventListener('click', () => closeLetterModal(true));

  window.addEventListener('keydown', (e) => {
    const modal = $('letterModal');
    if (modal && modal.classList.contains('is-open') && e.key === 'Escape') {
      closeLetterModal(true);
    }
  });

  const modal = $('letterModal');
  if (modal) {
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
          closeLetterModal(true);
        }
      }
    }, { passive: true });
  }
}
