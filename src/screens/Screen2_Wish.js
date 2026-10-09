/* ============================================================
   SCREEN 2 COMPONENT — HEART FLOOD TRANSITION & THE WISH FIELD
   Heart transition, 70mm letterbox, kinetic typography, wave & cake.
   ============================================================ */
import gsap from 'gsap';
import { $, rand, pick } from '../core/utils.js';
import { cue } from '../core/audio.js';
import { armCakeBlowPrompt, resetCakeCelebration, startCakeFloat, stopCakeFloat } from './Screen2_CakeCelebration.js';

let flood, field, camera, stardustField, wishSparkles;
let kEyebrow, kEyebrowBox, s2Subtitle, s2AnuStage, barTop, barBot, uline, ulineSpark, bloom;
let s2CakeWrap, s2WaveWrap;
let line1Chars = [], line2Chars = [], kChars = [];
let filmTL = null;

function splitWord(el, isBirthday = false) {
  if (!el) return [];
  const chars = [...el.textContent];
  el.textContent = '';
  return chars.map((c, idx) => {
    const s = document.createElement('span');
    s.className = 'hl__ch';
    if (isBirthday) {
      if (c.toLowerCase() === 'i') s.classList.add('hl__ch--heart-i');
      if (c.toLowerCase() === 'y' && idx === chars.length - 1) s.classList.add('hl__ch--heart-y');
    }
    s.textContent = c === ' ' ? ' ' : c;
    el.appendChild(s);
    return s;
  });
}

export function spawnStardustField() {
  if (!stardustField) return;
  stardustField.innerHTML = '';
  const isMobile = window.innerWidth <= 768;
  const count = isMobile ? 18 : 36;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'stardust-p';
    const s = rand(2.2, 5.5);
    p.style.width = `${s}px`;
    p.style.height = `${s}px`;
    p.style.left = `${rand(3, 97)}%`;
    p.style.top = `${rand(12, 78)}%`;
    p.style.opacity = '0';
    stardustField.appendChild(p);

    gsap.to(p, {
      y: rand(-25, -60),
      x: rand(-16, 16),
      opacity: rand(0.35, 0.95),
      duration: rand(2.2, 4.0),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: rand(0, 1.2),
    });
  }
}

export function spawnWishBurst() {
  if (!wishSparkles) return;
  wishSparkles.innerHTML = '';
}

