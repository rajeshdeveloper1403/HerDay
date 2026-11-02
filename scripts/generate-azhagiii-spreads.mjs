/**
 * Composites Azhagiii's sketch portraits onto the physical open-sketchbook
 * plates — drawn ON the paper (multiply), never polaroid frames.
 * Run: node scripts/generate-azhagiii-spreads.mjs
 *
 * Layout (mixed sides — sketch alternates L/R):
 *  p0  — dedication LEFT, sketch RIGHT
 *  p1  — sketch LEFT, note RIGHT
 *  p2  — note LEFT, sketch RIGHT
 *  …alternating…
 *  p8  — closing LEFT, sketch RIGHT
 */
import { createCanvas, loadImage } from 'canvas';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HER = join(ROOT, 'src', 'HerPics');
const PLATES = join(ROOT, 'public', 'photos', 'az-book', 'sketches');
const OUT = join(ROOT, 'public', 'photos', 'az-book');

const W = 1760;
const H = 1240;
const PAPER = {
  x: Math.round(W * 0.054),
  y: Math.round(H * 0.218),
  w: Math.round(W * 0.892),
  h: Math.round(H * 0.564),
};
const PAGE = {
  y: H * 0.248,
  h: H * 0.504,
  leftX: W * 0.086,
  leftW: W * 0.392,
  rightX: W * 0.522,
  rightW: W * 0.392,
};

const PLATE_FILES = [
  'marina-bay-sands.png',
  'gardens-by-the-bay.png',
  'merlion.png',
  'buddha-tooth.png',
  'joo-chiat.png',
  'lau-pa-sat.png',
  'marina-bay-skyline.png',
  'singapore-river.png',
  'botanic-gardens.png',
];

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** Fit the whole sketch inside the box (no crop) — shows fully. */
function containRect(img, dx, dy, dw, dh) {
  const ir = img.width / img.height;
  const tr = dw / dh;
  let w, h, x, y;
  if (ir > tr) {
    w = dw;
    h = dw / ir;
    x = dx;
    y = dy + (dh - h) / 2;
  } else {
    h = dh;
    w = dh * ir;
    x = dx + (dw - w) / 2;
    y = dy;
  }
  return { x, y, w, h };
}

/** Cover the box, optionally zoomed in (zoom 2 ≈ half the scene). */
function coverSource(img, dw, dh, zoom = 1, biasX = 0, biasY = 0) {
  const z = Math.max(1, zoom);
  const tr = dw / dh;
  const ir = img.width / img.height;
  let sw, sh;
  if (ir > tr) {
    sh = img.height / z;
    sw = sh * tr;
  } else {
    sw = img.width / z;
    sh = sw / tr;
  }
  let sx = (img.width - sw) * (0.5 + biasX);
  let sy = (img.height - sh) * (0.5 + biasY);
  sx = Math.max(0, Math.min(sx, img.width - sw));
  sy = Math.max(0, Math.min(sy, img.height - sh));
  return { sx, sy, sw, sh };
}

/** Rotate image by 90/180/270 so it matches the folder preview. */
function orientImage(img, rotateDeg) {
  const deg = ((rotateDeg % 360) + 360) % 360;
  if (!deg) return img;
  const swap = deg === 90 || deg === 270;
  const c = createCanvas(swap ? img.height : img.width, swap ? img.width : img.height);
  const ctx = c.getContext('2d');
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  return c;
}

/** Knock out near-white sketch backdrop so it sits as ink on cream paper. */
function inkLayer(img) {
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    // soft knockout of paper-white / off-white plate
    if (lum > 232) {
      const t = Math.min(1, (lum - 232) / 18);
      d[i + 3] = Math.round(d[i + 3] * (1 - t));
    }
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

function bleachPaper(ctx, seed) {
  const { x, y, w, h } = PAPER;
  const rand = rng(seed);
  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;
  const mid = w * 0.5;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const i = (py * w + px) * 4;
      if (d[i + 3] < 12) continue;
      const n = (rand() - 0.5) * 8;
      const crease = Math.max(0, 1 - Math.abs(px - mid) / 18);
      const shade = crease * 22;
      d[i] = Math.max(0, Math.min(255, 244 + n - shade));
      d[i + 1] = Math.max(0, Math.min(255, 236 + n * 0.9 - shade * 0.92));
      d[i + 2] = Math.max(0, Math.min(255, 226 + n * 0.75 - shade * 0.8));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, x, y);
}

