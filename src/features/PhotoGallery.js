/* ============================================================
   FEATURE: HEART PHOTO MEMORIES GALLERY
   Heart-shaped flippable memory, enter transition, floaters.
   ============================================================ */
import gsap from 'gsap';
import { $, rand, clamp } from '../core/utils.js';
import { pushModalHistory, popModalHistory, registerModalCloser } from './ModalsManager.js';

const PHOTOS = [
  {
    src: '/photos/FirstImage.png',
    caption: 'Some bonds need no words, and some memories live forever in the heart. ❤️🐾✨',
    subnote: 'Memory One • Closest to the Heart',
    stamp: 'Forever Bonds',
    backTitle: 'A Memory That Stays',
    backDate: 'Closest to our hearts',
    backNote:
      'Some memories never fade, especially the ones closest to our hearts. 💗✨ Every picture holds a little piece of love, a moment worth remembering, and a feeling words can never explain. 🥹💕 No matter how much time passes, some memories stay in our hearts forever. ✨',
    position: '50% 10%',
    zoom: 0.9,
    floatTheme: 'bonds',
  },
  {
    src: '/photos/SecondImg.jpeg',
    caption: 'Your smile is my favorite kind of beautiful… effortlessly cute, endlessly charming, and impossible to forget. 🥹❤️🌸✨',
    subnote: 'Memory Two • Your Smile',
    stamp: 'Endlessly Charming',
    backTitle: 'That Smile',
    backDate: 'A note for your smile',
    backNote:
      'Your smile makes your beauty unforgettable… 🥹❤️✨ So effortlessly beautiful, irresistibly cute, and simply you! 🥰🌸 Every time I see that smile, my heart falls for you a little more. 💗🌹 You don’t even have to try to be beautiful; being yourself is more than enough to make my day brighter. 🫶🏻😊❤️',
    position: '50% 30%',
    zoom: 0.9,
    floatTheme: 'flowers',
  },
  {
    src: '/photos/ThirdImg.png',
    caption: 'You’re my moonlight on a quiet sea—peaceful, magical, and endlessly beautiful. 🌊🌙🤎✨❤️',
    subnote: 'Memory Three • Moonlight & Sea',
    stamp: 'Moonlit Magic',
    backTitle: 'Moonlight on the Sea',
    backDate: 'Ocean peace & moonlight magic',
    backNote:
      'You’re like the sea beneath the moonlight—calm, mesmerizing, and beautifully magical. 🌊🌙 There’s something about you that feels peaceful and impossible to forget. 💗✨ If the moon could smile, I’m sure it would have your smile. 🌹💕',
    position: '50% 32%',
    zoom: 0.9,
    floatTheme: 'moon',
  },
];

