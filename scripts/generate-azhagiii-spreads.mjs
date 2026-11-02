/**
 * Composites Azhagiii's photos onto the physical open-sketchbook
 * plates (same 1760×1240 transparent PNGs the Meng To book uses).
 * Run: node scripts/generate-azhagiii-spreads.mjs
 */
import { createCanvas, loadImage } from 'canvas';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(__dirname, 'azhagiii-src');
const PHOTOS = join(ROOT, 'public', 'photos');
const OUT = join(PHOTOS, 'az-book');

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

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function coverFit(ctx, img, dx, dy, dw, dh, biasY = 0) {
  const ir = img.width / img.height;
  const tr = dw / dh;
  let sx, sy, sw, sh;
  if (ir > tr) {
    sh = img.height;
    sw = sh * tr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / tr;
    sx = 0;
    sy = Math.max(0, (img.height - sh) * (0.5 + biasY));
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
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

function tape(ctx, x, y, len, ang, seed) {
  const rand = rng(seed);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = `rgba(232, 214, 168, ${0.72 + rand() * 0.18})`;
  ctx.fillRect(-len / 2, -8, len, 16);
  ctx.strokeStyle = 'rgba(120, 90, 40, 0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-len / 2, -8, len, 16);
  ctx.restore();
}

function polaroid(ctx, img, box, rot, seed, biasY = 0) {
  const pad = 16;
  const cap = 36;
  const bw = box.w * 0.86;
  const bh = box.h * 0.86;
  const x = box.x + (box.w - bw) / 2;
  const y = box.y + (box.h - bh) / 2 - 6;
  ctx.save();
  ctx.translate(x + bw / 2, y + bh / 2);
  ctx.rotate(rot);
  ctx.translate(-bw / 2, -bh / 2);
  ctx.shadowColor = 'rgba(40, 24, 10, 0.35)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#f7f1e6';
  ctx.fillRect(0, 0, bw, bh);
  ctx.shadowColor = 'transparent';
  coverFit(ctx, img, pad, pad, bw - pad * 2, bh - pad - cap, biasY);
  ctx.strokeStyle = 'rgba(70, 48, 24, 0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, bw - 1, bh - 1);
  tape(ctx, bw * 0.18, 4, 54, -0.35, seed);
  tape(ctx, bw * 0.84, 6, 48, 0.4, seed + 9);
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

async function makeSpread(templateFile, leftDraw, rightDraw, outName) {
  const book = await loadImage(join(SRC, 'spreads', templateFile));
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.drawImage(book, 0, 0);
  bleachPaper(ctx, 17 + outName.charCodeAt(1));

  const left = { x: PAGE.leftX, y: PAGE.y, w: PAGE.leftW, h: PAGE.h };
  const right = { x: PAGE.rightX, y: PAGE.y, w: PAGE.rightW, h: PAGE.h };

  await leftDraw(ctx, left);
  await rightDraw(ctx, right);

  const out = join(OUT, outName);
  writeFileSync(out, c.toBuffer('image/png'));
  console.log('wrote', outName);
}

mkdirSync(OUT, { recursive: true });

const bookImg = await loadImage(join(PHOTOS, 'BookImage.png'));

await makeSpread(
  'marina-bay-sands.png',
  (ctx, box) => {
    writeLines(ctx, [
      { text: 'For', font: 'italic 28px Georgia', gap: 42, alpha: 0.7 },
      { text: 'Azhagiii', font: 'italic 64px Georgia', gap: 58, alpha: 0.92 },
      { text: 'Happy Birthday', font: 'italic 34px Georgia', gap: 36, alpha: 0.82 },
      { text: 'A special book', font: 'italic 22px Georgia', gap: 28, alpha: 0.62 },
      { text: 'for someone special', font: 'italic 22px Georgia', gap: 40, alpha: 0.62 },
    ], box);
  },
  (ctx, box) => polaroid(ctx, bookImg, box, -0.04, 3, -0.08),
  'p0.png'
);

await makeSpread(
  'gardens-by-the-bay.png',
  (ctx, box) => {
    writeLines(ctx, [
      { text: 'Keep this smile', font: 'italic 32px Georgia', gap: 44, alpha: 0.84 },
      { text: 'the way the page', font: 'italic 28px Georgia', gap: 40, alpha: 0.78 },
      { text: 'keeps looking back.', font: 'italic 28px Georgia', gap: 56, alpha: 0.78 },
      { text: '— with love', font: 'italic 22px Georgia', gap: 28, alpha: 0.6 },
    ], box);
  },
  () => {},
  'p1.png'
);

await makeSpread(
  'merlion.png',
  (ctx, box) => {
    writeLines(ctx, [
      { text: 'A page saved', font: 'italic 30px Georgia', gap: 42, alpha: 0.8 },
      { text: 'for the next', font: 'italic 28px Georgia', gap: 40, alpha: 0.74 },
      { text: 'little story.', font: 'italic 28px Georgia', gap: 52, alpha: 0.74 },
    ], box);
  },
  (ctx, box) => polaroid(ctx, bookImg, box, 0.03, 11, -0.08),
  'p2.png'
);

console.log('done');
