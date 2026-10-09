/* ============================================================
   FEATURE: POLAROID PHOTO MEMORIES GALLERY
   3D flippable polaroid cards, gyroscope & mouse parallax, likes.
   ============================================================ */
import gsap from 'gsap';
import { $, rand, clamp } from '../core/utils.js';
import { pushModalHistory, popModalHistory, registerModalCloser } from './ModalsManager.js';

const PHOTOS = [
  {
    src: '/color-palette.jpg',
    caption: 'Color Palette Inspiration ✨🌸',
    subnote: 'Blush, Mauve, Plum & Velvet Violet',
    stamp: '✨ Theme Reference',
    backDate: 'Template Guide • Visual Aesthetic',
    backNote: '"Harmonious palette: Soft Blush Rose (#DD9B9C), Dusty Mauve (#B97397), Radiant Plum (#97588D), Royal Violet (#503967), and Midnight Velvet (#312651)."',
    position: 'center center',
  },
];

let galleryModal, galleryBackdrop, galleryClose, polaroidCard, polaroidImg;
let polaroidCaption, polaroidSubnote, polaroidStamp, polaroidLikeBtn, polaroidLikeCount;
let polaroidBursts, polaroidGlare, polaroidWrapper, galleryPrev, galleryNext, galleryDots;
let toastMemoriesBtn;
let curPhotoIdx = 0;
let likeCounts = [1];
let onGalleryCloseCb = null;

export function renderPhoto(idx, direction = 0) {
  if (!polaroidImg) return;
  curPhotoIdx = (idx + PHOTOS.length) % PHOTOS.length;
  const p = PHOTOS[curPhotoIdx];

  const tilt = (curPhotoIdx % 2 === 0 ? 1 : -1) * rand(1.2, 2.5);

  if (polaroidCard) polaroidCard.classList.remove('is-flipped');
  const backDate = $('polaroidBackDate');
  if (backDate) backDate.textContent = p.backDate || 'Anu • Precious Memory';
  const backText = $('polaroidBackText');
  if (backText) backText.textContent = p.backNote || 'A special moment with Anu...';

  if (direction !== 0) {
    gsap.to(polaroidCard, {
      x: direction * 55,
      rotation: tilt + direction * 5,
      opacity: 0.35,
      scale: 0.94,
      duration: 0.16,
      ease: 'power2.in',
      onComplete: () => {
        polaroidImg.src = p.src;
        polaroidImg.style.objectPosition = p.position || 'center 15%';
        polaroidCaption.textContent = p.caption;
        if (polaroidSubnote) polaroidSubnote.textContent = p.subnote;
        if (polaroidStamp) polaroidStamp.textContent = p.stamp;
        if (polaroidLikeCount) polaroidLikeCount.textContent = likeCounts[curPhotoIdx];

        gsap.fromTo(
          polaroidCard,
          { x: -direction * 45, rotation: tilt - direction * 3, opacity: 0.5, scale: 0.95 },
          { x: 0, rotation: tilt, opacity: 1, scale: 1, duration: 0.32, ease: 'back.out(1.5)' }
        );
      },
    });
  } else {
    polaroidImg.src = p.src;
    polaroidImg.style.objectPosition = p.position || 'center 15%';
    polaroidCaption.textContent = p.caption;
    if (polaroidSubnote) polaroidSubnote.textContent = p.subnote;
    if (polaroidStamp) polaroidStamp.textContent = p.stamp;
    if (polaroidLikeCount) polaroidLikeCount.textContent = likeCounts[curPhotoIdx];
    gsap.to(polaroidCard, { x: 0, rotation: tilt, duration: 0.3, ease: 'power2.out' });
  }

  if (galleryDots) {
    const dots = galleryDots.querySelectorAll('.gallery-dot');
    dots.forEach((d, i) => d.classList.toggle('is-active', i === curPhotoIdx));
  }
}

export function popHeartReaction(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  likeCounts[curPhotoIdx]++;
  if (polaroidLikeCount) polaroidLikeCount.textContent = likeCounts[curPhotoIdx];

  if (polaroidLikeBtn) {
    gsap.fromTo(polaroidLikeBtn, { scale: 0.8 }, { scale: 1.25, duration: 0.15, yoyo: true, repeat: 1, ease: 'power1.out' });
  }

  if (polaroidBursts) {
    const heart = document.createElement('span');
    heart.className = 'burst-heart';
    heart.textContent = '💖';
    heart.style.left = `${rand(20, 80)}%`;
    heart.style.top = `${rand(30, 70)}%`;
    polaroidBursts.appendChild(heart);

    gsap.to(heart, {
      y: -rand(60, 110),
      x: rand(-30, 30),
      opacity: 0,
      scale: rand(1.2, 1.8),
      rotation: rand(-25, 25),
      duration: rand(0.7, 1.1),
      ease: 'power2.out',
      onComplete: () => heart.remove(),
    });
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
  if (!galleryModal) return;
  onGalleryCloseCb = typeof onClose === 'function' ? onClose : null;
  pushModalHistory('gallery');
  galleryModal.hidden = false;
  galleryModal.setAttribute('aria-hidden', 'false');
  galleryModal.classList.add('is-open');
  renderPhoto(initialIdx);
}

export function closeGallery(shouldPopHistory = true) {
  if (!galleryModal) return false;
  if (!galleryModal.classList.contains('is-open')) return false;
  if (shouldPopHistory) popModalHistory('gallery');
  galleryModal.classList.remove('is-open');
  galleryModal.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    if (!galleryModal.classList.contains('is-open')) galleryModal.hidden = true;
  }, 400);
  const cb = onGalleryCloseCb;
  onGalleryCloseCb = null;
  if (cb) {
    // Let the close animation breathe before resuming carrom
    setTimeout(() => cb(), 280);
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
  polaroidLikeBtn  = $('polaroidLikeBtn');
  polaroidLikeCount= $('polaroidLikeCount');
  polaroidBursts   = $('polaroidBursts');
  polaroidGlare    = $('polaroidGlare');
  polaroidWrapper  = $('polaroidWrapper');
  galleryPrev      = $('galleryPrev');
  galleryNext      = $('galleryNext');
  galleryDots      = $('galleryDots');
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
  if (polaroidLikeBtn) polaroidLikeBtn.addEventListener('click', popHeartReaction);

  if (galleryDots) {
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
      if (e.target.closest('#polaroidLikeBtn') || hasSwiped) return;
      polaroidCard.classList.toggle('is-flipped');
      if (navigator.vibrate) navigator.vibrate(25);
    });
  }

  setupParallaxTilt();
  window.openMemories = () => openGallery(0);
}