/* Same density for all themes (~28), like moon & stars: theme + hearts + sparkles */
const FLOAT_THEMES = {
  /* Memory 1: paws + hearts + sparkles */
  bonds: [
    { icon: '🐾', type: 'paw' }, { icon: '♡', type: 'heart' }, { icon: '✦', type: 'spark' },
    { icon: '🐾', type: 'paw' }, { icon: '♥', type: 'heart' }, { icon: '✧', type: 'spark' },
    { icon: '🐾', type: 'paw' }, { icon: '♡', type: 'heart' }, { icon: '✦', type: 'spark' },
    { icon: '🐾', type: 'paw' }, { icon: '♥', type: 'heart' }, { icon: '✧', type: 'spark' },
    { icon: '🐾', type: 'paw' }, { icon: '♡', type: 'heart' }, { icon: '✦', type: 'spark' },
    { icon: '🐾', type: 'paw' }, { icon: '♥', type: 'heart' }, { icon: '✧', type: 'spark' },
    { icon: '🐾', type: 'paw' }, { icon: '♡', type: 'heart' }, { icon: '✦', type: 'spark' },
    { icon: '🐾', type: 'paw' }, { icon: '♥', type: 'heart' }, { icon: '✧', type: 'spark' },
    { icon: '🐾', type: 'paw' }, { icon: '♡', type: 'heart' }, { icon: '✦', type: 'spark' },
    { icon: '🐾', type: 'paw' },
  ],
  /* Memory 2: sunflowers lead + roses/blooms + hearts + sparkles */
  flowers: [
    { icon: '🌻', type: 'flower' }, { icon: '♡', type: 'heart' }, { icon: '✦', type: 'spark' },
    { icon: '🌹', type: 'flower' }, { icon: '♥', type: 'heart' }, { icon: '✧', type: 'spark' },
    { icon: '🌻', type: 'flower' }, { icon: '♡', type: 'heart' }, { icon: '✦', type: 'spark' },
    { icon: '🌸', type: 'flower' }, { icon: '♥', type: 'heart' }, { icon: '✧', type: 'spark' },
    { icon: '🌻', type: 'flower' }, { icon: '♡', type: 'heart' }, { icon: '✦', type: 'spark' },
    { icon: '🌷', type: 'flower' }, { icon: '♥', type: 'heart' }, { icon: '✧', type: 'spark' },
    { icon: '🌻', type: 'flower' }, { icon: '♡', type: 'heart' }, { icon: '✦', type: 'spark' },
    { icon: '🌺', type: 'flower' }, { icon: '♥', type: 'heart' }, { icon: '✧', type: 'spark' },
    { icon: '🌻', type: 'flower' }, { icon: '♡', type: 'heart' }, { icon: '✦', type: 'spark' },
    { icon: '🌻', type: 'flower' },
  ],
  /* Memory 3: moons + stars + hearts + sparkles */
  moon: [
    { icon: '🌙', type: 'moon' }, { icon: '♡', type: 'heart' }, { icon: '✦', type: 'spark' },
    { icon: '⭐', type: 'star' }, { icon: '♥', type: 'heart' }, { icon: '✧', type: 'spark' },
    { icon: '🌙', type: 'moon' }, { icon: '♡', type: 'heart' }, { icon: '✨', type: 'spark' },
    { icon: '🌟', type: 'star' }, { icon: '♥', type: 'heart' }, { icon: '✦', type: 'spark' },
    { icon: '🌙', type: 'moon' }, { icon: '♡', type: 'heart' }, { icon: '✧', type: 'spark' },
    { icon: '⭐', type: 'star' }, { icon: '♥', type: 'heart' }, { icon: '✨', type: 'spark' },
    { icon: '🌙', type: 'moon' }, { icon: '♡', type: 'heart' }, { icon: '✦', type: 'spark' },
    { icon: '🌟', type: 'star' }, { icon: '♥', type: 'heart' }, { icon: '✧', type: 'spark' },
    { icon: '🌙', type: 'moon' }, { icon: '♡', type: 'heart' }, { icon: '✨', type: 'spark' },
    { icon: '⭐', type: 'star' },
  ],
};

let galleryModal, galleryBackdrop, galleryClose, polaroidCard, polaroidImg;
let polaroidCaption, polaroidSubnote, polaroidStamp;
let polaroidBursts, polaroidGlare, polaroidWrapper, galleryPrev, galleryNext, galleryDots;
let galleryKicker, galleryHeading, galleryControls, galleryFloaters;
let toastMemoriesBtn;
let curPhotoIdx = 0;
let onGalleryCloseCb = null;
let openTl = null;
let autoHeartTimer = null;

function renderCornerFloaters(themeKey) {
  if (!galleryFloaters) return;
  const theme = FLOAT_THEMES[themeKey] || FLOAT_THEMES.bonds;
  galleryFloaters.innerHTML = theme
    .map(
      (item, i) =>
        `<span class="gallery-float-item gf-${item.type} gf-c${i + 1}" style="animation-delay:-${(i * 0.38).toFixed(1)}s">${item.icon}</span>`
    )
    .join('');
}

function applyPhotoContent(p) {
  polaroidImg.src = p.src;
  polaroidImg.alt = p.caption;
  polaroidImg.style.objectPosition = p.position || 'center center';
  polaroidImg.style.transform = `scale(${p.zoom ?? 0.9})`;
  if (polaroidCaption) {
    polaroidCaption.textContent = p.caption;
    polaroidCaption.title = p.caption;
  }
  if (polaroidSubnote) {
    polaroidSubnote.textContent = p.subnote;
    polaroidSubnote.title = p.subnote;
  }
  if (polaroidStamp) polaroidStamp.textContent = p.stamp;

  const backTitle = document.querySelector('.polaroid-back-title');
  if (backTitle) backTitle.textContent = p.backTitle || 'A Memory Note';
  const backDate = $('polaroidBackDate');
  if (backDate) backDate.textContent = p.backDate || '';
  const backText = $('polaroidBackText');
  if (backText) {
    // Keep as one flowing paragraph so emojis never sit alone on a line
    backText.textContent = String(p.backNote || '').replace(/\s*\n+\s*/g, ' ').replace(/\s+/g, ' ').trim();
  }

  renderCornerFloaters(p.floatTheme || 'bonds');
}