export function buildFilm(m, { screen1, onCompleteToScreen3 } = {}) {
  const target = $('target');
  const arrow = $('arrow');
  const aim = $('aim');
  const eyebrow = $('eyebrow');
  const hint = $('hint');
  const cupidArmWrap = $('cupidArmWrap');
  const hero = $('hero');

  const nockProxy = { x: m.drawnNockX, y: m.drawnNockY };
  const applyNock = m.applyNock || (() => {});

  const t = gsap.timeline({
    paused: true,
    onComplete: () => {
      if (field) field.style.pointerEvents = 'auto';
      filmTL = null;
    },
  });

  // reset (t=0)
  if (field) field.style.pointerEvents = 'none';
  t.set(target, { y: 0, scaleX: 1, scaleY: 1, opacity: 1 })
   .set(arrow, { opacity: 1, x: m.arrowStartX, y: 0, scaleX: 1, scaleY: 1, rotation: 0 })
   .set([flood, bloom], { autoAlpha: 0, scale: 0.001, x: 0, y: 0 })
   .set(flood, { x: m.fx, y: m.fy })
   .set(field, { autoAlpha: 0 })
   .set('.blob', { opacity: 0 })
   .set(camera, { scale: 1, yPercent: 0 })
   .set(kEyebrow, { opacity: 0, y: 12 })
   .set(kChars, { transformPerspective: 1000, transformOrigin: '50% 100%', yPercent: 55, rotationX: -45, opacity: 0, scale: 0.88 })
   .set(uline, { drawn: 0 });
  if (s2Subtitle) t.set(s2Subtitle, { opacity: 0, y: 10 });
  if (s2AnuStage) t.set(s2AnuStage, { opacity: 0 });
  if (kEyebrowBox) t.set(kEyebrowBox, { opacity: 0, y: 12 });
  stopCakeFloat();
  if (s2CakeWrap) t.set(s2CakeWrap, { opacity: 0, y: 24, scale: 0.95 });
  if (s2WaveWrap) t.set(s2WaveWrap, { opacity: 0, y: 18 });
  if (ulineSpark) t.set(ulineSpark, { opacity: 0, x: 0, y: 16 });

  // --- the shot: string snaps (twang), arrow flies into the heart ------------
  t.fromTo(nockProxy, { x: m.drawnNockX, y: m.drawnNockY || m.REST_NOCK_Y }, { x: m.REST_NOCK_X, y: m.REST_NOCK_Y, duration: 0.45, ease: 'elastic.out(1,0.34)', onUpdate: applyNock }, 0)
   .to(arrow, { x: m.arrowFlyX, duration: 0.24, ease: 'power2.in' }, 0)
   .to(arrow, { scaleX: 1.12, duration: 0.12, ease: 'power2.in' }, 0)
   .to(arrow, { scaleX: 1.0, duration: 0.1, ease: 'power1.out' }, 0.14)
   .to(aim, { opacity: 0, duration: 0.16 }, 0)
   .to([eyebrow, hint], { opacity: 0, duration: 0.18, ease: 'power1.out' }, 0);

  if (cupidArmWrap) {
    t.to(cupidArmWrap, { x: 2, y: 0, rotation: 0.5, duration: 0.08, ease: 'power2.out' }, 0)
     .to(cupidArmWrap, { x: 0, y: 0, rotation: 0, duration: 0.38, ease: 'elastic.out(1.2, 0.4)' }, 0.08);
  }

  // --- the strike: the arrow embeds, the heart recoils, then holds pierced --
  if (screen1 && screen1.burstHearts) {
    t.add(screen1.burstHearts, 0.24);
  }
  t.to(target, { x: 6, y: -3, duration: 0.06, ease: 'power2.out' }, 0.24)
   .to(target, { x: 0, y: 0, duration: 0.24, ease: 'power2.out' }, 0.30)
   .to(target, { scale: 1.12, duration: 0.06, ease: 'power2.out' }, 0.24)
   .to(target, { scale: 1.0, duration: 0.22, ease: 'power2.inOut' }, 0.30)
   .to(arrow, { rotation: '+=4', duration: 0.05, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.25)
   .set(arrow, { rotation: 0 }, 0.45)
   .to(arrow, { opacity: 0, duration: 0.14, ease: 'power1.out' }, 0.48);

  // --- the fall + the burst / flood -----------------------------------------
  t.to(target, { y: m.fallPx, scaleX: 0.88, scaleY: 1.25, duration: 0.28, ease: 'power1.in' }, 0.50)
   .to(target, { scaleX: 1.35, scaleY: 0.65, duration: 0.06, ease: 'power2.out' }, 0.78)
   .set(flood, { autoAlpha: 1, opacity: 1 }, 0.80)
   .fromTo(flood, { scale: 0.02 }, { scale: m.floodScale, duration: 0.34, ease: 'power2.in' }, 0.80)
   .to(target, { opacity: 0, duration: 0.06, ease: 'power1.out' }, 0.82);

  // seam: the field is revealed as the heart-shaped flood expands across the screen
  t.set(field, { autoAlpha: 1 }, 1.08)
   .set(hero, { autoAlpha: 0 }, 1.09)
   .to('.blob', { opacity: 1, duration: 0.5, ease: 'power2.out' }, 1.10)
   .call(spawnStardustField, null, 1.10);

  if (s2WaveWrap) {
    t.to(s2WaveWrap, { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' }, 1.10);
  }
  if (s2CakeWrap) {
    t.to(
      s2CakeWrap,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.75,
        ease: 'back.out(1.2)',
        onComplete: startCakeFloat,
      },
      1.15
    );
  }

  t.to(flood, { opacity: 0, duration: 0.22, ease: 'power1.out' }, 1.10)
   .set(flood, { autoAlpha: 0 }, 1.32);

  // --- the camera push -------------------------------------------------------
  t.fromTo(camera, { scale: 1.0, yPercent: 0 }, { scale: 1.05, yPercent: -1.0, duration: 3.8, ease: 'none' }, 1.10);
  if (stardustField) {
    t.fromTo(stardustField, { xPercent: 0, yPercent: 0 }, { xPercent: -1.2, yPercent: -0.8, duration: 3.8, ease: 'none' }, 1.10);
  }

  // beat markers for audio recorder
  t.call(cue, ['hit'], 0.24)
   .call(cue, ['flood'], 0.80)
   .call(cue, ['wish'], 1.25)
   .call(cue, ['wish2'], 1.48);

  // kinetic wish reveal — smooth, snappy, natural pacing
  t.to(kEyebrow, { opacity: 1, y: 0, duration: 0.42, ease: 'power3.out' }, 1.18);
  if (kEyebrowBox) {
    t.to(kEyebrowBox, { opacity: 1, y: 0, duration: 0.42, ease: 'power3.out' }, 1.18);
  }

  t.to(line1Chars, { yPercent: 0, rotationX: 0, opacity: 1, scale: 1, duration: 0.52, ease: 'back.out(1.4)', stagger: 0.028 }, 1.25)
   .to(line2Chars, { yPercent: 0, rotationX: 0, opacity: 1, scale: 1, duration: 0.52, ease: 'back.out(1.4)', stagger: 0.025 }, 1.48)
   .to(uline, { drawn: 1, duration: 0.52, ease: 'power2.inOut' }, 1.75);

  if (ulineSpark) {
    t.to(ulineSpark, { opacity: 1, duration: 0.1 }, 1.75)
     .fromTo(ulineSpark, { x: 0, y: 16 }, { x: 280, y: 18, duration: 0.52, ease: 'power2.inOut' }, 1.75)
     .to(ulineSpark, { opacity: 0, duration: 0.2 }, 2.22);
  }

  // Right down to the looped heart line: "Someone Worth Celebrating"
  if (s2Subtitle) {
    t.to(s2Subtitle, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 1.90);
  }

  t.call(spawnWishBurst, null, 1.85)
   .call(() => {
     armCakeBlowPrompt();
   }, null, 2.20);

  filmTL = t;
  return t;
}

export function getFilmTL() {
  return filmTL;
}

export function resetScreen2() {
  if (filmTL) {
    filmTL.pause(0);
    filmTL = null;
  }
  if (field) {
    field.style.pointerEvents = 'none';
    gsap.set(field, { autoAlpha: 0 });
  }
  if (stardustField) stardustField.innerHTML = '';
  if (wishSparkles) wishSparkles.innerHTML = '';
  stopCakeFloat();
  if (s2CakeWrap) gsap.set(s2CakeWrap, { opacity: 0, y: 35, scale: 0.94 });
  if (s2WaveWrap) gsap.set(s2WaveWrap, { opacity: 0, y: 25 });
  if (kEyebrowBox) gsap.set(kEyebrowBox, { opacity: 0, y: 14 });
  if (s2Subtitle) gsap.set(s2Subtitle, { opacity: 0, y: 10 });
  if (s2AnuStage) gsap.set(s2AnuStage, { opacity: 0 });
  const s2Left = $('s2AnuSideLeft');
  const s2Right = $('s2AnuSideRight');
  if (s2Left) gsap.set(s2Left, { opacity: 0 });
  if (s2Right) gsap.set(s2Right, { opacity: 0 });
  resetCakeCelebration();
  gsap.set([flood, bloom], { autoAlpha: 0 });
}

export function initScreen2() {
  flood        = $('flood');
  field        = $('field');
  camera       = $('camera');
  stardustField= $('stardustField');
  wishSparkles = $('wishSparkles');
  kEyebrow     = $('kEyebrow');
  kEyebrowBox  = $('kEyebrowBox');
  s2Subtitle   = $('s2Subtitle');
  s2AnuStage   = $('s2AnuStage');
  barTop       = $('barTop');
  barBot       = $('barBot');
  bloom        = $('bloom');
  s2CakeWrap   = $('s2CakeWrap');
  s2WaveWrap   = $('s2WaveWrap');

  const ulineEl = $('uline');
  uline = ulineEl ? ulineEl.querySelector('.uline__path') : null;
  ulineSpark = $('ulineSpark');

  const wLine1 = $('wLine1');
  const wLine2 = $('wLine2');
  if (wLine1 && wLine2) {
    line1Chars = splitWord(wLine1, false);
    line2Chars = splitWord(wLine2, true);
    kChars = [...line1Chars, ...line2Chars];
  }
}
