/* ============================================================
   SCREEN 1 COMPONENT — HERO ARCHERY RIG & BEATING HEART
   Cupid, Bow, live SVG bowstring, coded 3D arrow, drag physics.
   ============================================================ */
import gsap from 'gsap';
import { $, rand, pick, clamp } from '../core/utils.js';
import { cue, setRecordT0 } from '../core/audio.js';

let hero, eyebrow, hint, motes, target, targetHeart, heartGlow, aim;
let archery, cupidFlyer, cupidArmWrap, cupidArmImg, bow, arrow, strL, strR, serving, tip;

let svgScale = 1;
let maxDraw = 65;
let curDraw = 0;
let pullUX = -1;
let pullUY = 0;
let played = false;
let drawing = false;
let startPX = 0;
let startPY = 0;
let startDraw = 0;
let beatTL = null;
let onFireCallback = null;
let onUserActivationCallback = null;

const REST_NOCK_X = 986;
const REST_NOCK_Y = 532;
const nockProxy = { x: REST_NOCK_X, y: REST_NOCK_Y };

function applyNock() {
  if (!strL || !strR || !serving) return;
  const nx = nockProxy.x, ny = nockProxy.y;
  strL.setAttribute('x2', nx); strL.setAttribute('y2', ny);
  strR.setAttribute('x2', nx); strR.setAttribute('y2', ny);
  serving.setAttribute('cx', nx); serving.setAttribute('cy', ny);
}

