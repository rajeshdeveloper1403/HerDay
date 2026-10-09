/* ============================================================
   SCREEN 3 — HEART CARROM
   Physics: React carrom engine (BOARD 500)
   Board art: CarromBoardimg.png (frame + bed); canvas overlays bed
   Coins / striker: Coin A/N/U + Sticker PNGs
   ============================================================ */
import gsap from 'gsap';
import { $, clamp, reduceMotion } from '../core/utils.js';
import { cue } from '../core/audio.js';

/* --- GAME CONSTANTS (React engine + tiny art alignment nudges) --- */
const BOARD = 500;
const FRICTION = 0.985;
const POCKET_R = 24;
const PUCK_R = 12;
const STRIKER_R = 18;
/* Centered on painted baseline band of CarromBoardimg cream bed */
const BASELINE_Y = 428;
const BASE_MIN = 75;
const BASE_MAX = BOARD - 75;
const WALL_REST = 0.8;
const POWER = 0.15;
const STOP = 0.05;
const MAX_AIM = 140;

/* Pocket centers match measured hearts on cream bed → 500 space */
const POCKET_INSET = 4;
const POCKETS = [
  { x: POCKET_R + POCKET_INSET, y: POCKET_R + POCKET_INSET },
  { x: BOARD - POCKET_R - POCKET_INSET, y: POCKET_R + POCKET_INSET },
  { x: POCKET_R + POCKET_INSET, y: BOARD - POCKET_R - POCKET_INSET },
  { x: BOARD - POCKET_R - POCKET_INSET, y: BOARD - POCKET_R - POCKET_INSET },
];

/**
 * Cream play-bed crop inside CarromBoardimg.png (1254²).
 * Canvas is CSS-positioned over this rect so frame stays visible.
 */
const BOARD_SRC_SIZE = 1254;
const BED_CROP = { x: 116, y: 121, w: 1018, h: 971 };

const ASSET = {
  board: '/photos/CarromBoardimg.png',
  coinA: '/photos/Coin%20A.png',
  coinN: '/photos/Coin%20N.png',
  coinU: '/photos/Coin%20U.png',
  sticker: '/photos/Sticker.png',
  hand: '/photos/Strike%20Hand.png',
};

/** Visual size = physics diameter × factor (tight-cropped sprites) */
const COIN_VIS = 1.45;
const STRIKER_VIS = 1.35;
const HAND_VIS = 1.2;

let imgs = { A: null, N: null, U: null, sticker: null, hand: null, board: null };
let imagesReady = false;
let boardSheet = null; // fallback code-drawn bed if PNG missing
let useBoardArt = false;

let screen, canvas, ctx, hintEl, titleEl, stageEl, boardArtEl;
let slider, sliderTrack, sliderThumb, sliderFill;
let celeEl, celeBurst, missEl;

let phase = 'A';
let active = false;
let inputLocked = false;
let resolving = false;
let isAiming = false;
let sliderDragging = false;
let aimVector = { x: 0, y: 0 };
let strikerX = BOARD / 2;
let showHandHint = true;
let handPulse = 0;

let pieces = [];
let raf = 0;
let dpr = 1;
let shotInProgress = false;
/** Out-of-order pocketed letters — restore to center when striker returns to baseline */
let pendingCenterRestore = [];

let onOpenMemories = null;
let onOpenNSlide = null;
let onCompleteToTree = null;

/* -------------------- pieces -------------------- */

function makeStriker(x) {
  return {
    id: 'striker',
    letter: null,
    x,
    y: BASELINE_Y,
    vx: 0,
    vy: 0,
    radius: STRIKER_R,
    isStriker: true,
    alive: true,
  };
}

function coinHome(letter) {
  const c = BOARD / 2;
  if (letter === 'A') return { x: c - 25, y: c };
  if (letter === 'N') return { x: c, y: c - 25 };
  return { x: c + 25, y: c };
}

function makeCoin(letter) {
  const home = coinHome(letter);
  return {
    id: letter,
    letter,
    x: home.x,
    y: home.y,
    vx: 0,
    vy: 0,
    radius: PUCK_R,
    isStriker: false,
    alive: true,
  };
}

function livingCoins() {
  return pieces.filter((p) => !p.isStriker && p.alive);
}

function striker() {
  return pieces.find((p) => p.isStriker);
}

function boardSettled() {
  return pieces.every((p) => !p.alive || (Math.abs(p.vx) < STOP && Math.abs(p.vy) < STOP));
}

function PHASES_FROM(p) {
  const all = ['A', 'N', 'U'];
  const i = all.indexOf(p);
  if (p === 'done' || i < 0) return [];
  return all.slice(i);
}

function resetPiecesForPhase() {
  pieces = [makeStriker(strikerX), ...PHASES_FROM(phase).map(makeCoin)];
  aimVector = { x: 0, y: 0 };
  isAiming = false;
  showHandHint = true;
  pendingCenterRestore = [];
}

