/* ============================================================
   SCREEN 3 — LIBRARY BOOKSHELF
   Endless 3D spine shelf over a grand library, dust motes,
   wooden ledge, READ badge, feather cursor. HerDay look.
   ============================================================ */
import './Screen3_Filmography.css';
import { $, reduceMotion } from '../core/utils.js';
import {
  initSketchbook,
  openSketchbook,
  closeSketchbook,
  isSketchOpen,
} from './AzhagiiiSketchbook.js';

const SHEET = {
  covers: [
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_010644_837e04ca-2418-45c1-b8e0-0233265c4cd5.png&w=1744&q=85',
    1744,
    2336,
  ],
  spines: [
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_010738_a3e47ead-18f2-4974-9468-06d16a25edc5.png&w=2688&q=85',
    2688,
    1152,
  ],
  fix: [
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_010831_3ebb874b-93dc-433e-87ed-6299aba720f0.png&w=1520&q=85',
    1520,
    2688,
  ],
  fix2: [
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_092020_f96bc094-db7b-46de-9298-074a24e0a3b8.png&w=1520&q=85',
    1520,
    2688,
  ],
  azCover: ['/photos/azhagiii-cover.png?v=8', 694, 1318],
  azSpine: ['/photos/azhagiii-spine.png?v=8', 368, 2176],
};

const CROP = {
  'spine-valley': ['spines', 266, 31, 189, 1089],
  'spine-bluehour': ['spines', 492, 31, 189, 1089],
  'spine-river': ['fix', 197, 54, 324, 2566],
  'spine-summer': ['spines', 937, 31, 188, 1089],
  'spine-green': ['spines', 1157, 31, 185, 1090],
  'spine-noon': ['spines', 44, 32, 184, 1088],
  'spine-observer': ['fix2', 371, 15, 349, 2655],
  'spine-birds': ['spines', 1573, 31, 183, 1089],
  'spine-storm': ['fix2', 808, 15, 347, 2656],
  'spine-tide': ['spines', 2012, 31, 188, 1089],
  'spine-war': ['spines', 2236, 31, 189, 1089],
  'spine-door': ['spines', 2462, 31, 188, 1089],
  'cover-valley': ['covers', 497, 72, 344, 659],
  'cover-bluehour': ['covers', 914, 72, 342, 659],
  'cover-river': ['covers', 1332, 72, 344, 659],
  'cover-summer': ['covers', 74, 813, 344, 676],
  'cover-green': ['covers', 497, 815, 344, 674],
  'cover-noon': ['covers', 74, 72, 347, 659],
  'cover-observer': ['covers', 915, 815, 342, 675],
  'cover-birds': ['covers', 1331, 815, 345, 675],
  'cover-storm': ['covers', 74, 1571, 345, 681],
  'cover-tide': ['covers', 496, 1577, 343, 678],
  'cover-war': ['covers', 913, 1579, 343, 676],
  'cover-door': ['covers', 1331, 1579, 344, 677],
  'spine-azhagiii': ['azSpine', 0, 0, 368, 2176],
  'cover-azhagiii': ['azCover', 0, 0, 694, 1318],
};

