/* ============================================================
   SCREEN 3 COMPONENT — ACT 4: CENTERED HEART BLOOM CANVAS
   Heart-of-hearts bloom, dense bottom sunflower bed, floating
   hearts/roses/flowers/sparkles. No trunk/branches.
   ============================================================ */
import { $, rand, pick, clamp, clamp01, lerp, easeOutCubic, easeOutBack, shade } from '../core/utils.js';
import { cue } from '../core/audio.js';

const BLOSSOM = [
  { c0: '#fae3e4', c1: '#DD9B9C' }, // Soft Blush Rose
  { c0: '#f0d2df', c1: '#B97397' }, // Dusty Mauve
  { c0: '#e3c6de', c1: '#97588D' }, // Radiant Orchid Plum
  { c0: '#b8a3cb', c1: '#503967' }, // Royal Twilight Violet
  { c0: '#fceced', c1: '#B97397' }, // Petal Pearl
  { c0: '#edd1e1', c1: '#DD9B9C' }, // Rose Quartz
  { c0: '#ffe0e6', c1: '#e11d48' }, // True Red
  { c0: '#ffc9d4', c1: '#be123c' }, // Deep Crimson
  { c0: '#fff1f3', c1: '#f43f5e' }, // Bright Rose Red
];

/** Outer shell stays forever — heart shape never collapses. */
const HEART_RIM_KEEP = 0.88;
/** Sweep opens this tight center; gift sits nestled with almost no hollow. */
const HEART_GIFT_ZONE = 0.20;
/** Red blossom indices (True Red / Deep Crimson / Bright Rose Red). */
const RED_BLOSSOM = [6, 7, 8];

function pickBlossomIdx() {
  // Keep existing palette, but bias so reds show clearly (~1 in 3)
  if (Math.random() < 0.34) return RED_BLOSSOM[(Math.random() * RED_BLOSSOM.length) | 0];
  return (Math.random() * BLOSSOM.length) | 0;
}

const T = {
  bloomT0:    0.35,
  bloomSpan:  2.00,
  petalT0:    1.85,
  noteStart:  1.55,
  done:       4.20,
};

const SS = 168;

let canvas, ctx, wishEl;
let W = 0, H = 0, dpr = 1;
let cx = 0, cy = 0, rx = 0, ry = 0, groundY = 0;
let hearts = [], petals = [], rested = [], orbs = [], floaters = [], twinkles = [], sunflowers = [];
let bgGrad = null, groundGrad = null;
let heartPoly = null;
let SPR = { crisp: [], soft: [] }, BOKEH = [], SPARKLE = null;
let ROSE = [], FLOWER = [];
let SUNFLOWER = { crisp: null, soft: null }, SUNFLOWER_PETAL = null;

let treeStartT = 0, treeLastT = 0, treeRAF = 0, lastPetal = 0, replayArmed = false;
let armReplayCallback = null;
let onWishShownCallback = null;
let wishShown = false;

function heartShape(c, x, top, w, h) {
  c.beginPath();
  c.moveTo(x, top + h * 0.28);
  c.bezierCurveTo(x, top, x - w * 0.5, top, x - w * 0.5, top + h * 0.28);
  c.bezierCurveTo(x - w * 0.5, top + h * 0.60, x - w * 0.16, top + h * 0.80, x, top + h);
  c.bezierCurveTo(x + w * 0.16, top + h * 0.80, x + w * 0.5, top + h * 0.60, x + w * 0.5, top + h * 0.28);
  c.bezierCurveTo(x + w * 0.5, top, x, top, x, top + h * 0.28);
  c.closePath();
}

function makeBlossom({ c0, c1 }, soft) {
  const cv = document.createElement('canvas'); cv.width = cv.height = SS;
  const c = cv.getContext('2d');
  const w = SS * 0.62, h = SS * 0.58, x = SS / 2, top = SS * 0.17;

  c.save();
  c.shadowColor = 'rgba(150,38,72,0.32)';
  c.shadowBlur = SS * 0.085; c.shadowOffsetY = SS * 0.05;
  c.fillStyle = c1; heartShape(c, x, top, w, h); c.fill();
  c.restore();

  const g = c.createRadialGradient(x - w * 0.20, top + h * 0.20, h * 0.04, x, top + h * 0.42, h * 0.92);
  g.addColorStop(0, c0); g.addColorStop(0.55, c1); g.addColorStop(1, shade(c1, -26));
  heartShape(c, x, top, w, h); c.fillStyle = g; c.fill();

  c.save(); heartShape(c, x, top, w, h); c.clip();
  const g2 = c.createLinearGradient(0, top, 0, top + h);
  g2.addColorStop(0, 'rgba(255,255,255,0)');
  g2.addColorStop(0.65, 'rgba(110,16,46,0)');
  g2.addColorStop(1, 'rgba(110,16,46,0.26)');
  c.fillStyle = g2; c.fillRect(0, 0, SS, SS);
  c.globalAlpha = 0.55; c.fillStyle = '#ffffff';
  c.beginPath(); c.ellipse(x - w * 0.15, top + h * 0.24, w * 0.17, h * 0.11, -0.5, 0, Math.PI * 2); c.fill();
  c.restore();

  if (!soft) return cv;

  const cv2 = document.createElement('canvas'); cv2.width = cv2.height = SS;
  const c2 = cv2.getContext('2d');
  c2.filter = 'blur(2.6px)'; c2.drawImage(cv, 0, 0); c2.filter = 'none';
  c2.globalCompositeOperation = 'source-atop';
  c2.globalAlpha = 0.42; c2.fillStyle = '#fff3ea'; c2.fillRect(0, 0, SS, SS);
  return cv2;
}