/** After a shot: bring striker home — leave coins where they stopped; restore foul coins to center */
function resetStrikerOnly() {
  aimVector = { x: 0, y: 0 };
  isAiming = false;
  showHandHint = true;

  pieces.forEach((p) => {
    p.vx = 0;
    p.vy = 0;
  });

  let s = striker();
  if (!s) {
    s = makeStriker(strikerX);
    pieces.unshift(s);
  }
  s.alive = true;
  s.isStriker = true;
  s.vx = 0;
  s.vy = 0;
  s.x = clamp(strikerX, BASE_MIN, BASE_MAX);
  s.y = BASELINE_Y;

  // Wrong-order pocketed coins come back with the striker (not instantly)
  const toRestore = pendingCenterRestore.splice(0, pendingCenterRestore.length);
  toRestore.forEach((letter) => {
    let coin = pieces.find((p) => p.letter === letter);
    if (!coin) {
      coin = makeCoin(letter);
      pieces.push(coin);
    }
    restoreCoinToCenter(coin);
  });
}

/* -------------------- physics (exact React engine) -------------------- */

function updatePhysics() {
  pieces.forEach((p) => {
    if (!p.alive) return;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= FRICTION;
    p.vy *= FRICTION;
    if (Math.abs(p.vx) < STOP) p.vx = 0;
    if (Math.abs(p.vy) < STOP) p.vy = 0;

    if (p.x < p.radius) {
      p.x = p.radius;
      p.vx *= -WALL_REST;
    }
    if (p.x > BOARD - p.radius) {
      p.x = BOARD - p.radius;
      p.vx *= -WALL_REST;
    }
    if (p.y < p.radius) {
      p.y = p.radius;
      p.vy *= -WALL_REST;
    }
    if (p.y > BOARD - p.radius) {
      p.y = BOARD - p.radius;
      p.vy *= -WALL_REST;
    }
  });

  const live = pieces.filter((p) => p.alive);
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const p1 = live[i];
      const p2 = live[j];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy) || 1e-6;
      const minDist = p1.radius + p2.radius;
      if (dist >= minDist) continue;

      const overlap = minDist - dist;
      const nx = dx / dist;
      const ny = dy / dist;
      p1.x -= (nx * overlap) / 2;
      p1.y -= (ny * overlap) / 2;
      p2.x += (nx * overlap) / 2;
      p2.y += (ny * overlap) / 2;

      const kx = p1.vx - p2.vx;
      const ky = p1.vy - p2.vy;
      const p = nx * kx + ny * ky;
      p1.vx -= p * nx;
      p1.vy -= p * ny; // fixed (React demo had p1.y typo)
      p2.vx += p * nx;
      p2.vy += p * ny;
    }
  }

  let pocketedTarget = null;
  pieces.forEach((p) => {
    if (!p.alive) return;
    const hit = POCKETS.some((pocket) => Math.hypot(p.x - pocket.x, p.y - pocket.y) < POCKET_R);
    if (!hit) return;

    if (p.isStriker) {
      p.vx = 0;
      p.vy = 0;
      p.x = strikerX;
      p.y = BASELINE_Y;
      return;
    }

    // Correct order (A → N → U): pocket counts
    if (p.letter === phase) {
      p.alive = false;
      p.vx = 0;
      p.vy = 0;
      pocketedTarget = p.letter;
      return;
    }

    // Wrong order — hide for now; restore to center when striker returns to baseline
    p.alive = false;
    p.vx = 0;
    p.vy = 0;
    if (!pendingCenterRestore.includes(p.letter)) pendingCenterRestore.push(p.letter);
  });

  return { pocketedTarget };
}

/** Place an out-of-order pocketed coin back near the board center */
function restoreCoinToCenter(p) {
  const home = coinHome(p.letter);
  p.alive = true;
  p.vx = 0;
  p.vy = 0;
  p.x = home.x;
  p.y = home.y;

  // Nudge away if overlapping another living piece
  pieces.forEach((other) => {
    if (other === p || !other.alive) return;
    const dx = p.x - other.x;
    const dy = p.y - other.y;
    const dist = Math.hypot(dx, dy) || 1e-6;
    const minDist = p.radius + other.radius + 1;
    if (dist >= minDist) return;
    const push = (minDist - dist) / dist;
    p.x += dx * push;
    p.y += dy * push;
    p.x = clamp(p.x, p.radius, BOARD - p.radius);
    p.y = clamp(p.y, p.radius, BOARD - p.radius);
  });
}

/* -------------------- 3D board (code-drawn, PNG look) -------------------- */

