/* Opened sketchbook: nested-strip page curl, her plates only. */
import './AzhagiiiSketchbook.css';

const PHOTOS = [
  '/photos/az-book/p0.png?v=3',
  '/photos/az-book/p1.png?v=3',
  '/photos/az-book/p2.png?v=3',
];
const SKETCHES = [
  '/photos/az-book/sketches/marina-bay-sands.png',
  '/photos/az-book/sketches/gardens-by-the-bay.png',
  '/photos/az-book/sketches/merlion.png',
  '/photos/az-book/sketches/buddha-tooth.png',
  '/photos/az-book/sketches/joo-chiat.png',
  '/photos/az-book/sketches/lau-pa-sat.png',
  '/photos/az-book/sketches/marina-bay-skyline.png',
  '/photos/az-book/sketches/singapore-river.png',
  '/photos/az-book/sketches/botanic-gardens.png',
];
const PHOTO_N = PHOTOS.length;
const SKETCH_N = SKETCHES.length;
const LAND = 6;
const SPAN = 0.449;
const BETA = 0.6;
const TILT_X = 4.5;
const TILT_Y = 7;

let overlay, wrap, stage, sb3d, book, leftBtn, rightBtn;
let idx = 0;
let turn = null;
let strips = [];
let spring = null;
let raf = null;
let last = 0;
let drag = null;
let bound = false;
let open = false;
let closing = false;
let reduced = false;
let closeWait = null;
let introOn = false;
let riffle = null;
let riffleAt = 0;
let introQueued = false;

const view = { rx: 0, ry: 0, z: 1, trx: 0, try_: 0, tz: 1 };
let viewActive = false;

function el(t, c) {
  const e = document.createElement(t);
  if (c) e.className = c;
  return e;
}

function wrapN() {
  return introOn ? SKETCH_N : PHOTO_N;
}

function stripCount() {
  return window.matchMedia('(pointer: coarse)').matches ? 12 : 18;
}

function useBlur() {
  return !window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches;
}

function phonePortrait() {
  return window.matchMedia('(orientation: portrait) and (max-width: 900px)').matches;
}

function syncRotate() {
  if (!overlay) return;
  const need = open && phonePortrait();
  overlay.classList.toggle('need-rotate', need);
  if (!need && introQueued && open && !reduced) {
    introQueued = false;
    startIntro();
  }
}

function sketchUrl(i) {
  const n = SKETCH_N;
  return SKETCHES[((i % n) + n) % n];
}

function photoUrl(i) {
  const n = PHOTO_N;
  return PHOTOS[((i % n) + n) % n];
}

function faceUrl(i) {
  if (turn) {
    if (i === turn.from && turn.fromUrl) return turn.fromUrl;
    if (i === turn.to && turn.toUrl) return turn.toUrl;
  }
  return introOn ? sketchUrl(i) : photoUrl(i);
}

function imgEl(i, side) {
  const im = new Image();
  im.className = 'sb-half-img ' + side;
  im.draggable = false;
  im.alt = '';
  im.src = faceUrl(i);
  return im;
}

function halfEl(pos, i) {
  const d = el('div', 'sb-half ' + pos);
  d.appendChild(imgEl(i, pos));
  d.appendChild(el('div', 'gutter-shade ' + pos));
  return d;
}

function buildCurl(dir, from, to) {
  strips = [];
  const n = stripCount();
  const c = el('div', 'curl ' + dir);
  c.style.setProperty('--n', n);
  c.style.setProperty('--span', SPAN);
  let host = c;
  for (let i = 0; i < n; i++) {
    const s = el('div', 'strip');
    s.style.setProperty('--i', i);
    const gut = 'calc(var(--bw) * 0.5)';
    const sw = 'calc(var(--bw) * ' + SPAN + ' / ' + n + ')';
    const A = 'calc(-1 * (' + gut + ' + ' + i + ' * ' + sw + '))';
    const B = 'calc(' + (i + 1) + ' * ' + sw + ' - ' + gut + ')';
    const f = el('div', 'face front');
    const b = el('div', 'face back');
    const dress = (e, url, px) => {
      e.style.backgroundImage = 'url("' + url + '")';
      e.style.backgroundPositionX = px;
    };
    dress(f, faceUrl(from), dir === 'next' ? A : B);
    dress(b, faceUrl(to), dir === 'next' ? B : A);
    f.appendChild(el('div', 'sh'));
    f.appendChild(el('div', 'gl'));
    b.appendChild(el('div', 'sh'));
    b.appendChild(el('div', 'gl'));
    s.appendChild(f);
    s.appendChild(b);
    if (i === n - 1) s.classList.add('edge');
    host.appendChild(s);
    host = s;
    strips.push(s);
  }
  return c;
}