function makeBokeh(rgb) {
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, `rgba(${rgb},0.9)`); g.addColorStop(0.45, `rgba(${rgb},0.22)`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  return cv;
}

function makeSparkle() {
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d'); const m = S / 2;
  const g = c.createRadialGradient(m, m, 0, m, m, m);
  g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.25, 'rgba(255,236,200,0.5)'); g.addColorStop(1, 'rgba(255,236,200,0)');
  c.fillStyle = g; c.beginPath(); c.arc(m, m, m, 0, 6.2832); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.95)';
  c.translate(m, m);
  for (let k = 0; k < 2; k++) {
    c.beginPath();
    c.moveTo(0, -m); c.quadraticCurveTo(0, 0, m, 0); c.quadraticCurveTo(0, 0, 0, m); c.quadraticCurveTo(0, 0, -m, 0); c.quadraticCurveTo(0, 0, 0, -m);
    c.fill(); c.rotate(Math.PI / 4); c.scale(0.5, 0.5);
  }
  return cv;
}

function makeRose(c0, c1) {
  const S = SS;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const mid = S / 2;
  c.save();
  c.shadowColor = 'rgba(120, 30, 60, 0.28)';
  c.shadowBlur = S * 0.06;
  c.shadowOffsetY = S * 0.03;
  for (let layer = 0; layer < 4; layer++) {
    const petals = 6 + layer;
    const rOut = S * (0.42 - layer * 0.06);
    const rIn = rOut * 0.42;
    for (let i = 0; i < petals; i++) {
      const ang = (i / petals) * Math.PI * 2 + layer * 0.35;
      c.save();
      c.translate(mid, mid);
      c.rotate(ang);
      c.beginPath();
      c.moveTo(0, rIn * 0.2);
      c.quadraticCurveTo(-rOut * 0.38, (rIn + rOut) * 0.42, 0, rOut);
      c.quadraticCurveTo(rOut * 0.38, (rIn + rOut) * 0.42, 0, rIn * 0.2);
      const g = c.createLinearGradient(0, rIn, 0, rOut);
      g.addColorStop(0, c0);
      g.addColorStop(0.55, c1);
      g.addColorStop(1, shade(c1, -18));
      c.fillStyle = g;
      c.fill();
      c.restore();
    }
  }
  c.beginPath();
  c.arc(mid, mid, S * 0.07, 0, Math.PI * 2);
  c.fillStyle = shade(c1, -28);
  c.fill();
  c.restore();
  return cv;
}

function makeFlower(c0, c1) {
  const S = SS;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const mid = S / 2;
  const petals = 7;
  c.save();
  c.shadowColor = 'rgba(100, 40, 90, 0.25)';
  c.shadowBlur = S * 0.05;
  for (let i = 0; i < petals; i++) {
    const ang = (i / petals) * Math.PI * 2;
    c.save();
    c.translate(mid, mid);
    c.rotate(ang);
    c.beginPath();
    c.ellipse(0, -S * 0.22, S * 0.11, S * 0.22, 0, 0, Math.PI * 2);
    const g = c.createLinearGradient(0, 0, 0, -S * 0.4);
    g.addColorStop(0, c1);
    g.addColorStop(1, c0);
    c.fillStyle = g;
    c.fill();
    c.restore();
  }
  const dg = c.createRadialGradient(mid, mid, 0, mid, mid, S * 0.11);
  dg.addColorStop(0, '#fff6d8');
  dg.addColorStop(0.55, '#f5c16c');
  dg.addColorStop(1, '#d97706');
  c.beginPath();
  c.arc(mid, mid, S * 0.11, 0, Math.PI * 2);
  c.fillStyle = dg;
  c.fill();
  c.restore();
  return cv;
}