/**
 * Draw sketch as ink ON the page — full figure, no frame/tape/shadow.
 * opts: { rotate, zoom, biasX, biasY }
 *  zoom > 1 crops in (2 ≈ half the scene)
 */
function inkPlate(ctx, img, box, opts = {}) {
  const rotate = opts.rotate || 0;
  const zoom = opts.zoom || 1;
  const biasX = opts.biasX || 0;
  const biasY = opts.biasY || 0;

  const oriented = orientImage(img, rotate);
  const plate = inkLayer(oriented);
  const insetX = box.w * 0.02;
  const insetY = box.h * 0.015;
  const dx = box.x + insetX;
  const dy = box.y + insetY;
  const dw = box.w - insetX * 2;
  const dh = box.h - insetY * 2;

  let destX, destY, destW, destH;
  let src;
  if (zoom > 1.01) {
    destX = dx;
    destY = dy;
    destW = dw;
    destH = dh;
    src = coverSource(plate, dw, dh, zoom, biasX, biasY);
  } else {
    const r = containRect(plate, dx, dy, dw, dh);
    destX = r.x;
    destY = r.y;
    destW = r.w;
    destH = r.h;
    src = { sx: 0, sy: 0, sw: plate.width, sh: plate.height };
  }

  const feather = Math.max(18, Math.min(destW, destH) * 0.045);
  const tmp = createCanvas(Math.ceil(destW), Math.ceil(destH));
  const tctx = tmp.getContext('2d');
  tctx.drawImage(plate, src.sx, src.sy, src.sw, src.sh, 0, 0, destW, destH);
  // Soft edge fade only (no heavy radial) so full sketches stay readable
  tctx.globalCompositeOperation = 'destination-in';
  const eg = tctx.createLinearGradient(0, 0, 0, destH);
  eg.addColorStop(0, 'rgba(0,0,0,0)');
  eg.addColorStop(Math.min(0.12, feather / destH), 'rgba(0,0,0,1)');
  eg.addColorStop(1 - Math.min(0.12, feather / destH), 'rgba(0,0,0,1)');
  eg.addColorStop(1, 'rgba(0,0,0,0)');
  tctx.fillStyle = eg;
  tctx.fillRect(0, 0, destW, destH);
  const eg2 = tctx.createLinearGradient(0, 0, destW, 0);
  eg2.addColorStop(0, 'rgba(0,0,0,0)');
  eg2.addColorStop(Math.min(0.12, feather / destW), 'rgba(0,0,0,1)');
  eg2.addColorStop(1 - Math.min(0.12, feather / destW), 'rgba(0,0,0,1)');
  eg2.addColorStop(1, 'rgba(0,0,0,0)');
  tctx.fillStyle = eg2;
  tctx.fillRect(0, 0, destW, destH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.97;
  ctx.drawImage(tmp, destX, destY, destW, destH);
  ctx.restore();
}

function writeLines(ctx, lines, box, color = '#3a3228') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = box.x + box.w / 2;
  let cy = box.y + box.h * 0.28;
  lines.forEach((line) => {
    ctx.font = line.font;
    ctx.globalAlpha = line.alpha ?? 0.88;
    ctx.fillText(line.text, cx, cy);
    cy += line.gap ?? 48;
  });
  ctx.restore();
}

