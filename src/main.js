/* ============================================================
   MAIN ENTRY POINT — Orchestrates all screens & interactive features
   ============================================================ */
import gsap from 'gsap';
import { $, reduceMotion, isRecord } from './core/utils.js';
import { initAudioContext } from './core/audio.js';
import { scene3D } from './core/Scene3D.js';
import { Screen1_3DBackground } from './screens/Screen1_3DBackground.js';

// Screens
import {
  initScreen1,
  refreshRig,
  setDraw,
  enter,
  resetScreen1,
  buildMotes,
  getShotGeom,
  autoFire,
  burstHearts,
} from './screens/Screen1_Hero.js';

import {
  initScreen2,
  buildFilm,
  getFilmTL,
  resetScreen2,
} from './screens/Screen2_Wish.js';

import {
  initCakeCelebration,
  resetCakeCelebration,
} from './screens/Screen2_CakeCelebration.js';

import {
  initTree,
  treeStart,
  treeStop,
  drawFinal,
  resizeTree,
  showWish,
  showCake,
} from './screens/Screen3_Tree.js';

import { setupHeartGiftReveal, armHeartGift, resetHeartGift } from './features/HeartGiftReveal.js';
import { setupVideoWishModal, openVideoWish, closeVideoWish, resetVideoWish } from './features/VideoWishModal.js';

import {
  initCarrom,
  // startCarrom,
  resetCarrom,
  resizeCarrom,
} from './screens/Screen3_Carrom.js';

import {
  initFilmography,
  startFilmography,
  resetFilmography,
  resizeFilmography,
} from './screens/Screen3_Filmography.js';

// Interactive Features
import { setupMusicBox, startMusicBox, handleUserActivation } from './features/MusicPlayer.js';
import { setupCake, resetCake } from './features/CakeModal.js';
import { setupGallery, openGallery, closeGallery } from './features/PhotoGallery.js';
import { setupCarromSlide, openCarromSlide, closeCarromSlide } from './features/CarromSlide.js';
import { setupLetter, openLetterModal, closeLetterModal } from './features/LetterModal.js';
import { setupGiftBox, openGiftModal, closeGiftModal } from './features/GiftBox.js';
import { setupLanterns, openLanternModal, closeLanternModal } from './features/SkyLanterns.js';
import { setupConstellation, openConstellationModal, closeConstellationModal } from './features/ConstellationModal.js';
import {
  initCursorCanvas,
  initFireworksCanvas,
  launchMidnightFireworks,
  createFireworkBurst,
  fireworkAt,
} from './features/MagicCursor.js';

let played = false;
let replayArmed = false;

function hideReplayBtn() {
  const replay = $('replay');
  if (!replay) return;
  replay.classList.remove('is-shown');
  replay.hidden = true;
}

function armReplay() {
  // Never show Again while a modal/video is open
  if (document.body.classList.contains('modal-open')) return;
  const replay = $('replay');
  if (replay) {
    replay.hidden = false;
    requestAnimationFrame(() => {
      if (document.body.classList.contains('modal-open')) {
        hideReplayBtn();
        return;
      }
      replay.classList.add('is-shown');
    });
  }
}

function resetAll() {
  treeStop();
  showWish(false);
  showCake(false);
  resetCake();
  resetCarrom();
  resetFilmography();
  resetHeartGift();
  resetVideoWish();
  closeGallery();
  closeCarromSlide();
  closeLetterModal(false);
  closeGiftModal(false);
  closeLanternModal(false);
  closeConstellationModal(false);
  closeVideoWish(false);

  window.bdayDone = false;
  replayArmed = false;
  hideReplayBtn();

  resetScreen2();
  resetScreen1();
  scene3D.registerModule('hero3D', new Screen1_3DBackground());
  played = false;
}

// Global modal openers provided to Cake toast
const modalOpeners = {
  openGallery: (idx) => openGallery(idx),
  openGift: () => openGiftModal(),
  openLantern: () => openLanternModal(),
  openStars: () => openConstellationModal(),
  openLetter: () => openLetterModal(),
};

// 0. Initialize 3D Engine
const webglEl = $('webglCanvas');
let hero3D = null;
if (webglEl) {
  scene3D.init(webglEl);
  hero3D = new Screen1_3DBackground();
  scene3D.registerModule('hero3D', hero3D);
}