function makeSunflowerHead(soft) {
  const S = SS;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const mid = S / 2;
  const rDisc = S * 0.17;
  const rPetalOuter = S * 0.44;
  const rPetalInner = S * 0.41;

  c.save();
  c.shadowColor = 'rgba(120, 45, 10, 0.35)';
  c.shadowBlur = S * 0.08;
  c.shadowOffsetY = S * 0.04;

  const numPetals = 16;
  for (let i = 0; i < numPetals; i++) {
    const ang = (i / numPetals) * Math.PI * 2;
    c.save();
    c.translate(mid, mid);
    c.rotate(ang);
    c.beginPath();
    c.moveTo(0, rDisc * 0.75);
    c.quadraticCurveTo(-S * 0.075, (rDisc + rPetalOuter) * 0.5, 0, rPetalOuter);
    c.quadraticCurveTo(S * 0.075, (rDisc + rPetalOuter) * 0.5, 0, rDisc * 0.75);
    const g = c.createLinearGradient(0, rDisc * 0.8, 0, rPetalOuter);
    g.addColorStop(0, '#f59e0b');
    g.addColorStop(0.6, '#fbb03b');
    g.addColorStop(1, '#ffd166');
    c.fillStyle = g;
    c.fill();
    c.restore();
  }
  c.restore();

  for (let i = 0; i < numPetals; i++) {
    const ang = (i / numPetals) * Math.PI * 2 + Math.PI / numPetals;
    c.save();
    c.translate(mid, mid);
    c.rotate(ang);
    c.beginPath();
    c.moveTo(0, rDisc * 0.9);
    c.quadraticCurveTo(-S * 0.07, (rDisc + rPetalInner) * 0.52, 0, rPetalInner);
    c.quadraticCurveTo(S * 0.07, (rDisc + rPetalInner) * 0.52, 0, rDisc * 0.9);
    const g = c.createLinearGradient(0, rDisc * 0.9, 0, rPetalInner);
    g.addColorStop(0, '#e67e22');
    g.addColorStop(0.45, '#f59e0b');
    g.addColorStop(0.85, '#ffdd53');
    g.addColorStop(1, '#fff1a8');
    c.fillStyle = g;
    c.fill();
    c.restore();
  }

  const dg = c.createRadialGradient(mid - rDisc * 0.2, mid - rDisc * 0.2, rDisc * 0.05, mid, mid, rDisc);
  dg.addColorStop(0, '#2e1507');
  dg.addColorStop(0.5, '#451d08');
  dg.addColorStop(0.85, '#78350f');
  dg.addColorStop(1, '#b45309');
  c.beginPath();
  c.arc(mid, mid, rDisc, 0, Math.PI * 2);
  c.fillStyle = dg;
  c.fill();

  c.save();
  for (let ring = 1; ring <= 3; ring++) {
    const dots = ring * 10;
    const rad = rDisc * (0.35 + ring * 0.18);
    for (let d = 0; d < dots; d++) {
      const da = (d / dots) * Math.PI * 2 + ring * 0.5;
      const dx = mid + Math.cos(da) * rad;
      const dy = mid + Math.sin(da) * rad;
      c.beginPath();
      c.arc(dx, dy, S * 0.009, 0, Math.PI * 2);
      c.fillStyle = ring === 3 ? 'rgba(255, 200, 70, 0.7)' : 'rgba(217, 119, 6, 0.5)';
      c.fill();
    }
  }
  c.restore();

  if (!soft) return cv;

  const cv2 = document.createElement('canvas'); cv2.width = cv2.height = S;
  const c2 = cv2.getContext('2d');
  c2.filter = 'blur(2.5px)'; c2.drawImage(cv, 0, 0); c2.filter = 'none';
  c2.globalCompositeOperation = 'source-atop';
  c2.globalAlpha = 0.35; c2.fillStyle = '#fff4db'; c2.fillRect(0, 0, S, S);
  return cv2;
}

function makeSunflowerPetal() {
  const S = Math.round(SS * 0.6);
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const mid = S / 2;
  c.save();
  c.shadowColor = 'rgba(160, 60, 20, 0.3)';
  c.shadowBlur = 6;
  c.beginPath();
  c.moveTo(mid, S * 0.85);
  c.quadraticCurveTo(S * 0.15, S * 0.45, mid, S * 0.1);
  c.quadraticCurveTo(S * 0.85, S * 0.45, mid, S * 0.85);
  const g = c.createLinearGradient(mid, S * 0.85, mid, S * 0.1);
  g.addColorStop(0, '#f59e0b');
  g.addColorStop(0.55, '#fbbf24');
  g.addColorStop(1, '#fef08a');
  c.fillStyle = g;
  c.fill();
  c.restore();
  return cv;
}