function spawnAutoHeart() {
  if (!polaroidBursts || !galleryModal?.classList.contains('is-open')) return;

  const heart = document.createElement('span');
  heart.className = 'burst-heart-p';
  heart.textContent = Math.random() > 0.35 ? '♥' : '♡';
  heart.style.left = `${rand(18, 82)}%`;
  heart.style.top = `${rand(55, 88)}%`;
  heart.style.fontSize = `${rand(11, 20)}px`;
  polaroidBursts.appendChild(heart);

  gsap.fromTo(
    heart,
    { opacity: 0, scale: 0.4, y: 10 },
    {
      opacity: rand(0.55, 0.95),
      scale: rand(0.9, 1.45),
      y: -rand(70, 140),
      x: rand(-36, 36),
      rotation: rand(-28, 28),
      duration: rand(1.4, 2.2),
      ease: 'power1.out',
      onComplete: () => {
        gsap.to(heart, {
          opacity: 0,
          duration: 0.35,
          onComplete: () => heart.remove(),
        });
      },
    }
  );
}

function startAutoHeartFlow() {
  stopAutoHeartFlow();
  // A soft burst on open, then a gentle ongoing flow
  for (let i = 0; i < 5; i++) setTimeout(spawnAutoHeart, i * 120);
  autoHeartTimer = setInterval(spawnAutoHeart, 520);
}

function stopAutoHeartFlow() {
  if (autoHeartTimer) {
    clearInterval(autoHeartTimer);
    autoHeartTimer = null;
  }
  if (polaroidBursts) polaroidBursts.innerHTML = '';
}

function playOpenTransition() {
  if (!galleryModal || !polaroidWrapper) return;
  if (openTl) openTl.kill();

  const floatItems = galleryFloaters
    ? Array.from(galleryFloaters.querySelectorAll('.gallery-float-item'))
    : [];
  const orbs = Array.from(galleryModal.querySelectorAll('.gallery-orb'));
  const heartShell = polaroidWrapper.querySelector('.gallery-heart-shell');
  const glow = polaroidWrapper.querySelector('.gallery-heart-glow');
  const titles = [galleryKicker, galleryHeading].filter(Boolean);

  gsap.set(galleryModal, { autoAlpha: 0 });
  gsap.set(polaroidWrapper, {
    scale: 0.28,
    rotation: -16,
    y: 70,
    autoAlpha: 0,
    transformOrigin: '50% 45%',
  });
  if (titles.length) gsap.set(titles, { autoAlpha: 0, y: 18 });
  if (galleryControls) gsap.set(galleryControls, { autoAlpha: 0, y: 14 });
  if (floatItems.length) gsap.set(floatItems, { autoAlpha: 0, scale: 0.4, y: 24 });
  if (orbs.length) gsap.set(orbs, { autoAlpha: 0, scale: 0.7 });
  if (glow) gsap.set(glow, { autoAlpha: 0, scale: 0.6 });

  openTl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  openTl.to(galleryModal, { autoAlpha: 1, duration: 0.45 });
  if (orbs.length) {
    openTl.to(orbs, { autoAlpha: 0.55, scale: 1, duration: 0.7, stagger: 0.08 }, 0.05);
  }
  openTl.to(
    polaroidWrapper,
    {
      scale: 1,
      rotation: 0,
      y: 0,
      autoAlpha: 1,
      duration: 0.95,
      ease: 'back.out(1.55)',
    },
    0.12
  );
  if (heartShell) {
    openTl.to(
      heartShell,
      {
        scale: 1.04,
        duration: 0.22,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut',
      },
      0.55
    );
  }
  if (glow) openTl.to(glow, { autoAlpha: 1, scale: 1, duration: 0.6 }, 0.25);
  if (galleryKicker) openTl.to(galleryKicker, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.38);
  if (galleryHeading) openTl.to(galleryHeading, { autoAlpha: 1, y: 0, duration: 0.45 }, 0.46);
  if (floatItems.length) {
    openTl.to(
      floatItems,
      {
        autoAlpha: 0.75,
        scale: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.05,
        ease: 'back.out(1.4)',
      },
      0.22
    );
  }
  if (galleryControls) openTl.to(galleryControls, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.58);
}