function fillGlossHeart(c, x, y, s) {
  c.save();
  c.translate(x, y);
  c.beginPath();
  c.moveTo(0, s * 0.82);
  c.bezierCurveTo(-s * 1.05, s * 0.12, -s * 1.0, -s * 0.72, 0, -s * 0.32);
  c.bezierCurveTo(s * 1.0, -s * 0.72, s * 1.05, s * 0.12, 0, s * 0.82);
  c.closePath();
  const hg = c.createRadialGradient(-s * 0.25, -s * 0.35, s * 0.08, 0, 0, s);
  hg.addColorStop(0, '#ffb8d8');
  hg.addColorStop(0.45, '#ef4a9a');
  hg.addColorStop(1, '#9a2060');
  c.fillStyle = hg;
  c.shadowColor = 'rgba(120, 30, 70, 0.35)';
  c.shadowBlur = 4;
  c.shadowOffsetY = 1;
  c.fill();
  c.shadowColor = 'transparent';
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.beginPath();
  c.ellipse(-s * 0.28, -s * 0.32, s * 0.22, s * 0.14, -0.45, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function paint3DBoard(c) {
  // Peach wood bed — matches boardnew play surface
  const bed = c.createLinearGradient(0, 0, BOARD, BOARD);
  bed.addColorStop(0, '#fff6ec');
  bed.addColorStop(0.35, '#f6e2c8');
  bed.addColorStop(0.7, '#efd5b4');
  bed.addColorStop(1, '#e8c9a4');
  c.fillStyle = bed;
  c.fillRect(0, 0, BOARD, BOARD);

  // wood grain
  c.strokeStyle = 'rgba(150, 95, 55, 0.055)';
  c.lineWidth = 1;
  for (let y = 5; y < BOARD; y += 9) {
    c.beginPath();
    c.moveTo(0, y + ((y * 7) % 3) * 0.4);
    c.lineTo(BOARD, y);
    c.stroke();
  }

  // cushion bevel (top light / bottom shade) — 3D like hero heart
  const topShade = c.createLinearGradient(0, 0, 0, 22);
  topShade.addColorStop(0, 'rgba(255,255,255,0.35)');
  topShade.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = topShade;
  c.fillRect(0, 0, BOARD, 22);
  const botShade = c.createLinearGradient(0, BOARD - 28, 0, BOARD);
  botShade.addColorStop(0, 'rgba(90,40,50,0)');
  botShade.addColorStop(1, 'rgba(90,40,50,0.16)');
  c.fillStyle = botShade;
  c.fillRect(0, BOARD - 28, BOARD, 28);

  // Heart pockets — thick gold rim + deep velvet (boardnew style)
  POCKETS.forEach((p, i) => {
    const rot = [(-45 * Math.PI) / 180, (45 * Math.PI) / 180, (-135 * Math.PI) / 180, (135 * Math.PI) / 180][i];
    c.save();
    c.translate(p.x, p.y);
    c.rotate(rot);
    // outer gold body
    c.beginPath();
    c.moveTo(0, POCKET_R * 1.08);
    c.bezierCurveTo(-POCKET_R * 1.28, POCKET_R * 0.14, -POCKET_R * 1.2, -POCKET_R * 0.95, 0, -POCKET_R * 0.4);
    c.bezierCurveTo(POCKET_R * 1.2, -POCKET_R * 0.95, POCKET_R * 1.28, POCKET_R * 0.14, 0, POCKET_R * 1.08);
    c.closePath();
    const gold = c.createLinearGradient(-POCKET_R, -POCKET_R, POCKET_R, POCKET_R);
    gold.addColorStop(0, '#fff6d0');
    gold.addColorStop(0.3, '#f0c45a');
    gold.addColorStop(0.65, '#d4a030');
    gold.addColorStop(1, '#8a6010');
    c.fillStyle = gold;
    c.shadowColor = 'rgba(160, 100, 20, 0.5)';
    c.shadowBlur = 8;
    c.fill();
    c.shadowColor = 'transparent';
    // gold highlight rim stroke
    c.strokeStyle = 'rgba(255, 240, 180, 0.7)';
    c.lineWidth = 1.5;
    c.stroke();
    // velvet hole
    c.beginPath();
    c.moveTo(0, POCKET_R * 0.7);
    c.bezierCurveTo(-POCKET_R * 0.88, POCKET_R * 0.05, -POCKET_R * 0.84, -POCKET_R * 0.64, 0, -POCKET_R * 0.22);
    c.bezierCurveTo(POCKET_R * 0.84, -POCKET_R * 0.64, POCKET_R * 0.88, POCKET_R * 0.05, 0, POCKET_R * 0.7);
    c.closePath();
    const velvet = c.createRadialGradient(-2, -5, 1, 0, 2, POCKET_R * 0.85);
    velvet.addColorStop(0, '#7a2058');
    velvet.addColorStop(0.55, '#3a1028');
    velvet.addColorStop(1, '#0e050a');
    c.fillStyle = velvet;
    c.fill();
    c.restore();
  });

  const ink = '#e23a8a';
  c.strokeStyle = ink;
  c.fillStyle = ink;
  c.lineWidth = 2.4;
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // Double boundary square (boardnew)
  c.strokeRect(48, 48, BOARD - 96, BOARD - 96);
  c.lineWidth = 1.6;
  c.strokeRect(58, 58, BOARD - 116, BOARD - 116);
  c.lineWidth = 2.4;

  const cx = BOARD / 2;
  const cy = BOARD / 2;

  // Center rings
  c.beginPath();
  c.arc(cx, cy, 76, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.arc(cx, cy, 42, 0, Math.PI * 2);
  c.stroke();

  // 3D heart clover (4 glossy hearts) + pink diamonds
  [
    [0, -16],
    [0, 16],
    [-16, 0],
    [14, 0],
  ].forEach(([ox, oy]) => fillGlossHeart(c, cx + ox * 0.4, cy + oy * 0.4, 11));

  c.fillStyle = '#ef4a9a';
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4 + Math.PI / 8;
    const dx = Math.cos(ang) * 28;
    const dy = Math.sin(ang) * 28;
    c.save();
    c.translate(cx + dx, cy + dy);
    c.rotate(Math.PI / 4);
    c.fillRect(-2.2, -2.2, 4.4, 4.4);
    c.restore();
  }

  // Gold diamonds on outer ring
  c.fillStyle = '#f0c24a';
  [
    [cx, cy - 58],
    [cx, cy + 58],
    [cx - 58, cy],
    [cx + 58, cy],
  ].forEach(([x, y]) => {
    c.save();
    c.translate(x, y);
    c.rotate(Math.PI / 4);
    c.fillRect(-4.5, -4.5, 9, 9);
    c.restore();
  });

  // Baselines — double lines, end discs, mid hearts (all 4 sides)
  const drawBaseH = (y0, y1) => {
    c.strokeStyle = ink;
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(BASE_MIN, y0);
    c.lineTo(BASE_MAX, y0);
    c.moveTo(BASE_MIN, y1);
    c.lineTo(BASE_MAX, y1);
    c.stroke();
    const midY = (y0 + y1) / 2;
    [BASE_MIN, BASE_MAX].forEach((x) => {
      const g = c.createRadialGradient(x - 3, midY - 3, 1, x, midY, 12);
      g.addColorStop(0, '#ff8ec0');
      g.addColorStop(0.55, '#e23a8a');
      g.addColorStop(1, '#a01858');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, midY, 12, 0, Math.PI * 2);
      c.fill();
    });
    fillGlossHeart(c, BOARD / 2, midY, 8);
  };
  const drawBaseV = (x0, x1) => {
    c.strokeStyle = ink;
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(x0, BASE_MIN);
    c.lineTo(x0, BASE_MAX);
    c.moveTo(x1, BASE_MIN);
    c.lineTo(x1, BASE_MAX);
    c.stroke();
    const midX = (x0 + x1) / 2;
    [BASE_MIN, BASE_MAX].forEach((y) => {
      const g = c.createRadialGradient(midX - 3, y - 3, 1, midX, y, 12);
      g.addColorStop(0, '#ff8ec0');
      g.addColorStop(0.55, '#e23a8a');
      g.addColorStop(1, '#a01858');
      c.fillStyle = g;
      c.beginPath();
      c.arc(midX, y, 12, 0, Math.PI * 2);
      c.fill();
    });
    fillGlossHeart(c, midX, BOARD / 2, 8);
  };
  drawBaseH(BASELINE_Y - 10, BASELINE_Y + 10);
  drawBaseH(75 - 10, 75 + 10);
  drawBaseV(75 - 10, 75 + 10);
  drawBaseV(BOARD - 75 - 10, BOARD - 75 + 10);

  // Corner arrows toward pockets
  c.strokeStyle = ink;
  c.lineWidth = 2;
  [
    [BASE_MIN + 4, BASE_MIN + 4, POCKET_R + 10, POCKET_R + 10],
    [BASE_MAX - 4, BASE_MIN + 4, BOARD - POCKET_R - 10, POCKET_R + 10],
    [BASE_MIN + 4, BASE_MAX - 4, POCKET_R + 10, BOARD - POCKET_R - 10],
    [BASE_MAX - 4, BASE_MAX - 4, BOARD - POCKET_R - 10, BOARD - POCKET_R - 10],
  ].forEach(([x0, y0, x1, y1]) => {
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
    // tiny arrow head
    const ang = Math.atan2(y1 - y0, x1 - x0);
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x1 - Math.cos(ang - 0.45) * 8, y1 - Math.sin(ang - 0.45) * 8);
    c.moveTo(x1, y1);
    c.lineTo(x1 - Math.cos(ang + 0.45) * 8, y1 - Math.sin(ang + 0.45) * 8);
    c.stroke();
  });

  // Soft vignette for depth
  const vig = c.createRadialGradient(cx, cy, BOARD * 0.35, cx, cy, BOARD * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(80, 30, 50, 0.07)');
  c.fillStyle = vig;
  c.fillRect(0, 0, BOARD, BOARD);
}

function ensureBoardSheet() {
  if (boardSheet) return boardSheet;
  boardSheet = document.createElement('canvas');
  boardSheet.width = BOARD;
  boardSheet.height = BOARD;
  const c = boardSheet.getContext('2d');
  if (imgs.board) {
    // Bake cream bed (stretched to square 500) — physics-locked art
    c.drawImage(
      imgs.board,
      BED_CROP.x,
      BED_CROP.y,
      BED_CROP.w,
      BED_CROP.h,
      0,
      0,
      BOARD,
      BOARD
    );
  } else {
    paint3DBoard(c);
  }
  return boardSheet;
}

/** Position transparent canvas over cream bed; full PNG shows frame around it */
function layoutBoardArt() {
  if (!stageEl || !canvas) return;
  if (!useBoardArt || !imgs.board) {
    stageEl.classList.remove('has-board-art');
    canvas.style.left = '';
    canvas.style.top = '';
    canvas.style.width = '';
    canvas.style.height = '';
    return;
  }
  stageEl.classList.add('has-board-art');
  const l = (BED_CROP.x / BOARD_SRC_SIZE) * 100;
  const t = (BED_CROP.y / BOARD_SRC_SIZE) * 100;
  const w = (BED_CROP.w / BOARD_SRC_SIZE) * 100;
  const h = (BED_CROP.h / BOARD_SRC_SIZE) * 100;
  canvas.style.left = `${l}%`;
  canvas.style.top = `${t}%`;
  canvas.style.width = `${w}%`;
  canvas.style.height = `${h}%`;
  if (boardArtEl && !boardArtEl.src.includes('CarromBoardimg')) {
    boardArtEl.src = ASSET.board;
  }
}

/* -------------------- PNG pieces (punch plates + tight crop) -------------------- */

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Remove solid black (coins/hand) or white (sticker) studio plates */
function punchPlate(img, mode) {
  if (!img) return null;
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, w, h);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const gv = d[i + 1];
    const b = d[i + 2];
    if (mode === 'black') {
      const lum = (r + gv + b) / 3;
      if (lum < 26) d[i + 3] = 0;
      else if (lum < 52) d[i + 3] = Math.round(d[i + 3] * ((lum - 26) / 26));
    } else {
      const m = Math.min(r, gv, b);
      if (m > 248) d[i + 3] = 0;
      else if (m > 220) d[i + 3] = Math.round(d[i + 3] * (1 - (m - 220) / 28));
    }
  }
  g.putImageData(data, 0, 0);
  return tightCrop(c);
}