export function buildSprites() {
  SPR = { crisp: BLOSSOM.map((b) => makeBlossom(b, false)), soft: BLOSSOM.map((b) => makeBlossom(b, true)) };
  ROSE = [
    makeRose('#ffe0ea', '#e85a83'),
    makeRose('#ffd0e0', '#c41f52'),
    makeRose('#f5d0e8', '#97588D'),
    makeRose('#ffe8f0', '#DD9B9C'),
  ];
  FLOWER = [
    makeFlower('#fff0f6', '#ff8fb0'),
    makeFlower('#fce7f3', '#B97397'),
    makeFlower('#f3e8ff', '#a78bfa'),
    makeFlower('#fff7ed', '#f9a8d4'),
  ];
  SUNFLOWER = { crisp: makeSunflowerHead(false), soft: makeSunflowerHead(true) };
  SUNFLOWER_PETAL = makeSunflowerPetal();
  BOKEH = [makeBokeh('221,155,156'), makeBokeh('185,115,151'), makeBokeh('151,88,141'), makeBokeh('80,57,103'), makeBokeh('250,228,229')];
  SPARKLE = makeSparkle();
}

function drawSprite(sprite, x, y, size, rot, alpha) {
  if (!ctx || !sprite) return;
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.drawImage(sprite, -size * 0.5, -size * 0.47, size, size);
  ctx.restore();
}