function applyTurn(t) {
  const th = Math.PI * t;
  const beta = BETA * Math.sin(Math.PI * t);
  const D = 180 / Math.PI;
  const n = strips.length || stripCount();
  const tt = th + beta;
  const td = (2 * beta) / n;
  sb3d.style.setProperty('--tt', (tt * D).toFixed(2) + 'deg');
  sb3d.style.setProperty('--td', (td * D).toFixed(3) + 'deg');
  sb3d.style.setProperty('--shade', Math.sin(Math.PI * t).toFixed(3));
  for (let i = 0; i < strips.length; i++) {
    const l1 = Math.abs(Math.cos(tt - i * td));
    const l2 = Math.abs(Math.cos(tt - (i + 1) * td));
    const st = strips[i].style;
    st.setProperty('--lit', l1.toFixed(3));
    st.setProperty('--a1', ((1 - l1) * 0.62).toFixed(3));
    st.setProperty('--a2', ((1 - l2) * 0.62).toFixed(3));
  }
}

function layout() {
  if (!sb3d || !book) return;
  sb3d.style.setProperty('--bw', book.clientWidth + 'px');
}

function paint() {
  if (!book) return;
  book.textContent = '';
  if (!turn) {
    const f = el('div', 'sb-full');
    const im = new Image();
    im.src = faceUrl(idx);
    im.alt = '';
    im.draggable = false;
    f.appendChild(im);
    book.appendChild(f);
    sb3d.style.setProperty('--shade', '0');
  } else {
    const next = turn.dir === 'next';
    book.appendChild(halfEl('left', next ? turn.from : turn.to));
    book.appendChild(halfEl('right', next ? turn.to : turn.from));
    book.appendChild(buildCurl(turn.dir, turn.from, turn.to));
    applyTurn(turn.t);
  }
  const a = el('button', 'sb-zone sb-prev');
  const b = el('button', 'sb-zone sb-next');
  a.setAttribute('aria-label', 'previous page');
  b.setAttribute('aria-label', 'next page');
  a.type = 'button';
  b.type = 'button';
  book.appendChild(a);
  book.appendChild(b);
  layout();
}

function animateTo(target, onDone, stiff, damp) {
  spring = { kind: 'spring', v: 0, target, done: onDone, k: stiff || 150, c: damp || 22 };
  kick();
}

function applyView() {
  sb3d.style.setProperty('--rx', view.rx.toFixed(2) + 'deg');
  sb3d.style.setProperty('--ry', view.ry.toFixed(2) + 'deg');
  sb3d.style.setProperty('--zoom', view.z.toFixed(3));
}

function viewSpring() {
  const e = 0.14;
  let moved = false;
  for (const [k, t] of [['rx', 'trx'], ['ry', 'try_'], ['z', 'tz']]) {
    const d = view[t] - view[k];
    if (Math.abs(d) > 0.0006) {
      view[k] += d * e;
      moved = true;
    } else view[k] = view[t];
  }
  if (moved) applyView();
  viewActive = moved;
  return moved;
}

function setView(rx, ry, z) {
  view.trx = Math.max(-TILT_X, Math.min(TILT_X, rx));
  view.try_ = Math.max(-TILT_Y, Math.min(TILT_Y, ry));
  view.tz = Math.max(0.9, Math.min(1.15, z));
  viewActive = true;
  kick();
}

function tiltTo(cx, cy) {
  if (drag || !book) return;
  const r = book.getBoundingClientRect();
  if (!r.width) return;
  const nx = Math.max(-1, Math.min(1, (cx - (r.left + r.width / 2)) / (r.width * 0.62)));
  const ny = Math.max(-1, Math.min(1, (cy - (r.top + r.height / 2)) / (r.height * 0.9)));
  setView(-ny * TILT_X, nx * TILT_Y, view.tz);
}