function tightCrop(src) {
  const g = src.getContext('2d', { willReadFrequently: true });
  const w = src.width;
  const h = src.height;
  const d = g.getImageData(0, 0, w, h).data;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 18) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) return src;
  const pad = 3;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;
  const out = document.createElement('canvas');
  out.width = tw;
  out.height = th;
  out.getContext('2d').drawImage(src, minX, minY, tw, th, 0, 0, tw, th);
  return out;
}

async function loadAssets() {
  const [rawBoard, rawA, rawN, rawU, rawSticker, rawHand] = await Promise.all([
    loadImage(ASSET.board),
    loadImage(ASSET.coinA),
    loadImage(ASSET.coinN),
    loadImage(ASSET.coinU),
    loadImage(ASSET.sticker),
    loadImage(ASSET.hand),
  ]);
  imgs = {
    board: rawBoard,
    A: punchPlate(rawA, 'black'),
    N: punchPlate(rawN, 'black'),
    U: punchPlate(rawU, 'black'),
    sticker: punchPlate(rawSticker, 'white'),
    hand: punchPlate(rawHand, 'black'),
  };
  useBoardArt = !!imgs.board;
  imagesReady = !!(imgs.A && imgs.N && imgs.U && imgs.sticker);
  boardSheet = null;
  ensureBoardSheet();
  layoutBoardArt();
  syncSliderThumbArt();
  return imagesReady;
}