function buildHeartPoly() {
  const raw = []; let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (let i = 0; i <= 160; i++) {
    const t = (i / 160) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    raw.push([x, y]);
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2, hw = (maxX - minX) / 2, hh = (maxY - minY) / 2;
  heartPoly = raw.map(([x, y]) => [(x - midX) / hw, (y - midY) / hh]);
}

function pointInPoly(x, y) {
  let inside = false; const p = heartPoly;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

export function buildScene() {
  hearts = []; petals = []; rested = []; twinkles = []; orbs = []; floaters = []; sunflowers = [];
  buildHeartPoly();

  const isMobile = W <= 768;
  const isShort = H <= 640;
  const wide = W / H > 1.2;

  // Centered heart bloom — solid silhouette, sized to leave room for dedication below
  cx = W * 0.5;
  cy = H * (isShort ? 0.26 : isMobile ? 0.28 : 0.29);
  ry = Math.min(
    H * (isShort ? 0.20 : isMobile ? 0.22 : wide ? 0.24 : 0.23),
    W * (isMobile ? 0.34 : 0.26)
  );
  rx = ry * 1.12;
  groundY = H;

  bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#1c1530');
  bgGrad.addColorStop(0.35, '#312651');
  bgGrad.addColorStop(0.65, '#503967');
  bgGrad.addColorStop(0.88, '#97588D');
  bgGrad.addColorStop(1, '#B97397');
  groundGrad = ctx.createRadialGradient(cx, H * 1.02, Math.max(W, H) * 0.15, cx, H * 1.02, Math.max(W, H) * 0.7);
  groundGrad.addColorStop(0, 'rgba(221,155,156,0.48)');
  groundGrad.addColorStop(0.5, 'rgba(185,115,151,0.20)');
  groundGrad.addColorStop(1, 'rgba(49,38,81,0)');

  for (let i = 0; i < 11; i++) {
    orbs.push({
      x: rand(0, W), y: rand(0, H), r: rand(W * 0.05, W * 0.17),
      vy: rand(-6, -16), drift: rand(-0.3, 0.3), phase: rand(0, 6.28),
      alpha: rand(0.05, 0.13), sprite: pick(BOKEH),
    });
  }

  // Ambient sky floaters: hearts, roses, flowers, sparkles (no sunflower leaves)
  const floaterCount = isMobile ? 22 : wide ? 36 : 30;
  const kinds = ['heart', 'heart', 'rose', 'rose', 'flower', 'flower', 'sparkle', 'sparkle'];
  for (let i = 0; i < floaterCount; i++) {
    const kind = kinds[i % kinds.length];
    const depth = Math.random();
    const minSize = Math.min(W, H);
    let box;
    if (kind === 'sparkle') box = lerp(minSize * 0.018, minSize * 0.04, depth);
    else if (kind === 'heart') box = lerp(minSize * 0.028, minSize * 0.065, depth);
    else box = lerp(minSize * 0.032, minSize * 0.072, depth);

    floaters.push({
      kind,
      idx: kind === 'heart'
        ? (Math.random() * BLOSSOM.length) | 0
        : kind === 'rose'
          ? (Math.random() * ROSE.length) | 0
          : kind === 'flower'
            ? (Math.random() * FLOWER.length) | 0
            : 0,
      soft: kind === 'heart' && depth < 0.45,
      x: rand(0, W),
      y: rand(-H * 0.15, H * 1.15),
      depth,
      box,
      vy: kind === 'sparkle' ? lerp(10, 22, depth) : lerp(6, 16, depth),
      sway: rand(10, 28),
      phase: rand(0, 6.28),
      rot: rand(-0.5, 0.5),
      vrot: rand(-0.55, 0.55),
      baseA: kind === 'sparkle'
        ? lerp(0.35, 0.85, depth)
        : lerp(0.28, 0.72, depth),
    });
  }

  // Classic heart silhouette — tight grid + dense fill; rim never knocked away
  const COUNT = isMobile
    ? Math.round(clamp((rx * ry) / 22, 380, 580))
    : Math.round(clamp((rx * ry) / 14, 620, 980));
  const baseBox = clamp(Math.min(W, H) * 0.082, 20, 48);
  const step = isMobile ? 0.046 : 0.034;

  function pushHeartPetal(u, v, softChance) {
    if (!pointInPoly(u, v)) return false;
    const dist = Math.hypot(u, v * 0.92);
    const x = cx + u * rx;
    const y = cy - v * ry;
    const d = clamp01(Math.hypot(u, v + 0.15) / 2.1);
    const t0 = T.bloomT0 + d * (T.bloomSpan * 0.82) + rand(0, T.bloomSpan * 0.18);
    const soft = Math.random() < softChance;
    // Slightly larger petals on the rim so the outline stays crisp after wipe
    const rimBoost = dist >= HEART_RIM_KEEP ? 1.08 : dist < HEART_GIFT_ZONE ? 0.96 : 1;
    hearts.push({
      x, y, u, v, dist, fallen: false,
      idx: pickBlossomIdx(),
      soft,
      box: baseBox * rimBoost * (soft ? rand(0.58, 0.82) : rand(0.78, 1.08)),
      rot: rand(-0.4, 0.4),
      sway: rand(0, 6.28),
      t0,
    });
    return true;
  }

  // Grid first — clean classic heart outline
  for (let gv = -1.02; gv <= 1.02; gv += step) {
    for (let gu = -1.02; gu <= 1.02; gu += step) {
      const u = gu + rand(-step * 0.18, step * 0.18);
      const v = gv + rand(-step * 0.18, step * 0.18);
      pushHeartPetal(u, v, 0.28);
    }
  }
  // Extra fill for lush center + solid rim (no hollow halo)
  let guard = 0;
  while (hearts.length < COUNT && guard < COUNT * 100) {
    guard++;
    pushHeartPetal(rand(-1.0, 1.0), rand(-1.0, 1.0), 0.32);
  }
  // Mid ring packs tight around the gift pocket so no crater halo remains
  for (let i = 0; i < (isMobile ? 70 : 110); i++) {
    const a = (i / (isMobile ? 70 : 110)) * Math.PI * 2;
    const r = rand(HEART_GIFT_ZONE + 0.02, HEART_RIM_KEEP - 0.02);
    pushHeartPetal(Math.cos(a) * r, Math.sin(a) * r * 0.95, 0.22);
  }
  // Dedicated rim ring so silhouette never thins after gift opens
  for (let i = 0; i < (isMobile ? 90 : 140); i++) {
    const a = (i / (isMobile ? 90 : 140)) * Math.PI * 2;
    const r = rand(0.86, 0.99);
    pushHeartPetal(Math.cos(a) * r, Math.sin(a) * r * 0.95, 0.2);
  }
  hearts.sort((a, b) => (a.soft === b.soft ? a.y - b.y : a.soft ? -1 : 1));

  // Dense continuous sunflower bed rooted at the screen bottom — no gaps
  sunflowers = [];
  const frontCount = isMobile
    ? Math.round(clamp(W / 16, 22, 34))
    : Math.round(clamp(W / 20, 36, 64));
  const backCount = isMobile
    ? Math.round(clamp(W / 22, 16, 26))
    : Math.round(clamp(W / 26, 28, 48));

  function plantRow(count, depthRange, heightRange, sizeMul, tJitter) {
    for (let i = 0; i < count; i++) {
      const slot = (i + 0.5) / count;
      const jitter = (rand(-0.42, 0.42) / count);
      const sx = clamp((slot + jitter) * W, W * 0.01, W * 0.99);
      const sy = H + rand(0, H * 0.012);
      const depth = lerp(depthRange[0], depthRange[1], Math.random());
      const height = rand(heightRange[0], heightRange[1]);
      const headSize = lerp(baseBox * 0.85, baseBox * 1.55, depth) * sizeMul;
      const lean = rand(-1, 1) * 16;
      const t0 = T.bloomT0 + rand(0, tJitter);

      sunflowers.push({
        rootX: sx, rootY: sy, height, lean, depth, headSize,
        swaySpeed: rand(1.1, 2.2), swayAmp: rand(0.04, 0.08),
        phase: rand(0, 6.28), t0, soft: depth < 0.35,
        leaves: [
          { pos: rand(0.25, 0.42), side: -1, len: rand(14, 26), rot: rand(-0.4, -0.2) },
          { pos: rand(0.50, 0.70), side: 1, len: rand(14, 26), rot: rand(0.2, 0.4) },
        ],
      });
    }
  }

  // Mobile: keep sunflowers short so swipe hint + birthday text stay clear
  const backH = isMobile
    ? [H * (isShort ? 0.055 : 0.06), H * (isShort ? 0.10 : 0.12)]
    : [H * (isShort ? 0.10 : 0.12), H * (isShort ? 0.18 : 0.22)];
  const frontH = isMobile
    ? [H * (isShort ? 0.07 : 0.08), H * (isShort ? 0.13 : 0.15)]
    : [H * (isShort ? 0.14 : 0.16), H * (isShort ? 0.24 : 0.30)];

  plantRow(backCount, [0.05, 0.42], backH, isMobile ? 0.72 : 0.82, 1.0);
  plantRow(frontCount, [0.45, 1.0], frontH, isMobile ? 0.88 : 1.0, 1.15);
  sunflowers.sort((a, b) => a.depth - b.depth);
}

function drawSunflowers(t) {
  for (const s of sunflowers) {
    const p = clamp01((t - s.t0) / 0.85);
    if (p <= 0) continue;
    const scale = easeOutBack(p);
    const sway = Math.sin(t * s.swaySpeed + s.phase) * s.swayAmp;
    const curH = s.height * scale;
    const hx = s.rootX + (s.lean + Math.sin(sway) * 28) * scale;
    const hy = s.rootY - curH * Math.cos(sway);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(s.rootX, s.rootY);
    const mx = (s.rootX + hx) / 2 + s.lean * 0.3 * scale;
    const my = (s.rootY + hy) / 2;
    ctx.quadraticCurveTo(mx, my, hx, hy);
    const stemGrad = ctx.createLinearGradient(s.rootX, s.rootY, hx, hy);
    stemGrad.addColorStop(0, '#2d5a27');
    stemGrad.addColorStop(1, '#538d38');
    ctx.strokeStyle = stemGrad;
    ctx.lineWidth = Math.max(2, 4.5 * scale);
    ctx.lineCap = 'round';
    ctx.stroke();

    for (const lf of s.leaves) {
      const lp = lf.pos;
      const lx = lerp(s.rootX, hx, lp);
      const ly = lerp(s.rootY, hy, lp);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(sway + lf.rot + (lf.side < 0 ? -0.4 : 0.4));
      ctx.beginPath();
      ctx.ellipse(lf.side * lf.len * 0.5 * scale, 0, lf.len * 0.5 * scale, lf.len * 0.22 * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#416d2f';
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    const sprite = s.soft ? SUNFLOWER.soft : SUNFLOWER.crisp;
    if (sprite) {
      drawSprite(sprite, hx, hy, s.headSize * scale, sway * 1.6, clamp01(p * 2));
    }
  }
}

function drawBackground() {
  ctx.globalAlpha = 1;
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 1; ctx.fillStyle = groundGrad; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawBokeh(t, dt) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const o of orbs) {
    o.y += o.vy * dt; o.x += Math.sin(t * 0.3 + o.phase) * o.drift;
    if (o.y < -o.r) { o.y = H + o.r; o.x = rand(0, W); }
    ctx.globalAlpha = o.alpha;
    ctx.drawImage(o.sprite, o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
  }
  ctx.restore();
}

function floaterSprite(f) {
  if (f.kind === 'sparkle') return SPARKLE;
  if (f.kind === 'rose') return ROSE[f.idx % ROSE.length];
  if (f.kind === 'flower') return FLOWER[f.idx % FLOWER.length];
  return (f.soft ? SPR.soft : SPR.crisp)[f.idx % SPR.crisp.length];
}

function drawFloaters(t, dt, front) {
  const appear = clamp01((t - 0.2) / 1.4);
  if (appear <= 0) return;
  for (const f of floaters) {
    if ((f.depth >= 0.6) !== front) continue;
    f.y -= f.vy * dt;
    f.x += Math.sin(t * 0.5 + f.phase) * f.sway * dt;
    f.rot += f.vrot * dt;
    if (f.y < -f.box) { f.y = H + f.box; f.x = rand(0, W); }
    const pulse = f.kind === 'sparkle'
      ? 0.65 + 0.35 * Math.sin(t * 3.2 + f.phase)
      : 1;
    drawSprite(floaterSprite(f), f.x, f.y, f.box, f.rot, f.baseA * appear * pulse);
  }
}

function drawHearts(t) {
  const breathe = 1 + Math.sin(t * 0.8) * 0.012;
  for (const h of hearts) {
    if (h.fallen) continue;
    const p = clamp01((t - h.t0) / 0.6);
    if (p <= 0) continue;
    const scale = Math.max(0, easeOutBack(p));
    let alpha = clamp01(p * 1.7); if (h.soft) alpha *= 0.8;
    const settled = clamp01((t - h.t0 - 0.6) / 0.7);
    const sway = settled * Math.sin(t * 1.5 + h.sway) * (h.box * 0.05);
    const rise = (1 - easeOutCubic(p)) * h.box * 0.45;
    const hx = cx + (h.x - cx) * breathe + sway;
    const hy = cy + (h.y - cy) * breathe - rise;
    drawSprite((h.soft ? SPR.soft : SPR.crisp)[h.idx], hx, hy, h.box * scale, h.rot + sway * 0.012, alpha);
  }
}

function spawnFallFromHeart(h) {
  // Sweep aside from the heart center, then fall — not a scratch erase
  const dx = h.x - cx;
  const dy = h.y - cy;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  const outward = rand(55, 130);
  petals.push({
    x: h.x + rand(-4, 4),
    y: h.y + rand(-4, 4),
    vy: rand(32, 78) + Math.max(0, ny) * 24,
    vx: nx * outward + rand(-14, 14),
    sway: rand(0.9, 2.0),
    phase: rand(0, 6.28),
    box: h.box * rand(0.44, 0.78),
    idx: h.idx,
    rot: h.rot + rand(-0.5, 0.5),
    vrot: rand(-2.8, 2.8),
    age: 0,
    land: groundY + rand(-18, -4),
  });
}

/** Sweep petals near a point — they slide outward & fall. Outer rim never moves. */
export function knockPetalsNear(clientX, clientY, brushPx) {
  if (!canvas || !hearts.length) return { knocked: 0, clearRatio: 0 };
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return { knocked: 0, clearRatio: 0 };
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top) * scaleY;
  const brush = (brushPx || Math.min(rx, ry) * 0.3) * ((scaleX + scaleY) * 0.5);

  let knocked = 0;
  // Only inner/mid petals; rim (dist >= HEART_RIM_KEEP) is locked
  const candidates = hearts
    .filter((h) => !h.fallen && h.dist < HEART_RIM_KEEP)
    .map((h) => ({ h, d: Math.hypot(h.x - x, h.y - y) }))
    .filter((c) => c.d <= brush)
    .sort((a, b) => a.h.dist - b.h.dist || a.d - b.d);

  const maxPerStroke = 5;
  for (let i = 0; i < candidates.length && knocked < maxPerStroke; i++) {
    const h = candidates[i].h;
    h.fallen = true;
    spawnFallFromHeart(h);
    knocked++;
  }
  return { knocked, clearRatio: getGiftClearRatio() };
}

export function getGiftClearRatio() {
  let total = 0;
  let gone = 0;
  for (const h of hearts) {
    if (h.dist >= HEART_GIFT_ZONE) continue;
    total++;
    if (h.fallen) gone++;
  }
  return total ? gone / total : 0;
}

export function resetKnockedPetals() {
  for (const h of hearts) h.fallen = false;
  petals = petals.filter((p) => p.isSunflower);
}

/** After reveal, tuck only petals directly under the gift box — no crater. */
export function clearGiftZone() {
  const tuck = HEART_GIFT_ZONE * 0.72;
  for (const h of hearts) {
    if (h.fallen || h.dist > tuck) continue;
    h.fallen = true;
    spawnFallFromHeart(h);
  }
}

function updateTwinkles(t, dt) {
  const active = t > T.bloomT0 + T.bloomSpan * 0.45;
  if (active && twinkles.length < 9 && Math.random() < 0.5) {
    const h = hearts[(Math.random() * hearts.length) | 0];
    if (h) twinkles.push({ x: h.x, y: h.y, size: rand(0.6, 1.3) * (Math.min(W, H) * 0.05), age: 0, life: rand(0.7, 1.2), rot: rand(0, 6.28) });
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = twinkles.length - 1; i >= 0; i--) {
    const s = twinkles[i]; s.age += dt;
    const k = s.age / s.life;
    if (k >= 1) { twinkles.splice(i, 1); continue; }
    const a = Math.sin(k * Math.PI);
    drawSprite(SPARKLE, s.x, s.y, s.size * (0.6 + 0.4 * a), s.rot + k * 1.2, a);
  }
  ctx.restore();
}

function spawnPetal() {
  const isSunflower = Math.random() < 0.55;
  if (isSunflower && SUNFLOWER_PETAL) {
    const sx = rand(W * 0.05, W * 0.95);
    const sy = rand(H * 0.10, H * 0.45);
    petals.push({
      x: sx, y: sy,
      vy: rand(16, 34), vx: rand(-12, 12),
      sway: rand(0.7, 1.5), phase: rand(0, 6.28),
      box: rand(18, 30), isSunflower: true,
      rot: rand(0, 6.28), vrot: rand(-1.6, 1.6),
      age: 0, land: groundY + rand(-14, -2),
    });
    return;
  }
  const h = hearts[(Math.random() * hearts.length) | 0];
  if (!h) return;
  petals.push({
    x: h.x + rand(-8, 8), y: h.y + rand(-8, 8),
    vy: rand(14, 30), vx: rand(-8, 8),
    sway: rand(0.6, 1.4), phase: rand(0, 6.28),
    box: h.box * rand(0.34, 0.6), idx: h.idx,
    rot: rand(0, 6.28), vrot: rand(-1.4, 1.4),
    age: 0, land: groundY + rand(-14, -2),
  });
}

function drawPetals(t, dt) {
  for (let i = petals.length - 1; i >= 0; i--) {
    const p = petals[i]; p.age += dt; p.vy += 8 * dt;
    p.x += (p.vx + Math.sin(t * p.sway + p.phase) * 16) * dt;
    p.y += p.vy * dt; p.rot += p.vrot * dt;
    if (p.y >= p.land) {
      rested.push({
        x: clamp(p.x, 6, W - 6), y: p.land, box: p.box,
        idx: p.idx, isSunflower: p.isSunflower,
        rot: p.rot, a: rand(0.7, 0.95),
      });
      if (rested.length > (W <= 768 ? 38 : 115)) rested.shift();
      petals.splice(i, 1); continue;
    }
    const a = p.age < 0.3 ? p.age / 0.3 : 1;
    if (p.isSunflower && SUNFLOWER_PETAL) {
      drawSprite(SUNFLOWER_PETAL, p.x, p.y, p.box, p.rot, a);
    } else {
      drawSprite(SPR.crisp[p.idx], p.x, p.y, p.box, p.rot, a);
    }
  }
}

function drawRested() {
  for (const r of rested) {
    if (r.isSunflower && SUNFLOWER_PETAL) {
      drawSprite(SUNFLOWER_PETAL, r.x, r.y, r.box, r.rot, r.a);
    } else {
      drawSprite(SPR.crisp[r.idx], r.x, r.y, r.box, r.rot, r.a);
    }
  }
}

export function showWish(on) {
  if (wishEl) wishEl.classList.toggle('is-in', on);
  if (on && !wishShown && onWishShownCallback) {
    wishShown = true;
    onWishShownCallback(getHeartLayout());
  }
  if (!on) wishShown = false;
}

/** Kept for callers that still import showCake — finale cake UI removed. */
export function showCake(_on) {}

export function getHeartLayout() {
  const canvasEl = canvas || $('tree');
  const rect = canvasEl ? canvasEl.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H };
  const scaleX = rect.width / (W || 1);
  const scaleY = rect.height / (H || 1);
  return {
    cx: rect.left + cx * scaleX,
    cy: rect.top + cy * scaleY,
    rx: rx * scaleX,
    ry: ry * scaleY,
    W,
    H,
  };
}

function treeFrame(now) {
  if (!treeStartT) { treeStartT = now; treeLastT = now; }
  const t  = (now - treeStartT) / 1000;
  const dt = Math.min(0.05, (now - treeLastT) / 1000); treeLastT = now;

  drawBackground();
  drawBokeh(t, dt);
  drawFloaters(t, dt, false);
  drawHearts(t);
  drawPetals(t, dt);
  updateTwinkles(t, dt);
  drawSunflowers(t);
  drawRested();
  drawFloaters(t, dt, true);

  showWish(t >= T.noteStart);

  if (!window.bdayDone && t >= T.done) window.bdayDone = true;
  if (!replayArmed && t >= T.done + 1.0) {
    replayArmed = true;
    if (armReplayCallback) armReplayCallback();
  }

  treeRAF = requestAnimationFrame(treeFrame);
}

export function treeStart() {
  treeStartT = 0; treeLastT = 0; lastPetal = 0; replayArmed = false; wishShown = false; window.bdayDone = false;
  cue('grow');
  buildScene();
  if (!treeRAF) treeRAF = requestAnimationFrame(treeFrame);
}

export function treeStop() {
  if (treeRAF) { cancelAnimationFrame(treeRAF); treeRAF = 0; }
  if (ctx) ctx.clearRect(0, 0, W, H);
  wishShown = false;
}

export function drawFinal() {
  buildScene();
  drawBackground(); drawBokeh(0, 0); drawFloaters(99, 0, false);
  drawHearts(99);
  drawSunflowers(99);
  drawFloaters(99, 0, true);
  showWish(true);
  window.bdayDone = true;
}

export function resizeTree(curW, curH, devicePR) {
  W = curW; H = curH; dpr = devicePR;
  if (canvas) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  buildSprites();
  buildScene();
}

export function initTree({ onArmReplay, onWishShown } = {}) {
  canvas = $('tree');
  ctx = canvas ? canvas.getContext('2d') : null;
  wishEl = $('wish');
  armReplayCallback = onArmReplay;
  onWishShownCallback = onWishShown;
}