/* ---- ink doodles (hearts / flowers / stars) for a sketchbook feel ---- */
function strokeInk(ctx, alpha = 0.48) {
  ctx.strokeStyle = `rgba(58, 50, 40, ${alpha})`;
  ctx.fillStyle = `rgba(58, 50, 40, ${alpha * 0.55})`;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function doodleHeart(ctx, x, y, s, ang = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  strokeInk(ctx, 0.42);
  ctx.lineWidth = Math.max(1.2, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(-s * 0.55, -s * 0.15, -s * 0.5, -s * 0.7, 0, -s * 0.35);
  ctx.bezierCurveTo(s * 0.5, -s * 0.7, s * 0.55, -s * 0.15, 0, s * 0.3);
  ctx.stroke();
  ctx.restore();
}

function doodleFlower(ctx, x, y, s, ang = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  strokeInk(ctx, 0.4);
  ctx.lineWidth = Math.max(1.1, s * 0.07);
  const petals = 6;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(
      Math.cos(a) * s * 0.35,
      Math.sin(a) * s * 0.35,
      s * 0.28,
      s * 0.16,
      a,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function doodleStar(ctx, x, y, s) {
  ctx.save();
  strokeInk(ctx, 0.36);
  ctx.lineWidth = Math.max(1, s * 0.1);
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x, y + s);
  ctx.moveTo(x - s, y);
  ctx.lineTo(x + s, y);
  ctx.moveTo(x - s * 0.7, y - s * 0.7);
  ctx.lineTo(x + s * 0.7, y + s * 0.7);
  ctx.moveTo(x + s * 0.7, y - s * 0.7);
  ctx.lineTo(x - s * 0.7, y + s * 0.7);
  ctx.stroke();
  ctx.restore();
}

function doodleLeaf(ctx, x, y, s, ang = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  strokeInk(ctx, 0.38);
  ctx.lineWidth = Math.max(1.1, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, s);
  ctx.quadraticCurveTo(s * 0.7, 0, 0, -s);
  ctx.quadraticCurveTo(-s * 0.7, 0, 0, s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, s * 0.7);
  ctx.lineTo(0, -s * 0.7);
  ctx.stroke();
  ctx.restore();
}

function doodleSwirl(ctx, x, y, s) {
  ctx.save();
  strokeInk(ctx, 0.34);
  ctx.lineWidth = Math.max(1.1, s * 0.08);
  ctx.beginPath();
  ctx.arc(x, y, s * 0.55, 0.2, Math.PI * 1.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, s * 0.28, -0.4, Math.PI * 1.2);
  ctx.stroke();
  ctx.restore();
}

function doodleBud(ctx, x, y, s, ang = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  strokeInk(ctx, 0.4);
  ctx.lineWidth = Math.max(1.1, s * 0.09);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.85);
  ctx.lineTo(0, s * 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.15, s * 0.28, s * 0.42, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, s * 0.45);
  ctx.quadraticCurveTo(s * 0.45, s * 0.2, s * 0.55, -s * 0.05);
  ctx.stroke();
  ctx.restore();
}

function doodleDots(ctx, x, y, s) {
  ctx.save();
  strokeInk(ctx, 0.32);
  ctx.lineWidth = 1;
  const offs = [
    [0, 0],
    [s * 0.55, -s * 0.2],
    [-s * 0.4, s * 0.35],
    [s * 0.25, s * 0.5],
  ];
  for (const [dx, dy] of offs) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, Math.max(1.2, s * 0.12), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function doodleBow(ctx, x, y, s, ang = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  strokeInk(ctx, 0.38);
  ctx.lineWidth = Math.max(1.1, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-s * 0.55, -s * 0.45, -s * 0.85, 0);
  ctx.quadraticCurveTo(-s * 0.55, s * 0.45, 0, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.55, -s * 0.45, s * 0.85, 0);
  ctx.quadraticCurveTo(s * 0.55, s * 0.45, 0, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

const DOODLE_KINDS = ['heart', 'flower', 'leaf', 'star', 'swirl', 'bud', 'dots', 'bow'];

/** Corner / margin doodles — kept away from the main portrait/text. */
function pageDoodles(ctx, box, seed) {
  const rand = rng(seed);
  const pad = Math.min(box.w, box.h) * 0.065;
  const pick = () => DOODLE_KINDS[Math.floor(rand() * DOODLE_KINDS.length)];
  const spots = [
    { x: box.x + pad, y: box.y + pad, kind: 'flower', s: 26 + rand() * 14, a: -0.45 + rand() * 0.35 },
    { x: box.x + box.w - pad, y: box.y + pad * 1.05, kind: 'heart', s: 18 + rand() * 12, a: 0.15 + rand() * 0.35 },
    { x: box.x + pad * 1.05, y: box.y + box.h - pad, kind: 'leaf', s: 20 + rand() * 12, a: -1.2 + rand() * 0.45 },
    { x: box.x + box.w - pad, y: box.y + box.h - pad * 1.05, kind: 'star', s: 11 + rand() * 6, a: 0 },
    // second ring near corners
    { x: box.x + pad * 2.4, y: box.y + pad * 0.85, kind: pick(), s: 10 + rand() * 8, a: rand() * 0.8 },
    { x: box.x + box.w - pad * 2.5, y: box.y + pad * 2.2, kind: pick(), s: 11 + rand() * 7, a: rand() * 0.6 },
    { x: box.x + pad * 2.2, y: box.y + box.h - pad * 2.3, kind: pick(), s: 12 + rand() * 8, a: -0.4 + rand() * 0.8 },
    { x: box.x + box.w - pad * 2.3, y: box.y + box.h - pad * 0.9, kind: pick(), s: 10 + rand() * 7, a: rand() * 0.5 },
    // mid-edge accents
    { x: box.x + pad * 0.85, y: box.y + box.h * (0.32 + rand() * 0.18), kind: pick(), s: 14 + rand() * 10, a: rand() * 0.6 },
    { x: box.x + box.w - pad * 0.8, y: box.y + box.h * (0.38 + rand() * 0.2), kind: pick(), s: 13 + rand() * 9, a: rand() * 0.7 },
    { x: box.x + box.w * (0.28 + rand() * 0.18), y: box.y + pad * 0.75, kind: pick(), s: 9 + rand() * 7, a: rand() },
    { x: box.x + box.w * (0.55 + rand() * 0.2), y: box.y + box.h - pad * 0.8, kind: pick(), s: 10 + rand() * 7, a: rand() },
  ];

  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  for (const d of spots) {
    if (d.kind === 'heart') doodleHeart(ctx, d.x, d.y, d.s, d.a);
    else if (d.kind === 'flower') doodleFlower(ctx, d.x, d.y, d.s, d.a);
    else if (d.kind === 'leaf') doodleLeaf(ctx, d.x, d.y, d.s, d.a);
    else if (d.kind === 'star') doodleStar(ctx, d.x, d.y, d.s);
    else if (d.kind === 'bud') doodleBud(ctx, d.x, d.y, d.s, d.a);
    else if (d.kind === 'dots') doodleDots(ctx, d.x, d.y, d.s);
    else if (d.kind === 'bow') doodleBow(ctx, d.x, d.y, d.s, d.a);
    else doodleSwirl(ctx, d.x, d.y, d.s);
  }
  ctx.restore();
}

async function makeSpread(templateFile, leftDraw, rightDraw, outName, doodleSeed = 1) {
  const book = await loadImage(join(PLATES, templateFile));
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.drawImage(book, 0, 0);
  bleachPaper(ctx, 17 + outName.charCodeAt(1) * 13);

  const left = { x: PAGE.leftX, y: PAGE.y, w: PAGE.leftW, h: PAGE.h };
  const right = { x: PAGE.rightX, y: PAGE.y, w: PAGE.rightW, h: PAGE.h };

  await leftDraw(ctx, left);
  await rightDraw(ctx, right);
  pageDoodles(ctx, left, doodleSeed * 17 + 3);
  pageDoodles(ctx, right, doodleSeed * 31 + 9);

  writeFileSync(join(OUT, outName), c.toBuffer('image/png'));
  console.log('wrote', outName);
}

mkdirSync(OUT, { recursive: true });

const s1 = await loadImage(join(HER, 'Sketch1.png'));
const s2 = await loadImage(join(HER, 'Sketch2.png'));
const s3 = await loadImage(join(HER, 'Sketch3.png'));
const s4 = await loadImage(join(HER, 'Sketch4.png'));
const s5 = await loadImage(join(HER, 'Sketch5.png'));
const s6 = await loadImage(join(HER, 'Sketch6.png'));
const s7 = await loadImage(join(HER, 'Sketch7.png'));
const s8 = await loadImage(join(HER, 'Sketch8.png'));
const s9 = await loadImage(join(HER, 'sketch9.png'));

const note = (lines) => (ctx, box) => writeLines(ctx, lines, box);
const sketch = (img, opts) => (ctx, box) => inkPlate(ctx, img, box, opts);

/* Mixed sides: sketch alternates left ↔ right across pages */
await makeSpread(
  PLATE_FILES[0],
  note([
    { text: 'For', font: 'italic 28px Georgia', gap: 42, alpha: 0.7 },
    { text: 'Azhagiii', font: 'italic 64px Georgia', gap: 58, alpha: 0.92 },
    { text: 'Happy Birthday', font: 'italic 34px Georgia', gap: 36, alpha: 0.82 },
    { text: 'A special book', font: 'italic 22px Georgia', gap: 28, alpha: 0.62 },
    { text: 'for someone special', font: 'italic 22px Georgia', gap: 40, alpha: 0.62 },
  ]),
  sketch(s3),
  'p0.png',
  1,
);

await makeSpread(
  PLATE_FILES[1],
  sketch(s1),
  note([
    { text: 'That little smile', font: 'italic 30px Georgia', gap: 42, alpha: 0.84 },
    { text: 'still lights up', font: 'italic 28px Georgia', gap: 40, alpha: 0.78 },
    { text: 'every room.', font: 'italic 28px Georgia', gap: 52, alpha: 0.78 },
  ]),
  'p1.png',
  2,
);

await makeSpread(
  PLATE_FILES[2],
  note([
    { text: 'Sunshine days', font: 'italic 30px Georgia', gap: 42, alpha: 0.84 },
    { text: 'and soft toys —', font: 'italic 28px Georgia', gap: 40, alpha: 0.78 },
    { text: 'always you.', font: 'italic 28px Georgia', gap: 52, alpha: 0.78 },
  ]),
  sketch(s2),
  'p2.png',
  3,
);

await makeSpread(
  PLATE_FILES[3],
  sketch(s4),
  note([
    { text: 'Grace in every', font: 'italic 30px Georgia', gap: 42, alpha: 0.84 },
    { text: 'step, bells and', font: 'italic 28px Georgia', gap: 40, alpha: 0.78 },
    { text: 'gold and fire.', font: 'italic 28px Georgia', gap: 52, alpha: 0.78 },
  ]),
  'p3.png',
  4,
);

await makeSpread(
  PLATE_FILES[4],
  note([
    { text: 'A smile that', font: 'italic 30px Georgia', gap: 42, alpha: 0.84 },
    { text: 'makes the page', font: 'italic 28px Georgia', gap: 40, alpha: 0.78 },
    { text: 'look back.', font: 'italic 28px Georgia', gap: 52, alpha: 0.78 },
  ]),
  sketch(s5),
  'p4.png',
  5,
);

await makeSpread(
  PLATE_FILES[5],
  sketch(s6, { rotate: 0 }),
  note([
    { text: 'Soft love,', font: 'italic 30px Georgia', gap: 42, alpha: 0.84 },
    { text: 'kept close —', font: 'italic 28px Georgia', gap: 40, alpha: 0.78 },
    { text: 'sister hearts.', font: 'italic 28px Georgia', gap: 52, alpha: 0.78 },
  ]),
  'p5.png',
  6,
);

await makeSpread(
  PLATE_FILES[6],
  note([
    { text: 'Under open sky,', font: 'italic 30px Georgia', gap: 42, alpha: 0.84 },
    { text: 'that same warm', font: 'italic 28px Georgia', gap: 40, alpha: 0.78 },
    { text: 'brightness.', font: 'italic 28px Georgia', gap: 52, alpha: 0.78 },
  ]),
  sketch(s7),
  'p6.png',
  7,
);

await makeSpread(
  PLATE_FILES[7],
  sketch(s8),
  note([
    { text: 'Quiet beauty,', font: 'italic 30px Georgia', gap: 42, alpha: 0.84 },
    { text: 'soft as dusk', font: 'italic 28px Georgia', gap: 40, alpha: 0.78 },
    { text: 'and just as sure.', font: 'italic 28px Georgia', gap: 52, alpha: 0.78 },
  ]),
  'p7.png',
  8,
);

await makeSpread(
  PLATE_FILES[8],
  note([
    { text: 'Keep this smile', font: 'italic 32px Georgia', gap: 44, alpha: 0.84 },
    { text: 'the way the page', font: 'italic 28px Georgia', gap: 40, alpha: 0.78 },
    { text: 'keeps looking back.', font: 'italic 28px Georgia', gap: 56, alpha: 0.78 },
    { text: '— with love', font: 'italic 22px Georgia', gap: 28, alpha: 0.6 },
  ]),
  sketch(s9),
  'p8.png',
  9,
);

/* Last empty spread — ready for future writing / photos */
await makeSpread(
  PLATE_FILES[0],
  () => {},
  () => {},
  'p9.png',
  11,
);

console.log('done — doodles, half Sketch7, empty last page');