/** Draw PNG like hero heart — drop-shadow 3D, no wash-out blend */
function drawSprite(c, img, x, y, size) {
  if (!img) return;
  const aspect = (img.width || 1) / (img.height || 1);
  let dw = size;
  let dh = size;
  if (aspect > 1) dh = size / aspect;
  else dw = size * aspect;
  c.save();
  c.shadowColor = 'rgba(80, 20, 60, 0.4)';
  c.shadowBlur = 10;
  c.shadowOffsetY = 3;
  c.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
  c.restore();
}

function drawFallbackPuck(c, p) {
  c.beginPath();
  c.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  c.fillStyle = p.isStriker ? '#e74c3c' : p.letter === 'N' ? '#f1c40f' : p.letter === 'A' ? '#2c3e50' : '#fff';
  c.fill();
  c.strokeStyle = '#000';
  c.lineWidth = 1;
  c.stroke();
}

function drawAimHeart(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.72);
  c.bezierCurveTo(x - s * 1.05, y + s * 0.08, x - s * 1.0, y - s * 0.72, x, y - s * 0.28);
  c.bezierCurveTo(x + s * 1.0, y - s * 0.72, x + s * 1.05, y + s * 0.08, x, y + s * 0.72);
  c.closePath();
}

function drawAim(c) {
  if (!isAiming) return;
  const s = striker();
  if (!s) return;
  const tx = s.x + aimVector.x;
  const ty = s.y + aimVector.y;
  c.save();
  // Hot-pink aim line (matches board frame) — clear on cream wood
  c.beginPath();
  c.moveTo(s.x, s.y);
  c.lineTo(tx, ty);
  c.strokeStyle = 'rgba(255, 70, 150, 0.95)';
  c.lineWidth = 3.5;
  c.setLineDash([6, 5]);
  c.lineCap = 'round';
  c.shadowColor = 'rgba(255, 120, 180, 0.9)';
  c.shadowBlur = 8;
  c.stroke();
  // Soft gold under-glow for contrast
  c.strokeStyle = 'rgba(255, 214, 120, 0.55)';
  c.lineWidth = 1.5;
  c.shadowBlur = 0;
  c.stroke();
  c.setLineDash([]);
  // Heart tip instead of circle
  drawAimHeart(c, tx, ty, 8);
  const hg = c.createRadialGradient(tx - 2, ty - 3, 1, tx, ty, 9);
  hg.addColorStop(0, '#ffb0d4');
  hg.addColorStop(0.55, '#ff4d9a');
  hg.addColorStop(1, '#c02868');
  c.fillStyle = hg;
  c.shadowColor = 'rgba(200, 40, 110, 0.55)';
  c.shadowBlur = 6;
  c.fill();
  c.strokeStyle = 'rgba(255, 230, 140, 0.95)';
  c.lineWidth = 1.2;
  c.shadowBlur = 0;
  c.stroke();
  c.restore();
}

