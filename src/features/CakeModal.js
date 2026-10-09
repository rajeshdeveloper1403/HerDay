/* ============================================================
   FEATURE: CELEBRATION CAKE & CONFETTI CANNON
   Blowing candles, confetti explosion, toast action buttons.
   ============================================================ */
import gsap from 'gsap';
import { $, rand, pick } from '../core/utils.js';
import { cue } from '../core/audio.js';

let cakeCard, cakeWrapper, cakeConfetti;
let cakeBlown = false;
let launchFireworksCallback = null;
let modalOpenerCallbacks = {};

export function resetCake() {
  cakeBlown = false;
  if (cakeCard) {
    cakeCard.classList.remove('is-blown');
    cakeCard.setAttribute('aria-label', 'Interactive Birthday Cake. Click to blow out the candles and make a wish!');
  }
  if (cakeConfetti) cakeConfetti.innerHTML = '';
}

export function spawnConfetti() {
  if (!cakeConfetti || !cakeCard) return;
  cakeConfetti.innerHTML = '';
  const rect = cakeCard.getBoundingClientRect();
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

  // Celebratory icons
  const icons = ['🌻', '🎂', '✨', '💖', '🎉', '🌻', '✨'];
  const iconCount = window.innerWidth <= 768 ? 7 : 12;
  for (let i = 0; i < iconCount; i++) {
    const span = document.createElement('span');
    span.className = 'cake-burst-icon';
    span.textContent = icons[i % icons.length];
    span.style.left = `${ox}px`;
    span.style.top = `${oy}px`;
    cakeConfetti.appendChild(span);

    const ang = rand(-Math.PI * 0.85, -Math.PI * 0.15);
    const dist = rand(80, 200);
    const duration = rand(1.4, 2.0);

    gsap.to(span, {
      x: Math.cos(ang) * dist + rand(-20, 20),
      y: Math.sin(ang) * dist - rand(10, 40),
      scale: rand(1.1, 1.6),
      rotation: rand(-40, 40),
      duration: duration * 0.45,
      ease: 'power2.out',
      onComplete: () => span.remove(),
    });
    gsap.to(span, {
      y: `+=${rand(60, 120)}`,
      opacity: 0,
      duration: duration * 0.55,
      delay: duration * 0.45,
      ease: 'power1.in',
    });
  }
}

export function blowCandles() {
  if (cakeBlown) {
    if (modalOpenerCallbacks.openGallery) modalOpenerCallbacks.openGallery(0);
    return;
  }
  cakeBlown = true;
  cue('candles');
  if (cakeCard) {
    cakeCard.classList.add('is-blown');
    cakeCard.setAttribute('aria-label', 'Candles blown out! Click to view memories.');
  }
  spawnConfetti();
  if (launchFireworksCallback) launchFireworksCallback();
  if (navigator.vibrate) navigator.vibrate([60, 40, 100]);
}

export function setupCake(options = {}) {
  cakeCard = $('cakeCard');
  cakeWrapper = $('cakeWrapper');
  cakeConfetti = $('cakeConfetti');
  launchFireworksCallback = options.launchFireworks;
  modalOpenerCallbacks = options.modalOpeners || {};

  if (!cakeCard) return;
  cakeCard.addEventListener('click', blowCandles);
  cakeCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      blowCandles();
    }
  });

  const tMem = $('toastMemoriesBtn');
  if (tMem && modalOpenerCallbacks.openGallery) {
    tMem.addEventListener('click', (e) => { e.stopPropagation(); modalOpenerCallbacks.openGallery(0); });
  }
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