const FILMS = [
  { id: 'valley', title: 'The Silent Valley', year: 1958, genre: 'Drama', minutes: 104, synopsis: 'A schoolteacher returns to the mountain village that exiled her father, and finds the valley has kept every one of its secrets.' },
  { id: 'bluehour', title: 'The Blue Hour', year: 1962, genre: 'Romance', minutes: 97, synopsis: 'Over one long evening in a harbour town, a widow and a stranger trade small lies until the light runs out.' },
  { id: 'azhagiii', title: 'Happy Birthday Azhagiii', subtitle: 'A special book for someone special', year: 2026, genre: 'Dedication', minutes: 26, synopsis: 'She rests her chin in her hand and the whole room leans in. That quiet, cute smile is the whole story — the kind you keep looking back at, as if the page might grin again.' },
  { id: 'river', title: 'River of Salt', year: 1964, genre: 'Drama', minutes: 121, synopsis: 'Two brothers drag a salt barge downriver to a city that no longer wants anything they carry.' },
  { id: 'summer', title: 'The Last Summer', year: 1966, genre: 'Drama', minutes: 109, synopsis: 'The summer before the dam floods their village, three friends set fire to everything they cannot take with them.' },
  { id: 'green', title: 'The Green Road', year: 1969, genre: 'Mystery', minutes: 101, synopsis: 'A surveyor mapping a forest road keeps finding the same footprints, always one day ahead of him.' },
  { id: 'noon', title: 'Noon in Ashes', year: 1971, genre: 'Western', minutes: 112, synopsis: 'A rider crosses a white desert to settle an old debt, and learns too late who sent him.' },
  { id: 'observer', title: 'The Observer', year: 1973, genre: 'Thriller', minutes: 96, synopsis: 'A night watchman begins to suspect that the building he guards has started watching him back.' },
  { id: 'birds', title: 'The Fallen Birds', year: 1975, genre: 'Drama', minutes: 118, synopsis: 'When the birds stop singing over a frontier town, the mayor\'s daughter is the only one who goes looking for the reason.' },
  { id: 'storm', title: 'Light in the Storm', year: 1978, genre: 'Drama', minutes: 127, synopsis: 'A lighthouse keeper and his son wait out a three-day storm with a shipwrecked sailor who will not give his name.' },
  { id: 'tide', title: 'The Long Tide', year: 1981, genre: 'Drama', minutes: 99, synopsis: 'A fisherman\'s wife counts the tides on the harbour wall while her husband\'s boat fails to come home.' },
  { id: 'war', title: 'A Quiet War', year: 1985, genre: 'Comedy', minutes: 103, synopsis: 'Two neighbours fight a silent war over a garden wall for thirty years, and neither will say how it began.' },
  { id: 'door', title: 'Red Door', year: 1989, genre: 'Thriller', minutes: 114, synopsis: 'A projectionist follows a reel of unknown film through the corridors of a cinema on its final night.' },
];

const N = FILMS.length;
const COPIES = 3;
const TOTAL = N * COPIES;
const NOON_INDEX = FILMS.findIndex((f) => f.id === 'noon');
const START = NOON_INDEX + N;
const EASE_TEXT = 'cubic-bezier(.2,.8,.2,1)';
const EASE_SHEET = 'cubic-bezier(.76,0,.18,1)';
const BLOBS = [
  { cx: 150, cy: 330, delay: 0 },
  { cx: 340, cy: 600, delay: 120 },
  { cx: 250, cy: 120, delay: 220 },
  { cx: 90, cy: 760, delay: 300 },
  { cx: 400, cy: 250, delay: 360 },
  { cx: 260, cy: 860, delay: 420 },
  { cx: 230, cy: 470, delay: 180 },
];

let root, stage, shelf, playBtn, cursorEl, detail, posterImg, blobsGroup;
let titleMask, subMask, dustCanvas, dustCtx, openHint;
let dSub, dTitle, dSyn, dWatch;
let tapes = [];
let lifts = [];
let motes = [];

let H = 0, ws = 0, d = 0, gap = 0, W = 0, VH = 0;
let s = START, T = START, active = NOON_INDEX;
let hover = -1;
let mx = 0, my = 0, cx = 0, cy = 0;
let tiltX = 0, tiltY = 0;
let onCover = false;
let isOpen = false;
let sketchMode = false;
let activeOn = false;
let raf = 0;
let dustRaf = 0;
let lastT = 0;
let dragging = false;
let dragMoved = false;
let dragX0 = 0, dragT0 = 0;
let suppressClick = false;
let lastTapV = -1;
let lastTapAt = 0;
let wheelTimer = 0;
let inkRAF = 0;
let sheetAnims = [];
let reduced = reduceMotion;
let snapFrames = 0;

function mod(n, m) {
  return ((n % m) + m) % m;
}