function playCloseTransition(onDone) {
  if (!galleryModal) {
    if (onDone) onDone();
    return;
  }
  if (openTl) openTl.kill();

  const fadeBits = [galleryKicker, galleryHeading, galleryControls].filter(Boolean);
  openTl = gsap.timeline({
    defaults: { ease: 'power2.in' },
    onComplete: onDone,
  });
  if (fadeBits.length) {
    openTl.to(fadeBits, {
      autoAlpha: 0,
      y: -10,
      duration: 0.22,
      stagger: 0.03,
    });
  }
  if (polaroidWrapper) {
    openTl.to(
      polaroidWrapper,
      {
        scale: 0.55,
        rotation: 10,
        y: 40,
        autoAlpha: 0,
        duration: 0.35,
        ease: 'back.in(1.3)',
      },
      0
    );
  }
  openTl.to(galleryModal, { autoAlpha: 0, duration: 0.3 }, 0.12);
}

export function renderPhoto(idx, direction = 0) {
  if (!polaroidImg) return;
  curPhotoIdx = (idx + PHOTOS.length) % PHOTOS.length;
  const p = PHOTOS[curPhotoIdx];

  const tilt = (curPhotoIdx % 2 === 0 ? 1 : -1) * rand(0.8, 1.8);

  if (polaroidCard) polaroidCard.classList.remove('is-flipped');

  if (direction !== 0) {
    gsap.to(polaroidCard, {
      x: direction * 55,
      rotation: tilt + direction * 5,
      opacity: 0.35,
      scale: 0.94,
      duration: 0.16,
      ease: 'power2.in',
      onComplete: () => {
        applyPhotoContent(p);
        gsap.fromTo(
          polaroidCard,
          { x: -direction * 45, rotation: tilt - direction * 3, opacity: 0.5, scale: 0.95 },
          { x: 0, rotation: tilt, opacity: 1, scale: 1, duration: 0.32, ease: 'back.out(1.5)' }
        );
      },
    });
  } else {
    applyPhotoContent(p);
    gsap.to(polaroidCard, { x: 0, rotation: tilt, duration: 0.3, ease: 'power2.out' });
  }

  if (galleryDots) {
    const dots = galleryDots.querySelectorAll('.gallery-dot');
    dots.forEach((d, i) => d.classList.toggle('is-active', i === curPhotoIdx));
  }
}

export function setupParallaxTilt() {
  if (!polaroidWrapper || !polaroidCard) return;

  polaroidWrapper.addEventListener('mousemove', (e) => {
    const rect = polaroidWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = -((y - cy) / cy) * 6;
    const rotY = ((x - cx) / cx) * 6;

    gsap.to(polaroidCard, {
      rotateX: rotX,
      rotateY: rotY,
      duration: 0.25,
      ease: 'power1.out',
      overwrite: 'auto',
    });

    if (polaroidGlare) {
      const px = Math.round((x / rect.width) * 100);
      const py = Math.round((y / rect.height) * 100);
      polaroidGlare.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.35) 0%, transparent 60%)`;
    }
  });

  polaroidWrapper.addEventListener('mouseleave', () => {
    gsap.to(polaroidCard, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.45,
      ease: 'power2.out',
    });
  });

  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      if (!galleryModal || !galleryModal.classList.contains('is-open')) return;
      if (e.gamma === null || e.beta === null) return;
      const rotY = clamp(e.gamma, -25, 25) * 0.35;
      const rotX = -clamp(e.beta - 45, -25, 25) * 0.35;
      gsap.to(polaroidCard, {
        rotateX: rotX,
        rotateY: rotY,
        duration: 0.3,
        ease: 'power1.out',
        overwrite: 'auto',
      });
      if (polaroidGlare) {
        const px = Math.round(50 + (e.gamma / 25) * 40);
        const py = Math.round(50 + ((e.beta - 45) / 25) * 40);
        polaroidGlare.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.4) 0%, transparent 65%)`;
      }
    });
  }
}

export function openGallery(initialIdx = 0, { onClose } = {}) {
  if (!galleryModal) galleryModal = $('galleryModal');
  if (!polaroidWrapper) polaroidWrapper = $('polaroidWrapper');
  if (!polaroidCard) polaroidCard = $('polaroidCard');
  if (!polaroidImg) polaroidImg = $('polaroidImg');
  if (!galleryFloaters) galleryFloaters = $('galleryFloaters');
  if (!galleryKicker) galleryKicker = $('galleryKicker');
  if (!galleryHeading) galleryHeading = $('galleryHeading');
  if (!galleryControls) galleryControls = $('galleryControls');
  if (!galleryModal) return;

  onGalleryCloseCb = typeof onClose === 'function' ? onClose : null;
  pushModalHistory('gallery');
  galleryModal.hidden = false;
  galleryModal.removeAttribute('hidden');
  galleryModal.setAttribute('aria-hidden', 'false');
  galleryModal.classList.add('is-open');
  galleryModal.style.display = 'flex';
  renderPhoto(initialIdx);
  playOpenTransition();
  startAutoHeartFlow();
}