function render() {
  if (!ctx || !canvas) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, BOARD, BOARD);

  // Always draw baked bed (PNG crop or code fallback) so pieces lock to pocket pixels.
  // Full framed PNG sits behind the canvas; canvas covers only the cream bed region.
  ctx.drawImage(ensureBoardSheet(), 0, 0);

  livingCoins().forEach((p) => {
    const img = imgs[p.letter];
    if (img) drawSprite(ctx, img, p.x, p.y, p.radius * 2 * COIN_VIS);
    else drawFallbackPuck(ctx, p);
  });

  const s = striker();
  if (s?.alive) {
    if (imgs.sticker) drawSprite(ctx, imgs.sticker, s.x, s.y, s.radius * 2 * STRIKER_VIS);
    else drawFallbackPuck(ctx, s);

    if (showHandHint && !isAiming && !inputLocked && boardSettled() && imgs.hand) {
      handPulse = (handPulse + 0.04) % (Math.PI * 2);
      const bob = Math.sin(handPulse) * 2;
      const hs = s.radius * 2 * HAND_VIS;
      drawSprite(ctx, imgs.hand, s.x + hs * 0.35, s.y + hs * 0.2 + bob, hs);
    }
  }

  drawAim(ctx);
}

/* -------------------- loop -------------------- */

function stopLoop() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

function loop() {
  if (!active) return;

  if (!resolving && !isAiming && (shotInProgress || !boardSettled())) {
    const result = updatePhysics();
    if (result.pocketedTarget) onTargetPocketed(result.pocketedTarget);
    else if (shotInProgress && boardSettled()) {
      shotInProgress = false;
      if (pieces.some((p) => p.letter === phase && p.alive)) onMiss();
    }
  }

  render();
  raf = requestAnimationFrame(loop);
}

/* -------------------- story UI -------------------- */

function syncSlider() {
  if (!sliderThumb) return;
  const t = (strikerX - BASE_MIN) / (BASE_MAX - BASE_MIN);
  const p = clamp(t, 0, 1) * 100;
  sliderThumb.style.left = `${p}%`;
  if (sliderFill) sliderFill.style.width = `${p}%`;
}

function placeStriker(x) {
  strikerX = clamp(x, BASE_MIN, BASE_MAX);
  const s = striker();
  if (s && boardSettled()) {
    s.x = strikerX;
    s.y = BASELINE_Y;
    s.vx = 0;
    s.vy = 0;
  }
  syncSlider();
}

function lockInput(on) {
  inputLocked = on;
  screen?.classList.toggle('is-busy', on);
  slider?.classList.toggle('is-disabled', on);
  if (on) showHandHint = false;
}

function showMissToast(html, done) {
  if (!missEl) {
    done?.();
    return;
  }
  missEl.innerHTML = html;
  missEl.classList.add('is-on');
  gsap.fromTo(
    missEl,
    { autoAlpha: 0, y: 12, scale: 0.92 },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.3,
      ease: 'back.out(1.5)',
      onComplete: () => {
        gsap.to(missEl, {
          autoAlpha: 0,
          y: -8,
          duration: 0.25,
          delay: 0.95,
          onComplete: () => {
            missEl.classList.remove('is-on');
            done?.();
          },
        });
      },
    }
  );
}

function onMiss() {
  if (resolving) return;
  resolving = true;
  lockInput(true);
  cue && cue('wish2');

  const wrongLetters = pendingCenterRestore.slice();
  resetStrikerOnly();

  const done = () => {
    lockInput(false);
    resolving = false;
    showHandHint = true;
  };

  const msg = wrongLetters.length
    ? `Wrong coin pocketed! Back to center <span aria-hidden="true">💖</span>`
    : `Almost! Try again <span aria-hidden="true">💕</span>`;
  showMissToast(msg, done);
}

/** Slider thumb uses punched sticker so the sunflower shows clearly */
function syncSliderThumbArt() {
  const img = sliderThumb?.querySelector?.('img');
  if (!img || !imgs.sticker) return;
  try {
    img.src = imgs.sticker.toDataURL('image/png');
  } catch (_) {
    /* keep original src */
  }
}

function onTargetPocketed(letter) {
  if (resolving) return;
  resolving = true;
  shotInProgress = false;
  lockInput(true);
  pieces.forEach((p) => {
    p.vx = 0;
    p.vy = 0;
  });
  playCelebration(letter);
}