function relIndex(v, scroll) {
  return mod(v - scroll + TOTAL / 2, TOTAL) - TOTAL / 2;
}

function smoothstep(x) {
  const t = x < 0 ? 0 : x > 1 ? 1 : x;
  return t * t * (3 - 2 * t);
}

function B(r) {
  if (Math.abs(r) < 1) return (r + Math.sin(Math.PI * r) / Math.PI) / 2;
  return r > 0 ? 0.5 : -0.5;
}

function F(r) {
  return r * (ws + gap) + (d - ws + 1.6 * gap) * B(r);
}

function applyCrop(el, key) {
  const crop = CROP[key];
  if (!crop || !el) return;
  const [sheet, x, y, w, h] = crop;
  const [url, SW, SH] = SHEET[sheet];
  const sizeX = (SW / w) * 100;
  const sizeY = (SH / h) * 100;
  const posX = SW === w ? 0 : (x / (SW - w)) * 100;
  const posY = SH === h ? 0 : (y / (SH - h)) * 100;
  el.style.backgroundImage = `url("${url}")`;
  el.style.backgroundSize = `${sizeX}% ${sizeY}%`;
  el.style.backgroundPosition = `${posX}% ${posY}%`;
  el.style.backgroundRepeat = 'no-repeat';
}

function preloadSheets() {
  Object.values(SHEET).forEach(([url]) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    if (img.decode) img.decode().catch(() => {});
  });
}
preloadSheets();

function layoutH() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 480 && h <= 720) return Math.min(w * 0.52, h * 0.34);
  if (w <= 767) return Math.min(w * 0.6, h * 0.4);
  if (h <= 700) return Math.min(h * 0.38, w * 0.28);
  return Math.min(h * 0.46, w * 0.31);
}

function measure() {
  if (!root) return;
  W = window.innerWidth;
  VH = window.innerHeight;
  H = layoutH();
  ws = H * 142 / 840;
  d = H * 474 / 900;
  gap = H * 0.03;
  root.style.setProperty('--H', `${H}px`);
  root.style.setProperty('--ws', `${ws}px`);
  root.style.setProperty('--d', `${d}px`);
  if (stage) {
    stage.style.setProperty('--ws', `${ws}px`);
    stage.style.setProperty('--d', `${d}px`);
  }
  const rightArrow = root.querySelector('.vhs-arrow--r');
  const leftArrow = root.querySelector('.vhs-arrow--l');
  const pad = W <= 767 ? 10 : 40;
  const size = W <= 767 ? (W <= 420 ? 42 : 48) : 56;
  if (leftArrow) leftArrow.style.left = `${pad}px`;
  if (rightArrow) {
    rightArrow.style.right = 'auto';
    rightArrow.style.left = `${Math.max(pad, W - size - pad)}px`;
  }
  sizeDust();
}