// 1. Initialize Screen 1 with fire handler
initScreen1({
  onUserActivation: handleUserActivation,
  onFire: (geom) => {
    played = true;
    if (hero3D) hero3D.disperseAndFade();
    const film = buildFilm(geom, {
      screen1: { burstHearts },
      onCompleteToScreen3: () => {
        // Finale is reached via carrom → tree; keep hook for film rebuild safety
      },
    });
    film.play(0);
  },
});

// 2. Initialize Screen 2 & Cake Celebration
initScreen2();
initCakeCelebration({
  onCelebrationComplete: () => {
    const stardust = $('stardustField');
    if (stardust) {
      gsap.killTweensOf(stardust.querySelectorAll('.stardust-p'));
      stardust.innerHTML = '';
    }
    gsap.set($('field'), { autoAlpha: 0 });
    gsap.to($('bloom'), { autoAlpha: 0, duration: 1.0, ease: 'power2.out' });
    // Screen 3 — VHS filmography (carrom parked below)
    startFilmography();
    // startCarrom();
  },
});

// 3. VHS filmography shelf
initFilmography();

// 3b. Heart Carrom board (parked — restore by swapping startFilmography() for startCarrom())
initCarrom({
  onOpenMemories: (resume) => {
    openGallery(0, { onClose: resume });
  },
  onOpenNSlide: (resume) => {
    openCarromSlide({ onClose: resume });
  },
  onCompleteToTree: () => {
    // Keep Again hidden until the heart finale fully completes
    hideReplayBtn();
    resetHeartGift();
    treeStart();
  },
});

// 4. Initialize Tree finale (Screen 4)
initTree({
  onArmReplay: armReplay,
  onWishShown: (layout) => armHeartGift(layout),
});

// 5. Initialize Interactive Features
setupMusicBox();
setupGallery();
setupCarromSlide();
setupLetter();
setupGiftBox({ fireworkAt });
setupLanterns({ createFireworkBurst });
setupConstellation({ fireworkAt });
setupCake({
  launchFireworks: launchMidnightFireworks,
  modalOpeners,
});
setupVideoWishModal();
setupHeartGiftReveal({
  onOpen: () => openVideoWish(),
});

initCursorCanvas();
initFireworksCanvas();

// Replay button listener
const replayBtn = $('replay');
if (replayBtn) {
  replayBtn.addEventListener('click', resetAll);
}

// Sizing & Boot
let prevW = 0;
let prevH = 0;
const canvas = $('tree');

function resize() {
  if (!canvas) return;
  const curW = canvas.clientWidth;
  const curH = canvas.clientHeight;
  const isInputFocused =
    document.activeElement &&
    (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');

  if (prevW > 0 && Math.abs(curW - prevW) < 10 && isInputFocused) {
    return;
  }
  prevW = curW;
  prevH = curH;

  const isMobile = window.innerWidth <= 768;
  const dpr = isMobile ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 2);

  resizeTree(curW, curH, dpr);
  resizeCarrom();
  resizeFilmography();

  if (reduceMotion) {
    drawFinal();
    return;
  }

  const filmTL = getFilmTL();
  if (played && filmTL && filmTL.isActive()) {
    const at = filmTL.time();
    const newFilm = buildFilm(getShotGeom(curW, curH), {
      onCompleteToScreen3: () => {},
    });
    newFilm.play(at);
  } else if (!played) {
    refreshRig(curW, curH);
    setDraw(0);
  } else {
    gsap.set([$('flood'), $('bloom'), $('field')], { autoAlpha: 0 });
  }
}

let resizeRAF = 0;
window.addEventListener('resize', () => {
  if (resizeRAF) return;
  resizeRAF = requestAnimationFrame(() => {
    resizeRAF = 0;
    resize();
  });
});

// Initial boot
resize();

if (reduceMotion) {
  drawFinal();
} else {
  buildMotes();
  document.fonts &&
    document.fonts.ready.then(() => {
      refreshRig(window.innerWidth, window.innerHeight);
      setDraw(0);
    });
  enter();
}

// Recording hook
if (isRecord) {
  window.bdayAPI = {
    start() {
      autoFire();
    },
    replay() {
      resetAll();
    },
  };
}