export function buildMotes() {
  if (!motes) return;
  motes.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const m = document.createElement('span');
    m.className = 'mote';
    const s = rand(4, 12);
    m.style.width = m.style.height = `${s}px`;
    m.style.left = `${rand(4, 96)}%`;
    m.style.top = `${rand(10, 96)}%`;
    motes.appendChild(m);
    gsap.set(m, { opacity: rand(0.25, 0.7) });
    gsap.to(m, {
      y: -rand(40, 140),
      x: rand(-30, 30),
      duration: rand(7, 14),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: -rand(0, 8),
    });
    gsap.to(m, {
      opacity: rand(0.1, 0.5),
      duration: rand(2.5, 5),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }
}

export function refreshRig(viewportW = window.innerWidth, viewportH = window.innerHeight) {
  if (!archery || !target) return;
  const W = viewportW;
  const H = viewportH;
  const isMobile = W <= 680;
  const isTablet = W > 680 && W <= 1024;
  const isShort  = H <= 580;

  let cupidX, cupidY;
  if (isMobile) {
    cupidX = Math.max(16, W * 0.08);
    cupidY = isShort ? H * 0.70 : H * 0.72;
  } else if (isTablet) {
    cupidX = Math.max(28, W * 0.12);
    cupidY = isShort ? H * 0.68 : H * 0.70;
  } else {
    cupidX = Math.max(40, W * 0.14);
    cupidY = isShort ? H * 0.67 : H * 0.69;
  }

  nockProxy.x = REST_NOCK_X;
  nockProxy.y = REST_NOCK_Y;
  applyNock();

  gsap.set(archery, { rotation: 0, scale: 1, x: 0, y: 0 });
  archery.style.left = cupidX + 'px';
  archery.style.top  = (cupidY - (archery.offsetHeight || 130) * 0.5) + 'px';
  gsap.set(arrow, { x: 0, y: 0 });
  if (cupidArmWrap) gsap.set(cupidArmWrap, { x: 0, y: 0, rotation: 0 });

  const aR = archery.getBoundingClientRect();
  const tRect = target.getBoundingClientRect();
  const tcx = tRect.left + tRect.width / 2;
  const tcy = tRect.top + tRect.height / 2;

  svgScale = aR.width / 1316;
  const bowScreenX = aR.left + (986 / 1316) * aR.width;
  const bowScreenY = aR.top  + (532 / 1195) * aR.height;

  const aimRad = Math.atan2(tcy - bowScreenY, tcx - bowScreenX);
  const aimDeg = aimRad * 180 / Math.PI;

  const aimer = $('cupidAim') || cupidFlyer;
  if (aimer) {
    gsap.set(aimer, { rotation: aimDeg, transformOrigin: '75.0% 44.5%' });
  }

  pullUX = -Math.cos(aimRad);
  pullUY = -Math.sin(aimRad);

  maxDraw = Math.min(aR.width * 0.22, 36);
  curDraw = 0;
}

export function setDraw(d) {
  curDraw = clamp(d, 0, maxDraw);
  gsap.set(arrow, { x: -curDraw, y: 0 });
  if (cupidArmWrap) {
    gsap.set(cupidArmWrap, {
      x: -curDraw * 0.98,
      y: curDraw * 0.04,
      rotation: curDraw * 0.02,
    });
  }
  const sc = svgScale || 0.15;
  nockProxy.x = REST_NOCK_X - (curDraw / sc);
  nockProxy.y = REST_NOCK_Y + (curDraw / sc) * 0.08;
  applyNock();
  gsap.set(aim, { opacity: 0.75 + 0.25 * (curDraw / maxDraw) });
}

export function startBeat() {
  if (!targetHeart || !heartGlow) return;
  gsap.set(targetHeart, { scale: 1 });
  gsap.set(heartGlow, { scale: 1, opacity: 0.7 });
  beatTL = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
  beatTL.to(targetHeart, { scale: 1.07, duration: 0.13, ease: 'power2.out' }, 0)
        .to(heartGlow,   { scale: 1.15, opacity: 0.9, duration: 0.13, ease: 'power2.out' }, 0)
        .to(targetHeart, { scale: 1.0, duration: 0.2, ease: 'power2.in' }, 0.13)
        .to(targetHeart, { scale: 1.05, duration: 0.12, ease: 'power2.out' }, 0.3)
        .to(targetHeart, { scale: 1.0, duration: 0.5, ease: 'power2.inOut' }, 0.42)
        .to(heartGlow,   { scale: 1.0, opacity: 0.7, duration: 0.7, ease: 'power2.inOut' }, 0.3);
}

export function stopBeat() {
  if (beatTL) {
    beatTL.kill();
    beatTL = null;
  }
  if (targetHeart) gsap.set(targetHeart, { scale: 1 });
}

function miniHeartSVG(fill) {
  return `<svg viewBox="0 0 24 22" width="100%" height="100%"><path d="M12 20C5.5 15 1.5 11.4 1.5 6.9 1.5 3.6 4 1.5 7 1.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3 0 5.5 2.1 5.5 5.4C23.5 11.4 19.5 15 12 20Z" fill="${fill}"/></svg>`;
}

export function burstHearts() {
  if (!target || !hero) return;
  const r = target.getBoundingClientRect();
  const hr = hero.getBoundingClientRect();
  const ox = r.left - hr.left + r.width / 2;
  const oy = r.top - hr.top + r.height * 0.42;
  const cols = ['#ff6f97', '#ffb14e', '#ff8fae', '#ffd36a', '#e23b67'];
  const frag = document.createDocumentFragment();
  const nodes = [];
  for (let i = 0; i < 12; i++) {
    const heart = i < 8;
    const el = document.createElement('span');
    el.className = 'burst';
    const s = heart ? rand(12, 22) : rand(4, 8);
    el.style.cssText = `position:absolute;left:${ox}px;top:${oy}px;width:${s}px;height:${s}px;margin:${-s / 2}px 0 0 ${-s / 2}px;pointer-events:none;z-index:4;`;
    if (heart) el.innerHTML = miniHeartSVG(pick(cols));
    else {
      el.style.borderRadius = '50%';
      el.style.background = 'radial-gradient(circle,#fff,rgba(255,210,150,0) 70%)';
    }
    frag.appendChild(el);
    nodes.push({ el, heart });
  }
  hero.appendChild(frag);
  nodes.forEach(({ el, heart }) => {
    const ang = rand(-Math.PI, 0);
    const dist = rand(heart ? 70 : 40, heart ? 190 : 120);
    gsap.to(el, {
      x: Math.cos(ang) * dist,
      y: Math.sin(ang) * dist - rand(10, 50),
      rotation: rand(-120, 120),
      scale: heart ? rand(0.7, 1.2) : rand(0.4, 1),
      duration: rand(0.7, 1.15),
      ease: 'power2.out',
    });
    gsap.to(el, {
      opacity: 0,
      duration: 0.5,
      delay: rand(0.35, 0.6),
      ease: 'power1.in',
      onComplete: () => el.remove(),
    });
  });
}

export function getShotGeom(viewportW = window.innerWidth, viewportH = window.innerHeight) {
  const tipR = tip.getBoundingClientRect();
  const tRect = target.getBoundingClientRect();
  const tipX = tipR.left + tipR.width / 2;
  const tipY = tipR.top + tipR.height / 2;
  const tcx = tRect.left + tRect.width / 2;
  const tcy = tRect.top + tRect.height / 2;
  const flightDist = Math.hypot(tcx - tipX, tcy - tipY);
  const fallPx = Math.min(viewportH * 0.26, viewportH - tcy - tRect.height * 0.4);
  const impactX = tcx;
  const impactY = tcy + fallPx;
  const distC = Math.hypot(Math.max(impactX, viewportW - impactX), Math.max(impactY, viewportH - impactY));
  const reach = Math.hypot(viewportW / 2, viewportH / 2);

  return {
    arrowStartX: -curDraw,
    arrowFlyX:   -curDraw + flightDist,
    drawnNockX:  nockProxy.x,
    drawnNockY:  nockProxy.y,
    fallPx,
    fx: impactX - viewportW / 2,
    fy: impactY - viewportH / 2,
    floodScale: (distC * 1.55) / 52,
    bloomScale: (reach * 1.2) / 30,
    REST_NOCK_X,
    REST_NOCK_Y,
    applyNock,
  };
}

export function fire() {
  if (played) return;
  played = true;
  drawing = false;
  if (onUserActivationCallback) onUserActivationCallback();
  stopBeat();
  cue('release');
  cue('whoosh');

  if (onFireCallback) {
    onFireCallback(getShotGeom());
  }
}

export function springBack() {
  const from = curDraw;
  gsap.to({ d: from }, {
    d: 0,
    duration: 0.55,
    ease: 'elastic.out(1,0.4)',
    onUpdate() { setDraw(this.targets()[0].d); },
  });
}

export function autoFire() {
  if (played) return;
  if (onUserActivationCallback) onUserActivationCallback();
  setRecordT0(performance.now());
  cue('draw');
  gsap.to({ d: curDraw }, {
    d: maxDraw * 0.94,
    duration: 0.62,
    ease: 'power2.inOut',
    onUpdate() { setDraw(this.targets()[0].d); },
    onComplete: () => gsap.delayedCall(0.16, fire),
  });
}

export function enter() {
  if (onUserActivationCallback) onUserActivationCallback();
  gsap.set(hero, { autoAlpha: 1 });
  refreshRig();
  setDraw(0);
  gsap.set([eyebrow, hint], { opacity: 0, y: 14 });
  gsap.set(target, { opacity: 0, y: 10, scaleX: 0.9, scaleY: 0.9 });
  gsap.set(archery, { opacity: 0, scale: 0.88 });
  gsap.set(heartGlow, { opacity: 0, scale: 1 });
  gsap.set(arrow, { opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });

  const tl = gsap.timeline({ onComplete: startBeat });
  tl.to(target,   { opacity: 1, y: 0, scaleX: 1, scaleY: 1, duration: 0.8, ease: 'power3.out' }, 0.1)
    .to(heartGlow,{ opacity: 0.7, duration: 0.8, ease: 'power2.out' }, 0.2)
    .to(archery,  { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }, 0.28)
    .to(eyebrow,  { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.4)
    .to(hint,     { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.7);
}

export function resetScreen1() {
  played = false;
  drawing = false;
  curDraw = 0;
  gsap.set(arrow, { opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });
  if (cupidArmWrap) gsap.set(cupidArmWrap, { x: 0, y: 0, rotation: 0 });
  enter();
}

export function initScreen1({ onFire, onUserActivation } = {}) {
  hero        = $('hero');
  eyebrow     = $('eyebrow');
  hint        = $('hint');
  motes       = $('motes');
  target      = $('target');
  targetHeart = $('targetHeart');
  heartGlow   = target ? target.querySelector('.heart__glow') : null;
  aim         = $('aim');
  archery     = $('archery');
  cupidFlyer  = $('cupidAim') || $('cupidFlyer');
  cupidArmWrap= $('cupidArmWrap');
  cupidArmImg = $('cupidArmImg');
  bow         = $('bow');
  arrow       = $('arrow');
  strL        = $('strL');
  strR        = $('strR');
  serving     = $('serving');
  tip         = $('tip');

  onFireCallback = onFire;
  onUserActivationCallback = onUserActivation;

  if (hero) {
    hero.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!played && (e.target === hero || (e.target.classList && (e.target.classList.contains('hero__bg') || e.target.classList.contains('hero__vignette') || e.target.classList.contains('hero__floaters'))))) {
        if (onUserActivationCallback) onUserActivationCallback();
        autoFire();
      }
    });
  }

  if (target) {
    target.style.pointerEvents = 'auto';
    target.style.cursor = 'pointer';
    target.addEventListener('pointerdown', () => {
      if (onUserActivationCallback) onUserActivationCallback();
    });
    target.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onUserActivationCallback) onUserActivationCallback();
      if (!played) autoFire();
    });
  }

  if (archery) {
    archery.addEventListener('pointerdown', (e) => {
      if (played) return;
      if (onUserActivationCallback) onUserActivationCallback();
      drawing = true;
      try { archery.setPointerCapture(e.pointerId); } catch (_) {}
      startPX = e.clientX;
      startPY = e.clientY;
      startDraw = curDraw;
      e.preventDefault();
    });

    archery.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const proj = (e.clientX - startPX) * pullUX + (e.clientY - startPY) * pullUY;
      setDraw(startDraw + proj);
    });

    const endDraw = (e) => {
      if (!drawing) return;
      drawing = false;
      const dist = e && e.clientX !== undefined ? Math.hypot(e.clientX - startPX, e.clientY - startPY) : 0;
      if (curDraw > maxDraw * 0.22) {
        fire();
      } else if (dist < 10) {
        autoFire();
      } else {
        springBack();
      }
    };

    archery.addEventListener('pointerup', endDraw);
    archery.addEventListener('pointercancel', endDraw);
    archery.addEventListener('keydown', (e) => {
      if (played) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        autoFire();
      }
    });
  }
}