function placeTapes(snap, liftK) {
  if (!tapes.length || !H) return;
  const kLift = snap || reduced ? 1 : (liftK || 0);
  const cull = W / 2 + 1.5 * d;

  for (let i = 0; i < tapes.length; i++) {
    const v = tapes[i].v;
    const r = relIndex(v, s);
    const x = F(r);
    if (Math.abs(x) > cull) {
      tapes[i].el.style.visibility = 'hidden';
      continue;
    }
    tapes[i].el.style.visibility = '';

    const targetLift = (!isOpen && hover === v && Math.abs(r) > 0.5) ? 1 : 0;
    if (snap || reduced) lifts[i] = targetLift;
    else lifts[i] += (targetLift - lifts[i]) * kLift;

    const o = smoothstep(Math.max(0, 1 - Math.abs(r)));
    const rotY = -90 * o + tiltY * o;
    const rotX = tiltX * o;
    const rotZ = -4.5 * o;
    const z = o * 0.2 * H;
    const y = -o * 0.025 * H - lifts[i] * 0.045 * H;
    tapes[i].el.style.transform =
      `translate3d(${x}px, ${y}px, ${z}px) rotateZ(${rotZ}deg) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    tapes[i].el.style.zIndex = String(Math.round(100 - Math.abs(r) * 4));
    tapes[i].sp.style.setProperty('--shade', String(o * 0.55));
    tapes[i].cv.style.setProperty('--shade', String((1 - o) * 0.5));
  }

  placePlay();
}

function placePlay() {
  if (!playBtn) return;
  const settled = !isOpen && Math.abs(T - s) < 0.45;
  const cyShelf = VH / 2 - 20;
  playBtn.hidden = false;
  playBtn.style.left = `${W / 2}px`;
  playBtn.style.top = `${cyShelf + H / 2 + 14}px`;
  playBtn.classList.toggle('is-on', settled);
  playBtn.setAttribute('aria-hidden', settled ? 'false' : 'true');
}

function filmIndex(scroll) {
  return mod(Math.round(scroll), N);
}

function setCaption(film, dir = 1) {
  swapLine(titleMask, film.title, 'vhs-title', dir);
  swapLine(subMask, film.subtitle || '', 'vhs-sub', dir);
}

function setActive(i, dir) {
  const idx = mod(i, N);
  if (idx === active && titleMask && titleMask.querySelector('span')) return;
  active = idx;
  setCaption(FILMS[idx], dir < 0 ? -1 : 1);
}

function swapLine(mask, text, className, dir) {
  if (!mask) return;
  [...mask.children].forEach((el) => {
    if (!el.dataset.leaving) return;
    el.getAnimations().forEach((a) => a.cancel());
    el.remove();
  });
  if (!text) {
    [...mask.children].forEach((el) => {
      el.dataset.leaving = '1';
      el.getAnimations().forEach((a) => a.cancel());
      if (reduced) {
        el.remove();
        return;
      }
      el.animate(
        [{ transform: el.style.transform || 'translateY(0%)' }, { transform: `translateY(${-dir * 110}%)` }],
        { duration: 650, easing: EASE_TEXT, fill: 'both' }
      ).finished.then(() => el.remove()).catch(() => el.remove());
    });
    return;
  }
  if (reduced) {
    mask.innerHTML = '';
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    mask.appendChild(span);
    return;
  }
  const incoming = document.createElement('span');
  incoming.className = className;
  incoming.textContent = text;
  const kids = [...mask.children];
  kids.forEach((el) => {
    el.dataset.leaving = '1';
    el.classList.add('is-gone');
    el.getAnimations().forEach((a) => a.cancel());
    const from = el.style.transform || 'translateY(0%)';
    el.animate(
      [{ transform: from }, { transform: `translateY(${-dir * 110}%)` }],
      { duration: 650, easing: EASE_TEXT, fill: 'both' }
    ).finished.then(() => el.remove()).catch(() => el.remove());
  });
  incoming.style.transform = `translateY(${dir * 110}%)`;
  mask.appendChild(incoming);
  incoming.animate(
    [{ transform: `translateY(${dir * 110}%)` }, { transform: 'translateY(0%)' }],
    { duration: 650, easing: EASE_TEXT, fill: 'both' }
  );
}

function sizeDust() {
  if (!dustCanvas) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  dustCanvas.width = Math.round(W * ratio);
  dustCanvas.height = Math.round(VH * ratio);
  dustCanvas.style.width = `${W}px`;
  dustCanvas.style.height = `${VH}px`;
  dustCtx = dustCanvas.getContext('2d');
  if (dustCtx) dustCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function seedDust() {
  motes = [];
  const count = reduced ? 12 : 45;
  for (let i = 0; i < count; i++) {
    motes.push({
      x: Math.random() * (W || 1200),
      y: Math.random() * (VH || 800),
      size: Math.random() * 2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: -Math.random() * 0.45 - 0.1,
      opacity: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    });
  }
}

function stepDust() {
  if (!activeOn || !dustCtx) {
    dustRaf = 0;
    return;
  }
  dustCtx.clearRect(0, 0, W, VH);
  for (let i = 0; i < motes.length; i++) {
    const p = motes[i];
    p.x += p.speedX;
    p.y += p.speedY;
    p.pulse += 0.02;
    if (p.y < -10) p.y = VH + 10;
    if (p.x < -10) p.x = W + 10;
    if (p.x > W + 10) p.x = -10;
    const a = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
    dustCtx.beginPath();
    dustCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    dustCtx.fillStyle = `rgba(255, 235, 185, ${a})`;
    dustCtx.shadowBlur = 8;
    dustCtx.shadowColor = 'rgba(255, 215, 120, 0.6)';
    dustCtx.fill();
  }
  dustRaf = requestAnimationFrame(stepDust);
}

function startDust() {
  sizeDust();
  if (!motes.length) seedDust();
  if (dustRaf) cancelAnimationFrame(dustRaf);
  dustRaf = requestAnimationFrame(stepDust);
}

function stopDust() {
  if (dustRaf) {
    cancelAnimationFrame(dustRaf);
    dustRaf = 0;
  }
  if (dustCtx) dustCtx.clearRect(0, 0, W, VH);
}

function buildTapes() {
  if (!stage) return;
  stage.innerHTML = '';
  tapes = [];
  lifts = [];
  for (let v = 0; v < TOTAL; v++) {
    const film = FILMS[v % N];
    const el = document.createElement('div');
    el.className = 'vhs-tape';
    el.dataset.v = String(v);
    const sp = document.createElement('div');
    sp.className = 'sp';
    applyCrop(sp, `spine-${film.id}`);
    const cv = document.createElement('div');
    cv.className = 'cv';
    applyCrop(cv, `cover-${film.id}`);
    el.appendChild(sp);
    el.appendChild(cv);
    el.addEventListener('pointerenter', () => { hover = v; });
    el.addEventListener('pointerleave', () => { if (hover === v) hover = -1; });
    el.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    el.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) return;
      const r = relIndex(v, s);
      if (Math.abs(r) < 0.5) {
        lastTapV = -1;
        lastTapAt = 0;
        openDetail();
      }
    });
    stage.appendChild(el);
    tapes.push({ el, sp, cv, v });
    lifts.push(0);
  }
}

function onTapeClick(v) {
  const r = relIndex(v, s);
  if (Math.abs(r) < 0.5) {
    const now = performance.now();
    if (lastTapV === v && now - lastTapAt < 520) {
      lastTapV = -1;
      lastTapAt = 0;
      openDetail();
    } else {
      lastTapV = v;
      lastTapAt = now;
    }
    return;
  }
  lastTapV = -1;
  lastTapAt = 0;
  T = Math.round(T + r);
}

function step(now) {
  if (!activeOn) return;
  if (!lastT) lastT = now;
  let dt = (now - lastT) / 1000;
  if (dt > 0.05) dt = 0.05;
  lastT = now;

  const snap = snapFrames > 0;
  if (snap) {
    s = T;
    snapFrames -= 1;
  } else {
    const k = reduced ? 1 : (dragging ? 18 : 6.5);
    s += (T - s) * (1 - Math.exp(-k * dt));
    if (Math.abs(T - s) < 1e-4) s = T;
  }

  if (s > TOTAL + N * 4 || s < -N * 4) {
    const shift = Math.round(s / N) * N;
    const loops = Math.round(shift / TOTAL) * TOTAL;
    if (loops) {
      s -= loops;
      T -= loops;
    }
  }

  const idx = filmIndex(s);
  if (idx !== active) {
    const dir = Math.sign(T - s) || 1;
    setActive(idx, dir);
  }

  cx += (mx - cx) * (1 - Math.exp(-22 * dt));
  cy += (my - cy) * (1 - Math.exp(-22 * dt));

  const cyShelf = VH / 2 - 20;
  const settled = Math.abs(T - s) < 0.45;
  const coverHit =
    !isOpen &&
    settled &&
    Math.abs(mx - W / 2) < 0.55 * d &&
    Math.abs(my - cyShelf) < 0.55 * H;
  onCover = coverHit;

  let tY = 0, tX = 0;
  if (onCover) {
    tY = ((mx - W / 2) / (0.55 * d)) * 9;
    tX = -((my - cyShelf) / (H / 2)) * 6;
  } else {
    tY = W ? ((mx - W / 2) / W) * 5 : 0;
    tX = 0;
  }
  const tk = 1 - Math.exp(-7 * dt);
  tiltY += (tY - tiltY) * tk;
  tiltX += (tX - tiltX) * tk;

  const liftK = reduced || snap ? 1 : (1 - Math.exp(-12 * dt));
  placeTapes(snap, liftK);

  raf = requestAnimationFrame(step);
}

function fillDetail(film) {
  if (dSub) dSub.textContent = `${film.genre} Edition • ${film.year}`;
  if (dTitle) dTitle.textContent = film.title;
  if (dSyn) dSyn.textContent = film.synopsis;
  setPoster(film);
}

function setPoster(film) {
  if (!posterImg) return;
  const [sheet, x, y, w, h] = CROP[`cover-${film.id}`];
  const [url, SW, SH] = SHEET[sheet];
  posterImg.setAttribute('href', url);
  posterImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', url);
  posterImg.setAttribute('x', String((-x * 474) / w));
  posterImg.setAttribute('y', String((-y * 900) / h));
  posterImg.setAttribute('width', String((SW * 474) / w));
  posterImg.setAttribute('height', String((SH * 900) / h));
  posterImg.setAttribute('preserveAspectRatio', 'none');
}

function coverRect() {
  const mid = tapes.find((t) => Math.abs(relIndex(t.v, s)) < 0.5);
  if (mid) {
    const r = mid.cv.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) return r;
  }
  const left = W / 2 - d / 2;
  const top = VH / 2 - 20 - H / 2;
  return { left, top, right: left + d, bottom: top + H, width: d, height: H };
}

function resetBlobs() {
  if (!blobsGroup) return;
  [...blobsGroup.querySelectorAll('circle')].forEach((c) => c.setAttribute('r', '0'));
}

function runInk() {
  if (inkRAF) cancelAnimationFrame(inkRAF);
  const circles = blobsGroup ? [...blobsGroup.querySelectorAll('circle')] : [];
  const t0 = reduced ? performance.now() - 5000 : performance.now();
  const grow = (now) => {
    let done = true;
    circles.forEach((c, i) => {
      const local = now - t0 - (reduced ? 0 : 520) - BLOBS[i].delay;
      if (local < 0) {
        done = false;
        c.setAttribute('r', '0');
        return;
      }
      const p = Math.min(1, local / 1250);
      const e = 1 - Math.pow(1 - p, 3);
      c.setAttribute('r', String(720 * e));
      if (p < 1) done = false;
    });
    if (!done && now - t0 < 2400) inkRAF = requestAnimationFrame(grow);
    else inkRAF = 0;
  };
  inkRAF = requestAnimationFrame(grow);
}

function riseLines() {
  const lines = detail.querySelectorAll('.vhs-line > *');
  lines.forEach((el, i) => {
    el.getAnimations().forEach((a) => a.cancel());
    if (reduced) {
      el.style.transform = 'translateY(0%)';
      return;
    }
    el.animate(
      [{ transform: 'translateY(110%)' }, { transform: 'translateY(0%)' }],
      {
        duration: 900,
        delay: 620 + i * 75,
        easing: EASE_TEXT,
        fill: 'both',
      }
    );
  });
}

function setReading(on) {
  if (root) root.classList.toggle('is-reading', on);
  if (openHint) openHint.classList.toggle('is-gone', on);
}

function openDetail() {
  if (isOpen) return;
  T = Math.round(T);
  s = T;
  const film = FILMS[filmIndex(s)];
  if (film.id === 'azhagiii') {
    isOpen = true;
    sketchMode = true;
    setReading(true);
    openSketchbook();
    return;
  }
  if (!detail) return;
  fillDetail(film);
  resetBlobs();

  const rect = coverRect();
  const top = rect.top;
  const right = W - rect.right;
  const bottom = VH - rect.bottom;
  const left = rect.left;
  const ox = rect.left + rect.width / 2;
  const oy = rect.top + rect.height / 2;

  isOpen = true;
  detail.classList.add('is-on');
  detail.style.visibility = 'visible';
  detail.style.pointerEvents = 'auto';
  detail.style.transformOrigin = `${ox}px ${oy}px`;

  sheetAnims.forEach((a) => a.cancel());
  sheetAnims = [];

  const dur = reduced ? 1 : 1050;
  const anim = detail.animate(
    [
      { clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round 3px)`, transform: 'rotate(-4.5deg)' },
      { clipPath: 'inset(0 0 0 0 round 0px)', transform: 'rotate(0deg)' },
    ],
    { duration: dur, easing: EASE_SHEET, fill: 'both' }
  );
  sheetAnims.push(anim);
  riseLines();
  runInk();
}

