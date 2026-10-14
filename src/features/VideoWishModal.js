/* ============================================================
   FEATURE: VIDEO WISH SCREEN → FINAL NOTE
   Smooth portrait video (no glitch), then a separate centered note.
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
let starting = false;
let fallbackTimer = null;
let onEndedBound = null;
let onErrorBound = null;

function clearVideoListeners() {
  if (!videoEl) return;
  if (onEndedBound) {
    videoEl.removeEventListener('ended', onEndedBound);
    onEndedBound = null;
  }
  if (onErrorBound) {
    videoEl.removeEventListener('error', onErrorBound);
    onErrorBound = null;
  }
}

function clearFallbackTimer() {
  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
}

function showNote() {
  if (noteShown || !noteEl) return;
  noteShown = true;
  starting = false;
  clearFallbackTimer();
  clearVideoListeners();

  if (videoEl) {
    try { videoEl.pause(); } catch (_) {}
  }
  if (cinemaTL) { cinemaTL.kill(); cinemaTL = null; }

  // Sequential: finish hiding video first, then reveal note (no overlap glitch)
  const revealNote = () => {
    if (stage) {
      stage.hidden = true;
      gsap.set(stage, { autoAlpha: 0, scale: 1 });
    }
    noteEl.hidden = false;
    noteEl.setAttribute('aria-hidden', 'false');
    gsap.fromTo(
      noteEl,
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out', clearProps: 'transform' }
    );
  };

  if (stage && !stage.hidden) {
    gsap.killTweensOf(stage);
    gsap.to(stage, {
      autoAlpha: 0,
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: revealNote,
    });
  } else {
    revealNote();
  }
}

function playFallbackCinema() {
  if (noteShown || usingFallback) return;
  usingFallback = true;
  starting = false;
  clearFallbackTimer();
  clearVideoListeners();

  if (videoEl) {
    videoEl.hidden = true;
    try { videoEl.pause(); } catch (_) {}
  }

  if (!cinemaEl) {
    showNote();
    return;
  }
  cinemaEl.hidden = false;
  cinemaEl.innerHTML = '';
  gsap.set(cinemaEl, { autoAlpha: 1 });

  const slides = FALLBACK_SLIDES.map((src, i) => {
    const img = document.createElement('img');
    img.className = 'vwish-slide';
    img.src = src;
    img.alt = '';
    img.draggable = false;
    cinemaEl.appendChild(img);
    gsap.set(img, { autoAlpha: i === 0 ? 1 : 0, scale: 1 });
    return img;
  });

  if (cinemaTL) cinemaTL.kill();
  cinemaTL = gsap.timeline({
    onComplete: () => {
      gsap.to(cinemaEl, {
        autoAlpha: 0,
        duration: 0.45,
        ease: 'power2.inOut',
        onComplete: showNote,
      });
    },
  });

  slides.forEach((img, i) => {
    if (i === 0) return;
    const t = i * 2.4;
    cinemaTL
      .to(slides[i - 1], { autoAlpha: 0, duration: 0.7, ease: 'power2.inOut' }, t)
      .fromTo(img, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, ease: 'power2.out' }, t);
  });
  cinemaTL.to({}, { duration: 1.4 });
}

function startVideo() {
  if (!open || starting || noteShown) return;
  starting = true;
  usingFallback = false;
  clearFallbackTimer();
  clearVideoListeners();

  if (cinemaTL) { cinemaTL.kill(); cinemaTL = null; }
  if (cinemaEl) {
    cinemaEl.hidden = true;
    cinemaEl.innerHTML = '';
    gsap.set(cinemaEl, { autoAlpha: 1 });
  }
  if (noteEl) {
    gsap.killTweensOf(noteEl);
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
  videoEl.muted = true;
  videoEl.setAttribute('playsinline', '');
  videoEl.setAttribute('webkit-playsinline', '');

  // Keep video invisible until play actually starts — kills first-frame flash/glitch
  gsap.set(videoEl, { autoAlpha: 0 });

  onEndedBound = () => showNote();
  onErrorBound = () => {
    if (noteShown || usingFallback) return;
    playFallbackCinema();
  };
  videoEl.addEventListener('ended', onEndedBound, { once: true });
  videoEl.addEventListener('error', onErrorBound, { once: true });

  if (!videoEl.getAttribute('src')) {
    videoEl.src = VIDEO_SRC;
  }

  const beginPlayback = () => {
    if (!open || noteShown || usingFallback) return;
    try {
      if (videoEl.currentTime > 0.05) videoEl.currentTime = 0;
    } catch (_) {}

    const p = videoEl.play();
    const reveal = () => {
      starting = false;
      gsap.to(videoEl, { autoAlpha: 1, duration: 0.35, ease: 'power1.out' });
    };

    if (p && typeof p.then === 'function') {
      p.then(reveal).catch(() => {
        if (!noteShown && !usingFallback) playFallbackCinema();
      });
    } else {
      reveal();
    }
  };

  // Prefer canplaythrough when possible; avoid calling load() if already buffered
  if (videoEl.readyState >= 3) {
    beginPlayback();
  } else if (videoEl.readyState >= 2) {
    beginPlayback();
  } else {
    const onCanPlay = () => {
      videoEl.removeEventListener('canplay', onCanPlay);
      beginPlayback();
    };
    videoEl.addEventListener('canplay', onCanPlay, { once: true });
    // Only load if nothing is buffered yet
    if (videoEl.readyState < 1) {
      try { videoEl.load(); } catch (_) {}
    }
    // Slow network only — don't interrupt a successful start
    fallbackTimer = setTimeout(() => {
      if (!open || noteShown || usingFallback) return;
      if (videoEl.readyState < 2 || videoEl.paused) {
        playFallbackCinema();
      }
    }, 8000);
  }
}

export function openVideoWish() {
  if (!modal || open) return;
  open = true;
  noteShown = false;
  starting = false;
  usingFallback = false;
  pushModalHistory('videowish');
  modal.hidden = false;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  // Keep Again hidden under the video/note flow
  const replay = document.getElementById('replay');
  if (replay) {
    replay.classList.remove('is-shown');
    replay.hidden = true;
  }

  if (noteEl) {
    gsap.killTweensOf(noteEl);
    noteEl.hidden = true;
    gsap.set(noteEl, { autoAlpha: 0 });
  }
  if (stage) {
    stage.hidden = false;
    gsap.killTweensOf(stage);
  }
  if (videoEl) gsap.set(videoEl, { autoAlpha: 0 });

  gsap.fromTo(
    stage,
    { autoAlpha: 0, y: 10 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.55,
      ease: 'power2.out',
      clearProps: 'transform',
      onComplete: startVideo,
    }
  );
}

export function closeVideoWish(shouldPopHistory = true) {
  if (!modal || !open) return false;
  open = false;
  starting = false;
  clearFallbackTimer();
  clearVideoListeners();
  if (shouldPopHistory) popModalHistory('videowish');
  if (videoEl) {
    try { videoEl.pause(); } catch (_) {}
    gsap.set(videoEl, { autoAlpha: 1 });
  }
  if (cinemaTL) { cinemaTL.kill(); cinemaTL = null; }
  gsap.killTweensOf(stage);
  gsap.killTweensOf(noteEl);
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  // Restore Again only if the finale already finished before the video opened
  if (window.bdayDone) {
    const replay = document.getElementById('replay');
    if (replay) {
      replay.hidden = false;
      requestAnimationFrame(() => replay.classList.add('is-shown'));
    }
  }
  setTimeout(() => {
    if (!open) modal.hidden = true;
  }, 420);
  return true;
}

export function resetVideoWish() {
  closeVideoWish(false);
  noteShown = false;
  usingFallback = false;
  starting = false;
  if (noteEl) {
    noteEl.hidden = true;
    gsap.set(noteEl, { autoAlpha: 0 });
  }
  if (stage) {
    stage.hidden = false;
    stage.classList.remove('is-to-note');
    gsap.set(stage, { autoAlpha: 1 });
  }
  if (videoEl) gsap.set(videoEl, { autoAlpha: 1 });
}

export function setupVideoWishModal() {
  modal = $('videoWishModal');
  stage = $('vwishStage');
  videoEl = $('vwishVideo');
  cinemaEl = $('vwishCinema');
  noteEl = $('vwishNote');
  closeBtn = $('vwishClose');

  // Warm the video buffer early so open doesn't glitch
  if (videoEl) {
    if (!videoEl.getAttribute('src')) videoEl.src = VIDEO_SRC;
    videoEl.muted = true;
    videoEl.preload = 'auto';
    try { videoEl.load(); } catch (_) {}
  }

  registerModalCloser('videowish', () => closeVideoWish(false));

  if (closeBtn) closeBtn.addEventListener('click', () => closeVideoWish(true));

  const backdrop = $('vwishBackdrop');
  if (backdrop) backdrop.addEventListener('click', () => closeVideoWish(true));
}