function playCelebration(letter) {
  cue && cue('hit');
  const flash = $('carromFlash');
  if (flash) {
    gsap.fromTo(flash, { autoAlpha: 0 }, { autoAlpha: 0.55, duration: 0.18, yoyo: true, repeat: 1 });
  }
  if (celeBurst) {
    celeBurst.innerHTML = '';
    const g = ['💖', '✨', '🌸', '💛', '✦', '💕'];
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span');
      s.className = 'carrom-cele-spark';
      s.textContent = g[i % g.length];
      s.style.left = `${30 + Math.random() * 40}%`;
      s.style.top = `${34 + Math.random() * 30}%`;
      celeBurst.appendChild(s);
      gsap.fromTo(
        s,
        { autoAlpha: 0, scale: 0.2 },
        {
          autoAlpha: 1,
          scale: 1,
          x: gsap.utils.random(-80, 80),
          y: gsap.utils.random(-90, -20),
          duration: 0.65,
          delay: i * 0.02,
          ease: 'power2.out',
          onComplete: () => gsap.to(s, { autoAlpha: 0, duration: 0.25 }),
        }
      );
    }
  }

  const labels = { A: 'A is pocketed! 💖', N: 'N is pocketed! ✨', U: 'U is pocketed! 🌸' };
  const next = () => afterPocket(letter);

  if (celeEl) {
    celeEl.textContent = labels[letter] || 'Nice shot!';
    celeEl.classList.add('is-on');
    gsap.fromTo(
      celeEl,
      { autoAlpha: 0, y: 14, scale: 0.9 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.35,
        ease: 'back.out(1.5)',
        onComplete: () => {
          gsap.to(celeEl, {
            autoAlpha: 0,
            y: -8,
            duration: 0.28,
            delay: 0.75,
            onComplete: () => {
              celeEl.classList.remove('is-on');
              next();
            },
          });
        },
      }
    );
  } else gsap.delayedCall(0.55, next);
}

function afterPocket(letter) {
  // Keep remaining coins where they are; only striker resets
  pieces.forEach((p) => {
    if (p.letter === letter) p.alive = false;
  });

  if (letter === 'A') {
    phase = 'N';
    resetStrikerOnly();
    gsap.delayedCall(0.22, () => {
      if (screen) gsap.to(screen, { filter: 'brightness(0.72)', duration: 0.35 });
      if (typeof onOpenMemories === 'function') onOpenMemories(() => resumeOverlay());
      else resumeOverlay();
    });
    return;
  }
  if (letter === 'N') {
    phase = 'U';
    resetStrikerOnly();
    gsap.delayedCall(0.22, () => {
      if (screen) gsap.to(screen, { filter: 'brightness(0.72)', duration: 0.35 });
      if (typeof onOpenNSlide === 'function') onOpenNSlide(() => resumeOverlay());
      else resumeOverlay();
    });
    return;
  }
  phase = 'done';
  gsap.delayedCall(0.28, () => exitTree());
}

function resumeOverlay() {
  if (!active || phase === 'done') return;
  resolving = false;
  if (screen) gsap.to(screen, { filter: 'brightness(1)', duration: 0.4 });
  resetStrikerOnly();
  lockInput(false);
  showHandHint = true;
}

function exitTree() {
  lockInput(true);
  stopLoop();
  if (!screen) {
    onCompleteToTree?.();
    return;
  }
  gsap.to(screen, {
    autoAlpha: 0,
    filter: 'brightness(1)',
    duration: 0.8,
    ease: 'power2.inOut',
    onComplete: () => {
      screen.classList.remove('is-in');
      screen.setAttribute('aria-hidden', 'true');
      screen.hidden = true;
      active = false;
      onCompleteToTree?.();
    },
  });
}

/* -------------------- input -------------------- */

function canvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = BOARD / rect.width;
  const scaleY = BOARD / rect.height;
  const clientX = e.clientX ?? e.touches?.[0]?.clientX;
  const clientY = e.clientY ?? e.touches?.[0]?.clientY;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function onPointerDown(e) {
  if (!active || inputLocked || resolving || phase === 'done') return;
  if (!boardSettled()) return;
  const s = striker();
  if (!s) return;
  const pos = canvasPos(e);
  if (Math.hypot(pos.x - s.x, pos.y - s.y) > STRIKER_R + 14) return;

  isAiming = true;
  showHandHint = false;
  aimVector = { x: 0, y: 0 };
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch (_) {}
  e.preventDefault();
}

function onPointerMove(e) {
  if (!isAiming) return;
  const s = striker();
  if (!s) return;
  const pos = canvasPos(e);
  let ax = s.x - pos.x;
  let ay = s.y - pos.y;
  const len = Math.hypot(ax, ay);
  if (len > MAX_AIM) {
    ax = (ax / len) * MAX_AIM;
    ay = (ay / len) * MAX_AIM;
  }
  aimVector = { x: ax, y: ay };
  e.preventDefault();
}

function onPointerUp(e) {
  if (!isAiming) return;
  isAiming = false;
  try {
    canvas.releasePointerCapture(e.pointerId);
  } catch (_) {}

  const power = Math.hypot(aimVector.x, aimVector.y);
  const s = striker();
  if (!s) return;

  if (reduceMotion) {
    s.vx = 0;
    s.vy = -12;
    shotInProgress = true;
    cue && cue('wish');
    aimVector = { x: 0, y: 0 };
    return;
  }

  if (power < 10) {
    aimVector = { x: 0, y: 0 };
    showHandHint = true;
    return;
  }

  s.vx = aimVector.x * POWER;
  s.vy = aimVector.y * POWER;
  shotInProgress = true;
  cue && cue('wish');
  aimVector = { x: 0, y: 0 };
}

function sliderT(e) {
  const rect = sliderTrack.getBoundingClientRect();
  return clamp((e.clientX - rect.left) / rect.width, 0, 1);
}