function closeDetail() {
  if (!isOpen) return;
  if (sketchMode || isSketchOpen()) {
    sketchMode = false;
    closeSketchbook().then(() => {
      isOpen = false;
      setReading(false);
    });
    return;
  }
  if (!detail) return;
  const rect = coverRect();
  const top = rect.top;
  const right = W - rect.right;
  const bottom = VH - rect.bottom;
  const left = rect.left;
  const ox = rect.left + rect.width / 2;
  const oy = rect.top + rect.height / 2;
  detail.style.transformOrigin = `${ox}px ${oy}px`;

  sheetAnims.forEach((a) => a.cancel());
  sheetAnims = [];
  if (inkRAF) {
    cancelAnimationFrame(inkRAF);
    inkRAF = 0;
  }

  const dur = reduced ? 1 : 850;
  const anim = detail.animate(
    [
      { clipPath: 'inset(0 0 0 0 round 0px)', transform: 'rotate(0deg)' },
      { clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round 3px)`, transform: 'rotate(-4.5deg)' },
    ],
    { duration: dur, easing: EASE_SHEET, fill: 'both' }
  );
  sheetAnims.push(anim);
  anim.finished.then(() => {
    isOpen = false;
    setReading(false);
    detail.classList.remove('is-on');
    detail.style.visibility = 'hidden';
    detail.style.pointerEvents = 'none';
    sheetAnims.forEach((a) => a.cancel());
    sheetAnims = [];
  }).catch(() => {
    isOpen = false;
    setReading(false);
    detail.classList.remove('is-on');
  });
}

function onPointerMove(e) {
  mx = e.clientX;
  my = e.clientY;
  if (!dragging) return;
  const dx = e.clientX - dragX0;
  if (Math.abs(dx) > 8) {
    dragMoved = true;
    suppressClick = true;
    T = dragT0 - dx / (ws + gap);
  }
}

function onPointerDown(e) {
  if (isOpen) return;
  if (e.target.closest('button, a, .vhs-play, .vhs-detail, .az-sketch')) return;
  dragging = true;
  dragMoved = false;
  dragX0 = e.clientX;
  dragT0 = T;
  try { shelf.setPointerCapture(e.pointerId); } catch (_) {}
}

function onPointerUp(e) {
  if (!dragging) return;
  const moved = dragMoved;
  dragging = false;
  try { shelf.releasePointerCapture(e.pointerId); } catch (_) {}
  T = Math.round(T);
  if (!moved && !isOpen) {
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const tape = hit?.closest?.('.vhs-tape');
    if (tape) onTapeClick(Number(tape.dataset.v));
  }
  setTimeout(() => { suppressClick = false; }, 40);
}

function onWheel(e) {
  if (!activeOn || isOpen) return;
  e.preventDefault();
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  T += (delta / (ws + gap)) * 0.5;
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => { T = Math.round(T); }, 160);
}

function onKey(e) {
  if (!activeOn) return;
  if (e.key === 'Escape') {
    if (isOpen) closeDetail();
    return;
  }
  if (isOpen) return;
  if (e.key === 'ArrowLeft') {
    T = Math.round(T) - 1;
    e.preventDefault();
  } else if (e.key === 'ArrowRight') {
    T = Math.round(T) + 1;
    e.preventDefault();
  } else if (e.key === 'Enter') {
    openDetail();
    e.preventDefault();
  }
}

function bind() {
  if (!root) return;
  playBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openDetail();
  });
  root.querySelector('.vhs-arrow--l')?.addEventListener('click', () => { T = Math.round(T) - 1; });
  root.querySelector('.vhs-arrow--r')?.addEventListener('click', () => { T = Math.round(T) + 1; });
  root.querySelector('.vhs-detail__close')?.addEventListener('click', closeDetail);
  root.querySelector('#azSketchClose')?.addEventListener('click', closeDetail);
  dWatch?.addEventListener('click', closeDetail);

  shelf.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  shelf.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
}

export function initFilmography() {
  root = $('vhsScreen');
  if (!root) return;
  stage = $('vhsStage');
  shelf = $('vhsShelf');
  playBtn = $('vhsPlay');
  cursorEl = $('vhsCursor');
  detail = $('vhsDetail');
  posterImg = $('vhsPosterImg');
  blobsGroup = $('vhsInkBlobs');
  titleMask = $('vhsTitleMask');
  subMask = $('vhsSubMask');
  openHint = $('vhsOpenHint');
  dustCanvas = $('vhsDust');
  dSub = $('vhsDSub');
  dTitle = $('vhsDTitle');
  dSyn = $('vhsDSyn');
  dWatch = $('vhsDWatch');

  measure();
  seedDust();
  buildTapes();
  placeTapes(true);
  initSketchbook();
  bind();
  window.addEventListener('resize', () => {
    measure();
    placeTapes(true);
  });

  const noon = FILMS[NOON_INDEX];
  if (titleMask) {
    titleMask.innerHTML = `<span class="vhs-title">${noon.title}</span>`;
  }
  if (subMask) subMask.innerHTML = '';

  if (typeof location !== 'undefined' && location.hash === '#library') {
    requestAnimationFrame(() => startFilmography());
  }
}

export function startFilmography() {
  if (!root) initFilmography();
  if (!root) return;
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  s = START;
  T = START;
  active = NOON_INDEX;
  isOpen = false;
  sketchMode = false;
  hover = -1;
  dragging = false;
  lastTapV = -1;
  lastTapAt = 0;
  setReading(false);
  if (isSketchOpen()) closeSketchbook();
  if (detail) {
    detail.classList.remove('is-on');
    detail.style.visibility = 'hidden';
    detail.getAnimations().forEach((a) => a.cancel());
  }
  const noon = FILMS[NOON_INDEX];
  if (titleMask) {
    titleMask.innerHTML = `<span class="vhs-title">${noon.title}</span>`;
  }
  if (subMask) subMask.innerHTML = '';
  root.classList.add('is-in');
  root.setAttribute('aria-hidden', 'false');
  document.body.classList.add('vhs-active');
  measure();
  placeTapes(true);
  seedDust();
  activeOn = true;
  snapFrames = 4;
  lastT = 0;
  mx = W / 2;
  my = VH / 2;
  cx = mx;
  cy = my;
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(step);
  startDust();
}

export function resetFilmography() {
  activeOn = false;
  isOpen = false;
  sketchMode = false;
  dragging = false;
  setReading(false);
  if (isSketchOpen()) closeSketchbook();
  if (raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  if (inkRAF) {
    cancelAnimationFrame(inkRAF);
    inkRAF = 0;
  }
  stopDust();
  document.body.classList.remove('vhs-active');
  if (root) {
    root.classList.remove('is-in');
    root.setAttribute('aria-hidden', 'true');
  }
  if (detail) {
    detail.classList.remove('is-on');
    detail.style.visibility = 'hidden';
    detail.getAnimations().forEach((a) => a.cancel());
  }
}

export function resizeFilmography() {
  if (!activeOn) return;
  measure();
  placeTapes(true);
}
