/* ============================================================
   FEATURE: FINALE ACTION DOCK + OPTIONAL CONFETTI
   Wires Memories / Gift / Lantern / Stars / Letter openers.
   (Act 4 cake UI removed; confetti host kept for bursts.)
   ============================================================ */
import gsap from 'gsap';
import { $, rand, pick } from '../core/utils.js';

let cakeConfetti;
let launchFireworksCallback = null;
let modalOpenerCallbacks = {};
let fireworksArmed = false;

export function resetCake() {
  fireworksArmed = false;
  if (cakeConfetti) cakeConfetti.innerHTML = '';
}

export function spawnConfetti(originEl) {
  if (!cakeConfetti) return;
  cakeConfetti.innerHTML = '';
  const rect = originEl
    ? originEl.getBoundingClientRect()
    : { left: window.innerWidth / 2, top: window.innerHeight * 0.45, width: 0, height: 0 };
  const ox = rect.left + rect.width / 2;
  const oy = rect.top + rect.height * 0.45;

  const colors = ['#fca311', '#e85d04', '#d90429', '#ffbe0b', '#fff', '#70e000', '#38b000'];
  const confettiCount = window.innerWidth <= 768 ? 32 : 55;
  for (let i = 0; i < confettiCount; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-p';
    p.style.backgroundColor = pick(colors);
    p.style.width = `${rand(6, 12)}px`;
    p.style.height = `${rand(4, 8)}px`;
    p.style.left = `${ox}px`;
    p.style.top = `${oy}px`;
    cakeConfetti.appendChild(p);

    const angle = rand(-Math.PI * 0.9, -Math.PI * 0.1);
    const dist = rand(70, 240);
    const tx = Math.cos(angle) * dist + rand(-30, 30);
    const ty = Math.sin(angle) * dist * 1.1;

    gsap.to(p, {
      x: tx,
      y: ty,
      rotation: rand(-360, 360),
      duration: rand(0.9, 1.4),
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(p, {
          y: '+=200',
          opacity: 0,
          duration: rand(1.2, 1.8),
          ease: 'power1.in',
          onComplete: () => p.remove(),
        });
      },
    });
  }
}

export function celebrateFinale() {
  if (fireworksArmed) return;
  fireworksArmed = true;
  spawnConfetti($('wish'));
  if (launchFireworksCallback) launchFireworksCallback();
  if (navigator.vibrate) navigator.vibrate([60, 40, 100]);
}

function wireModalButtons() {
  // Memories is wired by PhotoGallery via #toastMemoriesBtn
  const tGift = $('toastGiftBtn');
  if (tGift && modalOpenerCallbacks.openGift) {
    tGift.addEventListener('click', (e) => { e.stopPropagation(); modalOpenerCallbacks.openGift(); });
  }
  const tLan = $('toastLanternBtn');
  if (tLan && modalOpenerCallbacks.openLantern) {
    tLan.addEventListener('click', (e) => { e.stopPropagation(); modalOpenerCallbacks.openLantern(); });
  }
  const tStars = $('toastStarsBtn');
  if (tStars && modalOpenerCallbacks.openStars) {
    tStars.addEventListener('click', (e) => { e.stopPropagation(); modalOpenerCallbacks.openStars(); });
  }
  const tLet = $('toastLetterBtn');
  if (tLet && modalOpenerCallbacks.openLetter) {
    tLet.addEventListener('click', (e) => { e.stopPropagation(); modalOpenerCallbacks.openLetter(); });
  }
}

export function setupCake(options = {}) {
  cakeConfetti = $('cakeConfetti');
  launchFireworksCallback = options.launchFireworks;
  modalOpenerCallbacks = options.modalOpeners || {};
  wireModalButtons();
}
