/* ============================================================
   SCREEN 3 COMPONENT — ACT 4: THE BLOOMING BLOSSOM TREE CANVAS
   2D canvas engine: growing trunk, fractal branches, lit blossoms,
   meadow sunflowers, falling petals, godrays, and golden dawn.
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
];

const T = {
  trunkStart: 0.10,
  branchSpan: 1.80,
  bloomT0:    1.25,
  bloomSpan:  2.00,
  petalT0:    2.45,
  noteStart:  0.45,
  done:       4.60,
};

const SS = 168;

let canvas, ctx, wishEl, cakeWrapper;
let W = 0, H = 0, dpr = 1;
let cx = 0, cy = 0, rx = 0, ry = 0, groundY = 0;
let branches = [], hearts = [], petals = [], rested = [], orbs = [], floaters = [], twinkles = [], sunflowers = [];
let bgGrad = null, glowGrad = null, groundGrad = null;
let heartPoly = null;
let SPR = { crisp: [], soft: [] }, BOKEH = [], SPARKLE = null;
let SUNFLOWER = { crisp: null, soft: null }, SUNFLOWER_PETAL = null;

let treeStartT = 0, treeLastT = 0, treeRAF = 0, lastPetal = 0, replayArmed = false;
let armReplayCallback = null;

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

const quad = (b, t) => {
  const m = 1 - t, a = m * m, k = 2 * m * t, d = t * t;
  return { x: a * b.x1 + k * b.cx + d * b.x2, y: a * b.y1 + k * b.cy + d * b.y2 };
};

function barkGrad(x1, y1, x2, y2, depth) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  g.addColorStop(0, `hsl(278 28% ${24 + depth * 3}%)`);
  g.addColorStop(1, `hsl(276 26% ${38 + depth * 5}%)`);
  return g;
}

export function buildScene() {
  branches = []; hearts = []; petals = []; rested = []; twinkles = []; orbs = []; floaters = []; sunflowers = [];
  buildHeartPoly();

  const wide = W / H > 1.2;
  cx = W * (wide ? 0.57 : 0.5);
  cy = H * (wide ? 0.37 : 0.40);
  ry = Math.min(H * (wide ? 0.33 : 0.28), W * 0.31);
  rx = ry * 1.16;
  groundY = H * (wide ? 0.93 : 0.94);

  bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#1c1530');
  bgGrad.addColorStop(0.35, '#312651');
  bgGrad.addColorStop(0.65, '#503967');
  bgGrad.addColorStop(0.88, '#97588D');
  bgGrad.addColorStop(1, '#B97397');
  glowGrad = ctx.createRadialGradient(cx, cy, ry * 0.1, cx, cy, ry * 1.55);
  glowGrad.addColorStop(0, 'rgba(221,155,156,0.68)');
  glowGrad.addColorStop(0.48, 'rgba(185,115,151,0.28)');
  glowGrad.addColorStop(1, 'rgba(80,57,103,0)');
  groundGrad = ctx.createRadialGradient(cx, H * 1.02, ry * 0.2, cx, H * 1.02, ry * 1.6);
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

  const FN = wide ? 18 : 15;
  for (let i = 0; i < FN; i++) {
    const depth = Math.random();
    floaters.push({
      x: rand(0, W), y: rand(-H * 0.1, H * 1.1), depth,
      idx: (Math.random() * BLOSSOM.length) | 0,
      box: lerp(Math.min(W, H) * 0.025, Math.min(W, H) * 0.075, depth),
      vy: lerp(7, 20, depth), sway: rand(8, 22), phase: rand(0, 6.28),
      rot: rand(-0.4, 0.4), vrot: rand(-0.5, 0.5),
      baseA: lerp(0.16, 0.5, depth), soft: depth < 0.45,
    });
  }

  const baseX = cx, baseY = H * 1.0;
  const trunkTopY = cy + ry * 0.62;
  const trunkW = Math.max(9, W * 0.024);
  const limbLen = ry * 0.6;
  const insidePx = (x, y, m = 0.9) => pointInPoly((x - cx) / (rx * m), (cy - y) / (ry * m));

  function addBranch(x, y, ang, len, w0, depth, t0) {
    let ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, clipped = false;
    if (!insidePx(ex, ey)) {
      let lo = 0, hi = 1;
      for (let k = 0; k < 12; k++) {
        const mid = (lo + hi) / 2;
        (insidePx(x + Math.cos(ang) * len * mid, y + Math.sin(ang) * len * mid) ? (lo = mid) : (hi = mid));
      }
      ex = x + Math.cos(ang) * len * lo; ey = y + Math.sin(ang) * len * lo; clipped = true;
    }
    const mx = (x + ex) / 2, my = (y + ey) / 2, perp = ang + Math.PI / 2, bend = rand(-1, 1) * len * 0.12, w1 = w0 * 0.66;
    branches.push({ x1: x, y1: y, cx: mx + Math.cos(perp) * bend, cy: my + Math.sin(perp) * bend, x2: ex, y2: ey, w0, w1, t0, dur: Math.max(0.14, 0.32 - depth * 0.03), depth, grad: barkGrad(x, y, ex, ey, depth) });
    return { ex, ey, w1, clipped };
  }

  function grow(x, y, ang, len, w, depth, t0) {
    const r = addBranch(x, y, ang, len, w, depth, t0);
    if (r.clipped || depth >= 6 || len < ry * 0.06) return;
    const childT0 = t0 + (0.32 - depth * 0.03) * 0.6;
    const n = Math.random() < 0.55 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const spread = 0.6 * (i - (n - 1) / 2) + rand(-0.22, 0.22), lift = -0.06 + rand(-0.05, 0.05);
      grow(r.ex, r.ey, ang + spread + lift, len * rand(0.74, 0.84), r.w1, depth + 1, childT0 + i * 0.03);
    }
  }

  addBranch(baseX, baseY, -Math.PI / 2, baseY - trunkTopY, trunkW, 0, T.trunkStart);
  branches[0].dur = 0.55;
  const limbT0 = T.trunkStart + 0.36, L = 3;
  for (let i = 0; i < L; i++) {
    const ang = -Math.PI / 2 + 0.62 * (i - (L - 1) / 2) + rand(-0.12, 0.12);
    grow(baseX, trunkTopY, ang, limbLen, trunkW * 0.7, 1, limbT0 + i * 0.05);
  }
  const maxT0 = branches.reduce((m, b) => Math.max(m, b.t0 + b.dur), 0);
  const sc = (T.branchSpan - T.trunkStart) / (maxT0 - T.trunkStart);
  for (const b of branches) b.t0 = T.trunkStart + (b.t0 - T.trunkStart) * sc;

  const isMobile = W <= 768;
  const COUNT = isMobile ? Math.round(clamp((rx * ry) / 100, 150, 220)) : Math.round(clamp((rx * ry) / 56, 250, 440));
  const baseBox = clamp(Math.min(W, H) * 0.115, 30, 74);
  let guard = 0;
  while (hearts.length < COUNT && guard < COUNT * 50) {
    guard++;
    const u = rand(-1.06, 1.06), v = rand(-1.06, 1.06);
    if (!pointInPoly(u, v)) continue;
    const x = cx + u * rx, y = cy - v * ry;
    const d = clamp01(Math.hypot(u, v + 1) / 2.4);
    const t0 = T.bloomT0 + d * (T.bloomSpan * 0.82) + rand(0, T.bloomSpan * 0.18);
    const soft = Math.random() < 0.42;
    hearts.push({
      x, y, idx: (Math.random() * BLOSSOM.length) | 0,
      soft, box: baseBox * (soft ? rand(0.6, 0.85) : rand(0.78, 1.12)),
      rot: rand(-0.55, 0.55), sway: rand(0, 6.28), t0,
    });
  }
  hearts.sort((a, b) => (a.soft === b.soft ? a.y - b.y : a.soft ? -1 : 1));

  sunflowers = [];
  const sunflowerCount = isMobile ? Math.round(clamp(W / 22, 16, 26)) : Math.round(clamp(W / 36, 28, 48));
  for (let i = 0; i < sunflowerCount; i++) {
    let sx;
    if (i % 3 === 0) sx = rand(W * 0.02, W * 0.40);
    else if (i % 3 === 1) sx = rand(W * 0.60, W * 0.98);
    else sx = rand(W * 0.35, W * 0.65);

    const sy = groundY + rand(-3, H * 0.05);
    const height = rand(H * 0.13, H * 0.27);
    const depth = Math.random();
    const headSize = lerp(baseBox * 0.92, baseBox * 1.62, depth);
    const lean = rand(-1, 1) * 20;
    const t0 = T.bloomT0 + rand(0, 1.2);

    sunflowers.push({
      rootX: sx, rootY: sy, height, lean, depth, headSize,
      swaySpeed: rand(1.1, 2.2), swayAmp: rand(0.04, 0.08),
      phase: rand(0, 6.28), t0, soft: depth < 0.30,
      leaves: [
        { pos: rand(0.25, 0.42), side: -1, len: rand(16, 28), rot: rand(-0.4, -0.2) },
        { pos: rand(0.50, 0.70), side: 1, len: rand(16, 28), rot: rand(0.2, 0.4) },
      ],
    });
  }
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

function drawGodRays(t, intensity) {
  if (intensity <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const ox = cx, oy = cy - ry * 0.35, R = Math.hypot(W, H) * 1.1;
  const rays = 9, sweep = Math.sin(t * 0.07) * 0.18;
  for (let i = 0; i < rays; i++) {
    const a = -Math.PI / 2 + sweep + (i - (rays - 1) / 2) * 0.2;
    const hw = 0.035 + 0.02 * (0.5 + 0.5 * Math.sin(t * 0.5 + i * 1.7));
    const a1 = a - hw, a2 = a + hw;
    const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(a) * R, oy + Math.sin(a) * R);
    g.addColorStop(0, `rgba(255,232,190,${0.10 * intensity})`);
    g.addColorStop(0.5, `rgba(255,214,170,${0.05 * intensity})`);
    g.addColorStop(1, 'rgba(255,214,170,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + Math.cos(a1) * R, oy + Math.sin(a1) * R);
    ctx.lineTo(ox + Math.cos(a2) * R, oy + Math.sin(a2) * R);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawGlow(t) {
  const gi = clamp01((t - T.bloomT0) / (T.bloomSpan * 0.9));
  if (gi <= 0) return;
  ctx.save(); ctx.globalAlpha = gi; ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = glowGrad; ctx.fillRect(0, 0, W, H);
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

function drawFloaters(t, dt, front) {
  const appear = clamp01((t - 0.2) / 1.4);
  if (appear <= 0) return;
  for (const f of floaters) {
    if ((f.depth >= 0.6) !== front) continue;
    f.y -= f.vy * dt;
    f.x += Math.sin(t * 0.5 + f.phase) * f.sway * dt;
    f.rot += f.vrot * dt;
    if (f.y < -f.box) { f.y = H + f.box; f.x = rand(0, W); }
    drawSprite((f.soft ? SPR.soft : SPR.crisp)[f.idx], f.x, f.y, f.box, f.rot, f.baseA * appear);
  }
}

function drawBranches(t) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const b of branches) {
    const f = clamp01((t - b.t0) / b.dur);
    if (f <= 0) continue;
    const e = easeOutCubic(f);
    ctx.strokeStyle = b.grad;
    const steps = 12, last = Math.max(1, Math.ceil(steps * e));
    let prev = quad(b, 0);
    for (let i = 1; i <= last; i++) {
      const tt = Math.min(e, i / steps), p = quad(b, tt);
      ctx.lineWidth = lerp(b.w0, b.w1, tt);
      ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      prev = p;
    }
  }
}

function drawHearts(t) {
  const breathe = 1 + Math.sin(t * 0.8) * 0.012;
  for (const h of hearts) {
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
      age: 0, land: groundY + rand(-6, H * 0.05),
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
    age: 0, land: groundY + rand(-6, H * 0.05),
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
}

export function showCake(on) {
  if (cakeWrapper) {
    cakeWrapper.classList.toggle('is-in', on);
  }
}

function treeFrame(now) {
  if (!treeStartT) { treeStartT = now; treeLastT = now; }
  const t  = (now - treeStartT) / 1000;
  const dt = Math.min(0.05, (now - treeLastT) / 1000); treeLastT = now;

  const rays = clamp01((t - T.bloomT0) / T.bloomSpan);

  drawBackground();
  drawGodRays(t, rays);
  drawGlow(t);
  drawBokeh(t, dt);
  drawFloaters(t, dt, false);
  drawBranches(t);
  drawHearts(t);
  updateTwinkles(t, dt);
  drawSunflowers(t);
  if (t > T.petalT0 && now - lastPetal > (W <= 768 ? 220 : 150)) {
    spawnPetal();
    if (W > 768) spawnPetal();
    lastPetal = now;
  }
  drawPetals(t, dt);
  drawRested();
  drawFloaters(t, dt, true);

  showWish(t >= T.noteStart);
  showCake(t >= T.noteStart + 0.3);

  if (!window.bdayDone && t >= T.done) window.bdayDone = true;
  if (!replayArmed && t >= T.done + 1.0) {
    replayArmed = true;
    if (armReplayCallback) armReplayCallback();
  }

  treeRAF = requestAnimationFrame(treeFrame);
}

export function treeStart() {
  treeStartT = 0; treeLastT = 0; lastPetal = 0; replayArmed = false; window.bdayDone = false;
  cue('grow');
  buildScene();
  if (!treeRAF) treeRAF = requestAnimationFrame(treeFrame);
}

export function treeStop() {
  if (treeRAF) { cancelAnimationFrame(treeRAF); treeRAF = 0; }
  if (ctx) ctx.clearRect(0, 0, W, H);
}

export function drawFinal() {
  buildScene();
  drawBackground(); drawGodRays(0, 1); drawGlow(T.done); drawBokeh(0, 0); drawFloaters(99, 0, false);
  drawBranches(99); drawHearts(99);
  drawSunflowers(99);
  for (let i = 0; i < 45; i++) {
    const isSun = Math.random() < 0.4;
    rested.push({
      x: rand(10, W - 10),
      y: groundY + rand(-6, H * 0.05),
      box: rand(16, 32),
      idx: (Math.random() * BLOSSOM.length) | 0,
      isSunflower: isSun,
      rot: rand(0, 6.28),
      a: 0.85,
    });
  }
  drawRested(); drawFloaters(99, 0, true);
  showWish(true);
  showCake(true);
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

export function initTree({ onArmReplay } = {}) {
  canvas = $('tree');
  ctx = canvas ? canvas.getContext('2d') : null;
  wishEl = $('wish');
  cakeWrapper = $('cakeWrapper');
  armReplayCallback = onArmReplay;
}