function onSliderDown(e) {
  if (!active || inputLocked || resolving || !boardSettled() || isAiming) return;
  sliderDragging = true;
  try {
    sliderThumb.setPointerCapture(e.pointerId);
  } catch (_) {}
  placeStriker(BASE_MIN + sliderT(e) * (BASE_MAX - BASE_MIN));
  e.preventDefault();
  e.stopPropagation();
}

function onSliderMove(e) {
  if (!sliderDragging) return;
  if (inputLocked || !boardSettled()) return;
  placeStriker(BASE_MIN + sliderT(e) * (BASE_MAX - BASE_MIN));
  e.preventDefault();
}

function onSliderUp(e) {
  sliderDragging = false;
  try {
    if (sliderThumb && e?.pointerId != null) sliderThumb.releasePointerCapture(e.pointerId);
  } catch (_) {}
}

function sizeCanvas() {
  if (!canvas) return;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(BOARD * dpr);
  canvas.height = Math.round(BOARD * dpr);
  ctx = canvas.getContext('2d');
}

/* -------------------- public API -------------------- */

export function initCarrom({
  onOpenMemories: memCb,
  onOpenNSlide: slideCb,
  onCompleteToTree: treeCb,
} = {}) {
  onOpenMemories = memCb;
  onOpenNSlide = slideCb;
  onCompleteToTree = treeCb;

  screen = $('carromScreen');
  canvas = $('carromCanvas');
  stageEl = $('carromStage');
  boardArtEl = $('carromBoardArt');
  hintEl = $('carromHint');
  titleEl = $('carromTitle');
  slider = $('carromSlider');
  sliderTrack = $('carromSliderTrack');
  sliderThumb = $('carromSliderThumb');
  sliderFill = $('carromSliderFill');
  celeEl = $('carromCele');
  celeBurst = $('carromCeleBurst');
  missEl = $('carromMiss');

  loadAssets();

  if (canvas) {
    sizeCanvas();
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
  }
  if (sliderThumb) {
    sliderThumb.addEventListener('pointerdown', onSliderDown);
    sliderThumb.addEventListener('pointermove', onSliderMove);
    sliderThumb.addEventListener('pointerup', onSliderUp);
    sliderThumb.addEventListener('pointercancel', onSliderUp);
  }
  if (sliderTrack) sliderTrack.addEventListener('pointerdown', onSliderDown);

  if (screen) {
    gsap.set(screen, { autoAlpha: 0 });
    screen.classList.remove('is-in');
    screen.setAttribute('aria-hidden', 'true');
  }
}

export async function startCarrom() {
  if (!screen || !canvas) return;
  stopLoop();
  active = true;
  phase = 'A';
  resolving = false;
  inputLocked = false;
  isAiming = false;
  shotInProgress = false;
  strikerX = BOARD / 2;

  if (!imagesReady) await loadAssets();
  boardSheet = null;
  ensureBoardSheet();
  layoutBoardArt();
  syncSliderThumbArt();

  screen.hidden = false;
  screen.classList.add('is-in');
  screen.setAttribute('aria-hidden', 'false');
  gsap.set(screen, { filter: 'brightness(1)' });

  sizeCanvas();
  resetPiecesForPhase();
  syncSlider();
  lockInput(false);
  showHandHint = true;

  gsap.fromTo(screen, { autoAlpha: 0, scale: 1.02 }, { autoAlpha: 1, scale: 1, duration: 0.85, ease: 'power2.out' });
  if (hintEl) {
    gsap.fromTo(
      hintEl,
      { autoAlpha: 0, y: 8 },
      { autoAlpha: 1, y: 0, duration: 0.35, delay: 0.2, clearProps: 'transform' }
    );
  }
  if (titleEl) {
    gsap.fromTo(
      titleEl,
      { autoAlpha: 0, y: -8 },
      { autoAlpha: 1, y: 0, duration: 0.4, delay: 0.1, clearProps: 'transform' }
    );
  }
  // Keep slider label readable (never left invisible by prior tweens)
  const slideLabel = slider?.querySelector?.('.carrom-slider__label');
  if (slideLabel) gsap.set(slideLabel, { autoAlpha: 1, clearProps: 'opacity,visibility' });

  stopLoop();
  raf = requestAnimationFrame(loop);
}

export function resetCarrom() {
  active = false;
  phase = 'A';
  resolving = false;
  inputLocked = false;
  isAiming = false;
  shotInProgress = false;
  stopLoop();
  gsap.killTweensOf([screen, hintEl, titleEl, celeEl, missEl]);
  if (celeBurst) celeBurst.innerHTML = '';
  if (celeEl) {
    celeEl.classList.remove('is-on');
    gsap.set(celeEl, { autoAlpha: 0 });
  }
  if (missEl) {
    missEl.classList.remove('is-on');
    gsap.set(missEl, { autoAlpha: 0 });
  }
  if (screen) {
    gsap.set(screen, { autoAlpha: 0, scale: 1, filter: 'brightness(1)' });
    screen.classList.remove('is-in', 'is-busy');
    screen.setAttribute('aria-hidden', 'true');
    screen.hidden = true;
  }
}

export function resizeCarrom() {
  if (!active || !canvas) return;
  sizeCanvas();
  layoutBoardArt();
}