function tick(now) {
  raf = null;
  const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
  last = now;
  if (spring && turn) {
    const s = spring;
    if (s.kind === 'tween') {
      s.e += dt;
      const k = Math.min(1, s.e / s.dur);
      turn.t = s.from + (s.target - s.from) * k;
      applyTurn(turn.t);
      if (k >= 1) {
        spring = null;
        const d = s.done;
        d && d();
      }
    } else {
      const x = turn.t - s.target;
      s.v += (-s.k * x - s.c * s.v) * dt;
      turn.t += s.v * dt;
      if (Math.abs(turn.t - s.target) < 0.002 && Math.abs(s.v) < 0.02) {
        turn.t = s.target;
        spring = null;
        applyTurn(turn.t);
        const d = s.done;
        d && d();
      } else applyTurn(turn.t);
    }
  }
  viewSpring();
  if ((spring || viewActive || introOn) && raf === null) raf = requestAnimationFrame(tick);
}

function tweenTo(target, dur, onDone) {
  spring = { kind: 'tween', from: turn ? turn.t : 0, target, dur, e: 0, done: onDone };
  kick();
}

function endIntro(reset) {
  introOn = false;
  riffle = null;
  wrap?.classList.remove('intro', 'b2');
  if (reset) idx = 0;
}

function riffleStep() {
  if (!introOn || !riffle) return;
  const s = riffle[riffleAt];
  const last = riffleAt === riffle.length - 1;
  wrap?.classList.toggle('b2', !last && s.bell > 0.55);
  if (last) {
    wrap?.classList.remove('intro', 'b2');
    startTurn('next', 0, {
      from: sketchUrl(idx),
      to: photoUrl(0),
      toIndex: 0,
    });
  } else {
    startTurn('next', 0);
  }
  tweenTo(1, s.dur, () => {
    idx = turn.to;
    turn = null;
    riffleAt += 1;
    if (introOn && riffleAt < riffle.length) {
      paint();
      riffleStep();
    } else {
      endIntro();
      idx = 0;
      paint();
    }
  });
}

function startIntro() {
  if (reduced) {
    endIntro(true);
    paint();
    return;
  }
  if (!riffle) {
    const steps = SKETCH_N + LAND;
    riffle = [];
    for (let r = 0; r < steps; r++) {
      const bell = Math.sin(Math.PI * (r / Math.max(1, steps - 1)));
      riffle.push({ bell, dur: 0.26 - 0.19 * bell });
    }
    riffleAt = 0;
    introOn = true;
    if (useBlur()) wrap?.classList.add('intro');
  }
  riffleStep();
}

function kick() {
  if (raf === null) {
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
}

function startTurn(dir, t, urls) {
  spring = null;
  if (turn) {
    idx = turn.to;
    turn = null;
  }
  const n = wrapN();
  const from = idx;
  const to = dir === 'next' ? (from + 1) % n : (from - 1 + n) % n;
  turn = {
    dir,
    from,
    to: urls && urls.toIndex != null ? urls.toIndex : to,
    t: t || 0,
    fromUrl: urls?.from || (introOn ? sketchUrl(from) : photoUrl(from)),
    toUrl: urls?.to || (introOn ? sketchUrl(to) : photoUrl(to)),
  };
  paint();
}

function commit() {
  if (!turn) return;
  if (reduced) {
    idx = turn.to;
    turn = null;
    paint();
    return;
  }
  animateTo(1, () => {
    idx = turn.to;
    turn = null;
    paint();
  }, 170, 26);
  kick();
}

function cancel() {
  if (!turn) return;
  animateTo(0, () => {
    turn = null;
    paint();
  }, 150, 24);
  kick();
}

function step(dir) {
  if (introOn) endIntro(true);
  if (turn) {
    idx = turn.to;
    turn = null;
  }
  startTurn(dir, 0);
  commit();
}

function bookRect() {
  return book.getBoundingClientRect();
}

function onStageDown(e) {
  if (!open || e.button !== 0) return;
  if (e.target.closest('.az-sketch__close, .sb-arrow')) return;
  e.preventDefault();
  if (introOn) {
    endIntro(true);
    paint();
    return;
  }
  const onBook = e.target.closest('.sb-zone');
  try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  if (!onBook) return;
  const r = bookRect();
  const dir = (e.clientX - r.left) / r.width > 0.5 ? 'next' : 'prev';
  startTurn(dir, 0);
  drag = { dir, x0: e.clientX, w: r.width, moved: 0, vel: 0, tPrev: performance.now() };
}

function onStageMove(e) {
  if (!open) return;
  if (e.pointerType !== 'touch') tiltTo(e.clientX, e.clientY);
  if (!drag) return;
  const dx = e.clientX - drag.x0;
  drag.moved = Math.max(drag.moved, Math.abs(dx));
  const raw = (drag.dir === 'next' ? -dx : dx) / (drag.w * 0.62);
  const t = Math.max(0, Math.min(1, raw));
  const now = performance.now();
  drag.vel = (t - (turn ? turn.t : 0)) / Math.max(0.001, (now - drag.tPrev) / 1000);
  drag.tPrev = now;
  if (turn) {
    turn.t = t;
    applyTurn(t);
  }
}

function endDrag() {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (!turn) return;
  if (d.moved < 6) {
    commit();
    return;
  }
  const go = turn.t > 0.42 || d.vel > 1.1;
  if (go) commit();
  else cancel();
}

function onKey(e) {
  if (!open) return;
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    step('prev');
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    step('next');
  }
}

