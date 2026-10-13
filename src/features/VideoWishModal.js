/* ============================================================
   FEATURE: VIDEO WISH SCREEN → FINAL NOTE
   Portrait video in a framed card, then a separate centered note
   (note never lives inside the video frame).
   ============================================================ */
import gsap from 'gsap';
import { $ } from '../core/utils.js';
import { pushModalHistory, popModalHistory, registerModalCloser } from './ModalsManager.js';

const VIDEO_SRC = './videos/portraitvideo.mp4';
const FALLBACK_SLIDES = [
  '/photos/Slide1.jpg',
  '/photos/Slide2.jpg',
  '/photos/Slide3.jpg',
  '/photos/FirstImage.png',
  '/photos/SecondImg.jpeg',
  '/photos/ThirdImg.png',
];

let modal, stage, videoEl, cinemaEl, noteEl, closeBtn;
let usingFallback = false;
let cinemaTL = null;
let noteShown = false;
let open = false;

function showNote() {
  if (noteShown || !noteEl) return;
  noteShown = true;

  // Hide video frame entirely — note is its own centered card
  if (stage) {
    gsap.to(stage, {
      autoAlpha: 0,
      scale: 0.96,
      duration: 0.55,
      ease: 'power2.inOut',
      onComplete: () => {
        if (stage) stage.hidden = true;
      },
    });
  }
  if (videoEl) {
    try { videoEl.pause(); } catch (_) {}
  }

  noteEl.hidden = false;
  noteEl.setAttribute('aria-hidden', 'false');
  gsap.fromTo(
    noteEl,
    { autoAlpha: 0, y: 28, scale: 0.96 },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, ease: 'power3.out' }
  );
}

function playFallbackCinema() {
  usingFallback = true;
  if (!cinemaEl) {
    showNote();
    return;
  }
  cinemaEl.hidden = false;
  cinemaEl.innerHTML = '';
  const slides = FALLBACK_SLIDES.map((src, i) => {
    const img = document.createElement('img');
    img.className = 'vwish-slide';
    img.src = src;
    img.alt = '';
    img.draggable = false;
    cinemaEl.appendChild(img);
    gsap.set(img, { autoAlpha: i === 0 ? 1 : 0, scale: i === 0 ? 1 : 1.06 });
    return img;
  });

  if (cinemaTL) cinemaTL.kill();
  cinemaTL = gsap.timeline({
    onComplete: () => {
      gsap.to(cinemaEl, {
        autoAlpha: 0,
        duration: 0.7,
        ease: 'power2.inOut',
        onComplete: showNote,
      });
    },
  });

  slides.forEach((img, i) => {
    if (i === 0) return;
    const t = i * 2.4;
    cinemaTL
      .to(slides[i - 1], { autoAlpha: 0, scale: 1.08, duration: 0.9, ease: 'power2.inOut' }, t)
      .fromTo(img, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.out' }, t);
  });
  cinemaTL.to({}, { duration: 1.6 });
}

function startVideo() {
  noteShown = false;
  usingFallback = false;
  if (cinemaTL) { cinemaTL.kill(); cinemaTL = null; }
  if (cinemaEl) {
    cinemaEl.hidden = true;
    cinemaEl.innerHTML = '';
    gsap.set(cinemaEl, { autoAlpha: 1 });
  }
  if (noteEl) {
    noteEl.hidden = true;
    noteEl.setAttribute('aria-hidden', 'true');
    gsap.set(noteEl, { autoAlpha: 0 });
  }
  if (stage) {
    stage.hidden = false;
    stage.classList.remove('is-to-note');
    gsap.set(stage, { autoAlpha: 1, scale: 1 });
  }

  if (!videoEl) {
    playFallbackCinema();
    return;
  }

  videoEl.hidden = false;
  videoEl.muted = true; // keep birthday music playing under the wish
  videoEl.pause();
  videoEl.currentTime = 0;

  const tryPlay = () => {
    const p = videoEl.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => playFallbackCinema());
    }
  };

  const onReady = () => {
    videoEl.removeEventListener('loadeddata', onReady);
    tryPlay();
  };

  videoEl.addEventListener('ended', showNote, { once: true });
  videoEl.addEventListener('error', () => {
    videoEl.hidden = true;
    playFallbackCinema();
  }, { once: true });

  if (!videoEl.getAttribute('src')) {
    videoEl.src = VIDEO_SRC;
  }

  if (videoEl.readyState >= 2) tryPlay();
  else {
    videoEl.addEventListener('loadeddata', onReady);
    videoEl.load();
    setTimeout(() => {
      if (!open || noteShown || usingFallback) return;
      if (videoEl.readyState < 2) {
        videoEl.hidden = true;
        playFallbackCinema();
      }
    }, 1800);
  }
}

export function openVideoWish() {
  if (!modal) return;
  open = true;
  pushModalHistory('videowish');
  modal.hidden = false;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  if (stage) {
    stage.hidden = false;
    gsap.set(stage, { autoAlpha: 1, scale: 1 });
  }
  if (noteEl) {
    noteEl.hidden = true;
    gsap.set(noteEl, { autoAlpha: 0 });
  }

  gsap.fromTo(
    stage,
    { autoAlpha: 0, scale: 1.06 },
    { autoAlpha: 1, scale: 1, duration: 0.85, ease: 'power3.out', onComplete: startVideo }
  );
}

export function closeVideoWish(shouldPopHistory = true) {
  if (!modal || !open) return false;
  open = false;
  if (shouldPopHistory) popModalHistory('videowish');
  if (videoEl) {
    try { videoEl.pause(); } catch (_) {}
  }
  if (cinemaTL) { cinemaTL.kill(); cinemaTL = null; }
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  setTimeout(() => {
    if (!open) modal.hidden = true;
  }, 420);
  return true;
}

export function resetVideoWish() {
  closeVideoWish(false);
  noteShown = false;
  usingFallback = false;
  if (noteEl) {
    noteEl.hidden = true;
    gsap.set(noteEl, { autoAlpha: 0 });
  }
  if (stage) {
    stage.hidden = false;
    stage.classList.remove('is-to-note');
    gsap.set(stage, { autoAlpha: 1, scale: 1 });
  }
}

export function setupVideoWishModal() {
  modal = $('videoWishModal');
  stage = $('vwishStage');
  videoEl = $('vwishVideo');
  cinemaEl = $('vwishCinema');
  noteEl = $('vwishNote');
  closeBtn = $('vwishClose');

  registerModalCloser('videowish', () => closeVideoWish(false));

  if (closeBtn) closeBtn.addEventListener('click', () => closeVideoWish(true));

  const backdrop = $('vwishBackdrop');
  if (backdrop) backdrop.addEventListener('click', () => closeVideoWish(true));
}