export function closeGallery(shouldPopHistory = true) {
  if (!galleryModal) return false;
  if (!galleryModal.classList.contains('is-open')) return false;
  if (shouldPopHistory) popModalHistory('gallery');
  stopAutoHeartFlow();

  playCloseTransition(() => {
    galleryModal.classList.remove('is-open');
    galleryModal.setAttribute('aria-hidden', 'true');
    galleryModal.hidden = true;
    galleryModal.style.display = '';
    gsap.set(galleryModal, { clearProps: 'opacity,visibility' });
  });

  const cb = onGalleryCloseCb;
  onGalleryCloseCb = null;
  if (cb) {
    setTimeout(() => cb(), 420);
  }
  return true;
}

export function setupGallery() {
  galleryModal     = $('galleryModal');
  galleryBackdrop  = $('galleryBackdrop');
  galleryClose     = $('galleryClose');
  polaroidCard     = $('polaroidCard');
  polaroidImg      = $('polaroidImg');
  polaroidCaption  = $('polaroidCaption');
  polaroidSubnote  = $('polaroidSubnote');
  polaroidStamp    = $('polaroidStamp');
  polaroidBursts   = $('polaroidBursts');
  polaroidGlare    = $('polaroidGlare');
  polaroidWrapper  = $('polaroidWrapper');
  galleryPrev      = $('galleryPrev');
  galleryNext      = $('galleryNext');
  galleryDots      = $('galleryDots');
  galleryKicker    = $('galleryKicker');
  galleryHeading   = $('galleryHeading');
  galleryControls  = $('galleryControls');
  galleryFloaters  = $('galleryFloaters');
  toastMemoriesBtn = $('toastMemoriesBtn');

  registerModalCloser('gallery', () => closeGallery(false));

  const triggerOpen = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    openGallery(0);
  };

  if (toastMemoriesBtn) {
    toastMemoriesBtn.addEventListener('click', triggerOpen);
    toastMemoriesBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
  }
  const openMemBtn = $('openMemoriesBtn');
  if (openMemBtn) {
    openMemBtn.addEventListener('click', triggerOpen);
  }
  if (galleryClose) galleryClose.addEventListener('click', () => closeGallery(true));
  if (galleryBackdrop) galleryBackdrop.addEventListener('click', () => closeGallery(true));
  if (galleryPrev) galleryPrev.addEventListener('click', (e) => { e.stopPropagation(); renderPhoto(curPhotoIdx - 1, -1); });
  if (galleryNext) galleryNext.addEventListener('click', (e) => { e.stopPropagation(); renderPhoto(curPhotoIdx + 1, 1); });

  if (galleryDots) {
    galleryDots.innerHTML = PHOTOS.map(
      (_, i) =>
        `<button class="gallery-dot${i === 0 ? ' is-active' : ''}" data-index="${i}" aria-label="Photo ${i + 1}" type="button"></button>`
    ).join('');
    galleryDots.addEventListener('click', (e) => {
      e.stopPropagation();
      const dot = e.target.closest('.gallery-dot');
      if (dot && dot.dataset.index !== undefined) {
        renderPhoto(parseInt(dot.dataset.index, 10));
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (!galleryModal || !galleryModal.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeGallery();
    else if (e.key === 'ArrowLeft') renderPhoto(curPhotoIdx - 1, -1);
    else if (e.key === 'ArrowRight') renderPhoto(curPhotoIdx + 1, 1);
  });

  let touchStartX = 0;
  let hasSwiped = false;
  if (polaroidCard) {
    polaroidCard.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
      hasSwiped = false;
    }, { passive: true });

    polaroidCard.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        hasSwiped = true;
        if (diff > 0) renderPhoto(curPhotoIdx - 1, -1);
        else renderPhoto(curPhotoIdx + 1, 1);
      }
    }, { passive: true });

    polaroidCard.addEventListener('click', (e) => {
      if (hasSwiped) return;
      if (e.target.closest('.polaroid-back-text')) return;
      polaroidCard.classList.toggle('is-flipped');
      if (navigator.vibrate) navigator.vibrate(25);
    });
  }

  setupParallaxTilt();

  // Warm the photo cache so swipes feel instant
  PHOTOS.forEach((p) => {
    const img = new Image();
    img.src = p.src;
  });

  window.openMemories = () => openGallery(0);
}