function onResize() {
  if (!open) return;
  syncRotate();
  layout();
}

function bind() {
  if (bound) return;
  bound = true;
  stage.addEventListener('pointerdown', onStageDown);
  stage.addEventListener('pointermove', onStageMove);
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('dragstart', (e) => e.preventDefault());
  stage.addEventListener('selectstart', (e) => e.preventDefault());
  leftBtn.addEventListener('click', () => step('prev'));
  rightBtn.addEventListener('click', () => step('next'));
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
}

function preload() {
  SKETCHES.concat(PHOTOS).forEach((src) => {
    const im = new Image();
    im.decoding = 'async';
    im.src = src;
    if (im.decode) im.decode().catch(() => {});
  });
}

export function initSketchbook() {
  overlay = document.getElementById('azSketch');
  if (!overlay) return;
  wrap = document.getElementById('azSbWrap');
  stage = document.getElementById('azSbStage');
  sb3d = document.getElementById('azSb3d');
  book = document.getElementById('azSbBook');
  leftBtn = document.getElementById('azSbLeft');
  rightBtn = document.getElementById('azSbRight');
  bind();
  preload();
}

export function isSketchOpen() {
  return open;
}

export function openSketchbook() {
  if (!overlay) initSketchbook();
  if (!overlay || open) return;
  if (closeWait) {
    clearTimeout(closeWait);
    closeWait = null;
  }
  closing = false;
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  idx = 0;
  turn = null;
  spring = null;
  drag = null;
  view.rx = view.trx = 0;
  view.ry = view.try_ = 0;
  view.z = view.tz = 1;
  open = true;
  introQueued = false;
  overlay.classList.remove('is-leaving', 'need-rotate');
  overlay.classList.add('is-on');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('az-book-open');
  applyView();
  introOn = !reduced;
  if (introOn && useBlur()) wrap?.classList.add('intro');
  requestAnimationFrame(() => {
    layout();
    paint();
    requestAnimationFrame(() => {
      layout();
      if (phonePortrait()) {
        introQueued = !reduced;
        overlay.classList.add('need-rotate');
        return;
      }
      setTimeout(startIntro, 40);
    });
  });
}

export function closeSketchbook() {
  if (!overlay) return Promise.resolve();
  if (!open && !closing) return Promise.resolve();
  if (closing) {
    return new Promise((resolve) => setTimeout(resolve, 420));
  }
  closing = true;
  open = false;
  introQueued = false;
  drag = null;
  spring = null;
  turn = null;
  endIntro();
  document.body.classList.remove('az-book-open');
  overlay.classList.add('is-leaving');
  overlay.classList.remove('is-on', 'need-rotate');
  overlay.setAttribute('aria-hidden', 'true');
  if (raf) {
    cancelAnimationFrame(raf);
    raf = null;
  }
  return new Promise((resolve) => {
    closeWait = setTimeout(() => {
      closing = false;
      closeWait = null;
      overlay.classList.remove('is-leaving');
      if (book) book.textContent = '';
      resolve();
    }, 420);
  });
}
